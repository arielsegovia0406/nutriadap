import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  int,
  double,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  /** Solo para cuentas de email (scrypt "salt:hash"); null en cuentas Kimi */
  passwordHash: varchar("passwordHash", { length: 255 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/* ---------------- NutriAdapt ---------------- */

export const profiles = mysqlTable("profiles", {
  userId: bigint("userId", { mode: "number", unsigned: true }).primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  sex: mysqlEnum("sex", ["male", "female"]).notNull(),
  age: int("age").notNull(),
  heightCm: int("heightCm").notNull(),
  startWeightKg: double("startWeightKg").notNull(),
  activity: mysqlEnum("activity", ["sedentary", "light", "moderate", "active", "athlete"]).notNull(),
  goal: mysqlEnum("goal", ["lose", "maintain", "gain"]).notNull(),
  rateKgPerWeek: double("rateKgPerWeek").notNull(),
  createdOn: varchar("createdOn", { length: 10 }).notNull(), // YYYY-MM-DD
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
export type ProfileRow = typeof profiles.$inferSelect;

export const plans = mysqlTable("plans", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  calories: int("calories").notNull(),
  proteinG: int("proteinG").notNull(),
  carbsG: int("carbsG").notNull(),
  fatG: int("fatG").notNull(),
  estimatedExpenditure: int("estimatedExpenditure").notNull(),
  effectiveFrom: varchar("effectiveFrom", { length: 10 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PlanRow = typeof plans.$inferSelect;

export const foodEntries = mysqlTable(
  "food_entries",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    date: varchar("date", { length: 10 }).notNull(),
    meal: mysqlEnum("meal", ["breakfast", "lunch", "dinner", "snacks"]).notNull(),
    foodId: varchar("foodId", { length: 80 }).notNull(),
    grams: int("grams").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({ userDateIdx: index("fe_user_date_idx").on(t.userId, t.date) }),
);
export type FoodEntryRow = typeof foodEntries.$inferSelect;

export const customFoods = mysqlTable(
  "custom_foods",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    foodId: varchar("foodId", { length: 80 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    brand: varchar("brand", { length: 255 }),
    category: varchar("category", { length: 120 }).notNull(),
    barcode: varchar("barcode", { length: 32 }),
    source: varchar("source", { length: 24 }).notNull().default("openfoodfacts"),
    kcal: double("kcal").notNull(),
    protein: double("protein").notNull(),
    carbs: double("carbs").notNull(),
    fat: double("fat").notNull(),
    servingDesc: varchar("servingDesc", { length: 120 }).notNull(),
    servingG: int("servingG").notNull(),
  },
  (t) => ({ userFoodUq: uniqueIndex("cf_user_food_uq").on(t.userId, t.foodId) }),
);
export type CustomFoodRow = typeof customFoods.$inferSelect;

export const weightEntries = mysqlTable(
  "weight_entries",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    date: varchar("date", { length: 10 }).notNull(),
    kg: double("kg").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({ userDateUq: uniqueIndex("we_user_date_uq").on(t.userId, t.date) }),
);
export type WeightEntryRow = typeof weightEntries.$inferSelect;

export const checkIns = mysqlTable("check_ins", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  avgIntakeKcal: int("avgIntakeKcal").notNull(),
  trendDeltaKg: double("trendDeltaKg").notNull(),
  estimatedExpenditure: int("estimatedExpenditure").notNull(),
  previousCalories: int("previousCalories").notNull(),
  newCalories: int("newCalories").notNull(),
  newProteinG: int("newProteinG").notNull(),
  newCarbsG: int("newCarbsG").notNull(),
  newFatG: int("newFatG").notNull(),
  explanation: text("explanation").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CheckInRow = typeof checkIns.$inferSelect;

export const aiMessages = mysqlTable(
  "ai_messages",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    role: mysqlEnum("role", ["user", "assistant"]).notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({ userIdx: index("ai_user_idx").on(t.userId) }),
);
export type AiMessageRow = typeof aiMessages.$inferSelect;
