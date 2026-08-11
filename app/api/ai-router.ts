import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery } from "./middleware";
import * as q from "./queries/nutria";
import { FOOD_DB } from "@contracts/foods";

/**
 * Apartado de IA — llama a la API de Moonshot (OpenAI-compatible).
 * Configura MOONSHOT_API_KEY (y opcionalmente MOONSHOT_BASE_URL / MOONSHOT_MODEL).
 */

const BASE_URL = () => process.env.MOONSHOT_BASE_URL ?? "https://api.moonshot.ai/v1";
const MODEL = () => process.env.MOONSHOT_MODEL ?? "kimi-k2-0905-preview";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function moonshotChat(messages: ChatMessage[], jsonMode = false): Promise<string> {
  const apiKey = process.env.MOONSHOT_API_KEY;
  if (!apiKey) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "La IA no está configurada: falta MOONSHOT_API_KEY en el servidor. Consigue una clave gratuita en platform.moonshot.ai y añádela a las variables de entorno.",
    });
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const resp = await fetch(`${BASE_URL()}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL(),
        messages,
        temperature: 0.4,
        ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new TRPCError({
        code: "BAD_GATEWAY",
        message: `La API de IA respondió ${resp.status}: ${text.slice(0, 300)}`,
      });
    }
    const data = (await resp.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new TRPCError({ code: "BAD_GATEWAY", message: "Respuesta vacía de la IA" });
    return content;
  } finally {
    clearTimeout(timeout);
  }
}

const COACH_SYSTEM = `Eres NutriAdapt AI, un coach nutricional amable, conciso y basado en evidencia.
Reglas:
- Respondes SIEMPRE en español, tono cercano y motivador, con respuestas cortas (máx. 120 palabras salvo que pidan detalle).
- Usas los datos del usuario (perfil, plan, consumo de hoy) que se incluyen en el contexto.
- No das consejo médico; ante síntomas, embarazo o trastornos alimentarios recomiendas acudir a un profesional.
- Priorizas proteína suficiente, adherencia a largo plazo y cero culpa por días malos.`;

const parsedItemSchema = z.object({
  foodId: z.string().nullable(),
  name: z.string(),
  grams: z.number().min(1).max(2000),
  kcal: z.number().min(0).max(5000),
  protein: z.number().min(0).max(500),
  carbs: z.number().min(0).max(500),
  fat: z.number().min(0).max(500),
});

export const aiRouter = createRouter({
  history: authedQuery.query(({ ctx }) => q.listAiMessages(ctx.user.id)),

  clear: authedQuery.mutation(async ({ ctx }) => {
    await q.clearAiMessages(ctx.user.id);
    return { ok: true };
  }),

  chat: authedQuery
    .input(z.object({ message: z.string().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const [profile, plan, checks, history] = await Promise.all([
        q.getProfile(userId),
        q.getCurrentPlan(userId),
        q.listCheckIns(userId),
        q.listAiMessages(userId, 20),
      ]);

      const contextParts: string[] = [];
      if (profile) {
        contextParts.push(
          `Perfil: ${profile.name}, ${profile.sex === "male" ? "hombre" : "mujer"}, ${profile.age} años, ${profile.heightCm} cm, inicio ${profile.startWeightKg} kg, objetivo ${profile.goal} a ${profile.rateKgPerWeek} kg/sem.`,
        );
      }
      if (plan) {
        contextParts.push(
          `Plan actual: ${plan.calories} kcal/día (P ${plan.proteinG} g, C ${plan.carbsG} g, G ${plan.fatG} g). Gasto estimado: ${plan.estimatedExpenditure} kcal.`,
        );
      }
      if (checks.length > 0) {
        const last = checks[checks.length - 1];
        contextParts.push(
          `Último check-in (${last.date}): ingesta media ${last.avgIntakeKcal} kcal, tendencia ${last.trendDeltaKg} kg.`,
        );
      }

      const messages: ChatMessage[] = [
        { role: "system", content: COACH_SYSTEM + "\n\nContexto del usuario:\n" + (contextParts.join("\n") || "Sin datos aún.") },
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: input.message },
      ];

      const reply = await moonshotChat(messages);
      await q.insertAiMessage({ userId, role: "user", content: input.message });
      await q.insertAiMessage({ userId, role: "assistant", content: reply });
      return { reply };
    }),

  /** Interpreta una descripción de comida y devuelve ítems con macros estimados */
  parseMeal: authedQuery
    .input(z.object({ description: z.string().min(2).max(1000) }))
    .mutation(async ({ input }) => {
      const compactDb = FOOD_DB.map(
        (f) => `${f.id}|${f.name}|${f.kcal}kcal P${f.protein} C${f.carbs} G${f.fat} por 100g`,
      ).join("\n");

      const system = `Eres un analizador nutricional. El usuario describe lo que comió en español.
Debes devolver EXCLUSIVAMENTE un JSON con la forma {"items":[...]}.
Cada ítem: {"foodId": string|null, "name": string, "grams": number, "kcal": number, "protein": number, "carbs": number, "fat": number}
- Si el alimento coincide con uno de la base (abajo), usa su "foodId" y calcula los macros totales para los gramos estimados a partir de sus valores por 100 g.
- Si no coincide, foodId=null y estima macros totales razonables para la porción descrita.
- kcal/protein/carbs/fat son TOTALES del ítem (no por 100 g). protein/carbs/fat en gramos.
- Si no se indica cantidad, asume una porción típica.
- Nada de texto fuera del JSON.

Base de alimentos (id|nombre|valores por 100 g):
${compactDb}`;

      const raw = await moonshotChat(
        [
          { role: "system", content: system },
          { role: "user", content: input.description },
        ],
        true,
      );

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "La IA no devolvió JSON válido. Inténtalo de nuevo." });
      }
      const items = z.object({ items: z.array(parsedItemSchema).min(1).max(20) }).safeParse(parsed);
      if (!items.success) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No pude interpretar la descripción. Prueba con más detalle (cantidades, ingredientes)." });
      }
      return items.data;
    }),
});
