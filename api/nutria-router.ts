import * as cookie from "cookie";
import { z } from "zod";
import { Session } from "@contracts/constants";
import { createRouter, authedQuery } from "./middleware";
import { getSessionCookieOptions } from "./lib/cookies";
import * as q from "./queries/nutria";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const profileInput = z.object({
  name: z.string().min(1).max(120),
  sex: z.enum(["male", "female"]),
  age: z.number().int().min(14).max(100),
  heightCm: z.number().int().min(120).max(230),
  startWeightKg: z.number().min(35).max(300),
  activity: z.enum(["sedentary", "light", "moderate", "active", "athlete"]),
  goal: z.enum(["lose", "maintain", "gain"]),
  rateKgPerWeek: z.number().min(0).max(1.5),
  createdOn: dateStr,
});

const planInput = z.object({
  calories: z.number().int().min(800).max(8000),
  proteinG: z.number().int().min(0).max(600),
  carbsG: z.number().int().min(0).max(1200),
  fatG: z.number().int().min(0).max(500),
  estimatedExpenditure: z.number().int().min(800).max(9000),
  effectiveFrom: dateStr,
});

const customFoodInput = z.object({
  foodId: z.string().min(1).max(80),
  name: z.string().min(1).max(255),
  brand: z.string().max(255).nullish(),
  category: z.string().min(1).max(120),
  barcode: z.string().max(32).nullish(),
  source: z.string().min(1).max(24),
  kcal: z.number().min(0).max(950),
  protein: z.number().min(0).max(200),
  carbs: z.number().min(0).max(200),
  fat: z.number().min(0).max(200),
  servingDesc: z.string().min(1).max(120),
  servingG: z.number().int().min(1).max(2000),
});

const checkInInput = z.object({
  date: dateStr,
  avgIntakeKcal: z.number().int().min(0).max(15000),
  trendDeltaKg: z.number().min(-10).max(10),
  estimatedExpenditure: z.number().int().min(800).max(9000),
  previousCalories: z.number().int().min(0).max(10000),
  newCalories: z.number().int().min(0).max(10000),
  newProteinG: z.number().int().min(0).max(600),
  newCarbsG: z.number().int().min(0).max(1200),
  newFatG: z.number().int().min(0).max(500),
  explanation: z.string().max(4000),
});

export const nutriaRouter = createRouter({
  /** Todo el estado del usuario de una vez (hidratar el cliente) */
  getAll: authedQuery.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const [profile, plan, entries, foods, weights, checks] = await Promise.all([
      q.getProfile(userId),
      q.getCurrentPlan(userId),
      q.listFoodEntries(userId),
      q.listCustomFoods(userId),
      q.listWeightEntries(userId),
      q.listCheckIns(userId),
    ]);
    return { profile: profile ?? null, plan: plan ?? null, entries, foods, weights, checks };
  }),

  saveProfile: authedQuery
    .input(profileInput)
    .mutation(async ({ ctx, input }) => {
      await q.upsertProfile({ ...input, userId: ctx.user.id });
      return { ok: true };
    }),

  savePlan: authedQuery
    .input(planInput)
    .mutation(async ({ ctx, input }) => {
      await q.addPlan({ ...input, userId: ctx.user.id });
      return { ok: true };
    }),

  addFoodEntry: authedQuery
    .input(
      z.object({
        date: dateStr,
        meal: z.enum(["breakfast", "lunch", "dinner", "snacks"]),
        foodId: z.string().min(1).max(80),
        grams: z.number().int().min(1).max(2000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const id = await q.insertFoodEntry({ ...input, userId: ctx.user.id });
      return { id };
    }),

  deleteFoodEntry: authedQuery
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await q.deleteFoodEntry(ctx.user.id, input.id);
      return { ok: true };
    }),

  addCustomFood: authedQuery
    .input(customFoodInput)
    .mutation(async ({ ctx, input }) => {
      await q.upsertCustomFood({ ...input, brand: input.brand ?? null, barcode: input.barcode ?? null, userId: ctx.user.id });
      return { ok: true };
    }),

  upsertWeight: authedQuery
    .input(z.object({ date: dateStr, kg: z.number().min(35).max(300) }))
    .mutation(async ({ ctx, input }) => {
      await q.upsertWeight({ ...input, userId: ctx.user.id });
      return { ok: true };
    }),

  deleteWeight: authedQuery
    .input(z.object({ date: dateStr }))
    .mutation(async ({ ctx, input }) => {
      await q.deleteWeight(ctx.user.id, input.date);
      return { ok: true };
    }),

  /** Check-in semanal: guarda el ajuste y el nuevo plan en una transacción */
  addCheckIn: authedQuery
    .input(z.object({ checkIn: checkInInput, plan: planInput }))
    .mutation(async ({ ctx, input }) => {
      await q.insertCheckIn({ ...input.checkIn, userId: ctx.user.id });
      await q.addPlan({ ...input.plan, userId: ctx.user.id });
      return { ok: true };
    }),

  /** Migración inicial: sube el estado local la primera vez que se inicia sesión */
  importLocal: authedQuery
    .input(
      z.object({
        profile: profileInput,
        plan: planInput,
        foodEntries: z
          .array(
            z.object({
              date: dateStr,
              meal: z.enum(["breakfast", "lunch", "dinner", "snacks"]),
              foodId: z.string().min(1).max(80),
              grams: z.number().int().min(1).max(2000),
            }),
          )
          .max(5000),
        customFoods: z.array(customFoodInput).max(2000),
        weightEntries: z.array(z.object({ date: dateStr, kg: z.number().min(35).max(300) })).max(2000),
        checkIns: z.array(checkInInput).max(200),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Solo si el servidor no tiene ya datos (evita duplicar)
      const existing = await q.getProfile(ctx.user.id);
      if (existing) return { imported: false };
      await q.importLocalData(ctx.user.id, input);
      return { imported: true };
    }),

  /** Reemplaza TODOS los datos del usuario (cargar demo, reiniciar con importación) */
  replaceAll: authedQuery
    .input(
      z.object({
        profile: profileInput,
        plan: planInput,
        foodEntries: z
          .array(
            z.object({
              date: dateStr,
              meal: z.enum(["breakfast", "lunch", "dinner", "snacks"]),
              foodId: z.string().min(1).max(80),
              grams: z.number().int().min(1).max(2000),
            }),
          )
          .max(5000),
        customFoods: z.array(customFoodInput).max(2000),
        weightEntries: z.array(z.object({ date: dateStr, kg: z.number().min(35).max(300) })).max(2000),
        checkIns: z.array(checkInInput).max(200),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await q.importLocalData(ctx.user.id, input, true);
      return { ok: true };
    }),

  resetData: authedQuery.mutation(async ({ ctx }) => {
    await q.resetUserData(ctx.user.id);
    return { ok: true };
  }),

  /** Portabilidad RGPD: descarga todos tus datos en JSON */
  exportData: authedQuery.query(({ ctx }) => q.exportUserData(ctx.user.id)),

  /** Borra la cuenta y todos los datos asociados, y cierra la sesión */
  deleteAccount: authedQuery.mutation(async ({ ctx }) => {
    await q.deleteUserAccount(ctx.user.id);
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      }),
    );
    return { ok: true };
  }),
});
