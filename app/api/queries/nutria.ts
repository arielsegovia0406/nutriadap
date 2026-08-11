import { getDb } from "./connection";
import {
  users,
  profiles,
  plans,
  foodEntries,
  customFoods,
  weightEntries,
  checkIns,
  aiMessages,
} from "@db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function getProfile(userId: number) {
  return getDb().query.profiles.findFirst({ where: eq(profiles.userId, userId) });
}

export async function upsertProfile(
  data: Omit<typeof profiles.$inferInsert, "updatedAt">,
) {
  await getDb()
    .insert(profiles)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        name: data.name,
        sex: data.sex,
        age: data.age,
        heightCm: data.heightCm,
        startWeightKg: data.startWeightKg,
        activity: data.activity,
        goal: data.goal,
        rateKgPerWeek: data.rateKgPerWeek,
        createdOn: data.createdOn,
      },
    });
}

export async function getCurrentPlan(userId: number) {
  return getDb().query.plans.findFirst({
    where: eq(plans.userId, userId),
    orderBy: desc(plans.id),
  });
}

export async function addPlan(data: typeof plans.$inferInsert) {
  await getDb().insert(plans).values(data);
}

export async function listFoodEntries(userId: number) {
  return getDb().query.foodEntries.findMany({
    where: eq(foodEntries.userId, userId),
  });
}

export async function insertFoodEntry(data: typeof foodEntries.$inferInsert) {
  const [{ id }] = await getDb().insert(foodEntries).values(data).$returningId();
  return id;
}

export async function deleteFoodEntry(userId: number, id: number) {
  await getDb()
    .delete(foodEntries)
    .where(and(eq(foodEntries.id, id), eq(foodEntries.userId, userId)));
}

export async function listCustomFoods(userId: number) {
  return getDb().query.customFoods.findMany({
    where: eq(customFoods.userId, userId),
  });
}

export async function upsertCustomFood(data: typeof customFoods.$inferInsert) {
  await getDb()
    .insert(customFoods)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        name: data.name,
        brand: data.brand ?? null,
        kcal: data.kcal,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        servingDesc: data.servingDesc,
        servingG: data.servingG,
      },
    });
}

export async function listWeightEntries(userId: number) {
  return getDb().query.weightEntries.findMany({
    where: eq(weightEntries.userId, userId),
    orderBy: weightEntries.date,
  });
}

export async function upsertWeight(data: typeof weightEntries.$inferInsert) {
  await getDb()
    .insert(weightEntries)
    .values(data)
    .onDuplicateKeyUpdate({ set: { kg: data.kg } });
}

export async function deleteWeight(userId: number, date: string) {
  await getDb()
    .delete(weightEntries)
    .where(and(eq(weightEntries.userId, userId), eq(weightEntries.date, date)));
}

export async function listCheckIns(userId: number) {
  return getDb().query.checkIns.findMany({
    where: eq(checkIns.userId, userId),
    orderBy: checkIns.date,
  });
}

export async function insertCheckIn(data: typeof checkIns.$inferInsert) {
  await getDb().insert(checkIns).values(data);
}

export async function listAiMessages(userId: number, limit = 50) {
  const rows = await getDb().query.aiMessages.findMany({
    where: eq(aiMessages.userId, userId),
    orderBy: desc(aiMessages.id),
    limit,
  });
  return rows.reverse();
}

export async function insertAiMessage(data: typeof aiMessages.$inferInsert) {
  await getDb().insert(aiMessages).values(data);
}

export async function clearAiMessages(userId: number) {
  await getDb().delete(aiMessages).where(eq(aiMessages.userId, userId));
}

/** Importación masiva (migración desde localStorage en el primer login).
 *  Si replace=true, borra antes los datos existentes (p. ej. al cargar datos demo). */
export async function importLocalData(
  userId: number,
  data: {
    profile: Omit<typeof profiles.$inferInsert, "updatedAt" | "userId">;
    plan: Omit<typeof plans.$inferInsert, "id" | "createdAt" | "userId">;
    foodEntries: Omit<typeof foodEntries.$inferInsert, "id" | "createdAt" | "userId">[];
    customFoods: Omit<typeof customFoods.$inferInsert, "id" | "userId">[];
    weightEntries: Omit<typeof weightEntries.$inferInsert, "id" | "createdAt" | "userId">[];
    checkIns: Omit<typeof checkIns.$inferInsert, "id" | "createdAt" | "userId">[];
  },
  replace = false,
) {
  await getDb().transaction(async (tx) => {
    if (replace) {
      await tx.delete(profiles).where(eq(profiles.userId, userId));
      await tx.delete(plans).where(eq(plans.userId, userId));
      await tx.delete(foodEntries).where(eq(foodEntries.userId, userId));
      await tx.delete(customFoods).where(eq(customFoods.userId, userId));
      await tx.delete(weightEntries).where(eq(weightEntries.userId, userId));
      await tx.delete(checkIns).where(eq(checkIns.userId, userId));
    }
    await tx
      .insert(profiles)
      .values({ ...data.profile, userId })
      .onDuplicateKeyUpdate({ set: { ...data.profile } });
    await tx.insert(plans).values({ ...data.plan, userId });
    for (const e of data.foodEntries) {
      await tx.insert(foodEntries).values({ ...e, userId });
    }
    for (const f of data.customFoods) {
      await tx
        .insert(customFoods)
        .values({ ...f, userId })
        .onDuplicateKeyUpdate({ set: { name: f.name } });
    }
    for (const w of data.weightEntries) {
      await tx
        .insert(weightEntries)
        .values({ ...w, userId })
        .onDuplicateKeyUpdate({ set: { kg: w.kg } });
    }
    for (const c of data.checkIns) {
      await tx.insert(checkIns).values({ ...c, userId });
    }
  });
}

export async function resetUserData(userId: number) {
  await getDb().transaction(async (tx) => {
    await tx.delete(profiles).where(eq(profiles.userId, userId));
    await tx.delete(plans).where(eq(plans.userId, userId));
    await tx.delete(foodEntries).where(eq(foodEntries.userId, userId));
    await tx.delete(customFoods).where(eq(customFoods.userId, userId));
    await tx.delete(weightEntries).where(eq(weightEntries.userId, userId));
    await tx.delete(checkIns).where(eq(checkIns.userId, userId));
    await tx.delete(aiMessages).where(eq(aiMessages.userId, userId));
  });
}

/** Exporta todos los datos del usuario (portabilidad RGPD) */
export async function exportUserData(userId: number) {
  const [profile, plansList, entries, foods, weights, checks, messages] =
    await Promise.all([
      getDb().query.profiles.findFirst({ where: eq(profiles.userId, userId) }),
      getDb().query.plans.findMany({ where: eq(plans.userId, userId) }),
      getDb().query.foodEntries.findMany({ where: eq(foodEntries.userId, userId) }),
      getDb().query.customFoods.findMany({ where: eq(customFoods.userId, userId) }),
      getDb().query.weightEntries.findMany({ where: eq(weightEntries.userId, userId) }),
      getDb().query.checkIns.findMany({ where: eq(checkIns.userId, userId) }),
      getDb().query.aiMessages.findMany({ where: eq(aiMessages.userId, userId) }),
    ]);
  return {
    exportedAt: new Date().toISOString(),
    profile: profile ?? null,
    plans: plansList,
    foodEntries: entries,
    customFoods: foods,
    weightEntries: weights,
    checkIns: checks,
    aiMessages: messages,
  };
}

/** Borra la cuenta por completo: datos + fila de usuario */
export async function deleteUserAccount(userId: number) {
  await getDb().transaction(async (tx) => {
    await tx.delete(profiles).where(eq(profiles.userId, userId));
    await tx.delete(plans).where(eq(plans.userId, userId));
    await tx.delete(foodEntries).where(eq(foodEntries.userId, userId));
    await tx.delete(customFoods).where(eq(customFoods.userId, userId));
    await tx.delete(weightEntries).where(eq(weightEntries.userId, userId));
    await tx.delete(checkIns).where(eq(checkIns.userId, userId));
    await tx.delete(aiMessages).where(eq(aiMessages.userId, userId));
    await tx.delete(users).where(eq(users.id, userId));
  });
}
