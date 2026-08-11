import type {
  ActivityLevel,
  CheckIn,
  FoodItem,
  FoodLogEntry,
  Goal,
  MacroPlan,
  Profile,
  WeightEntry,
} from '@/types'
import { addDays, formatISO, parseISO, differenceInCalendarDays } from 'date-fns'

export const KCAL_PER_KG = 7700 // kcal por kg de tejido corporal
export const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 }

export function todayStr(): string {
  return formatISO(new Date(), { representation: 'date' })
}

/* ---------------- Estimaciones iniciales ---------------- */

/** Ecuación de Mifflin-St Jeor (TMB) */
export function mifflinStJeor(sex: 'male' | 'female', kg: number, cm: number, age: number): number {
  const base = 10 * kg + 6.25 * cm - 5 * age
  return sex === 'male' ? base + 5 : base - 161
}

export const ACTIVITY_FACTORS: Record<ActivityLevel, { factor: number; label: string; desc: string }> = {
  sedentary: { factor: 1.35, label: 'Sedentario', desc: 'Trabajo de oficina, poco movimiento' },
  light: { factor: 1.5, label: 'Ligero', desc: 'Caminatas diarias, 1-3 entrenos/semana' },
  moderate: { factor: 1.65, label: 'Moderado', desc: '3-5 entrenos/semana, trabajo activo' },
  active: { factor: 1.8, label: 'Activo', desc: '6-7 entrenos/semana o trabajo físico' },
  athlete: { factor: 1.95, label: 'Atleta', desc: 'Doble sesión, deporte de alto nivel' },
}

export const GOAL_LABELS: Record<Goal, string> = {
  lose: 'Perder grasa',
  maintain: 'Mantener peso',
  gain: 'Ganar músculo',
}

/** Tasas recomendadas por objetivo (kg/semana) */
export const RATE_OPTIONS: Record<Goal, { value: number; label: string }[]> = {
  lose: [
    { value: 0.25, label: 'Suave · 0,25 kg/sem' },
    { value: 0.5, label: 'Recomendado · 0,5 kg/sem' },
    { value: 0.75, label: 'Agresivo · 0,75 kg/sem' },
    { value: 1.0, label: 'Máximo · 1 kg/sem' },
  ],
  maintain: [{ value: 0, label: 'Mantenimiento' }],
  gain: [
    { value: 0.1, label: 'Magro · 0,1 kg/sem' },
    { value: 0.25, label: 'Recomendado · 0,25 kg/sem' },
    { value: 0.5, label: 'Agresivo · 0,5 kg/sem' },
  ],
}

/** Superávit/déficit diario necesario para una tasa de cambio */
export function dailyDeltaForRate(goal: Goal, rateKgPerWeek: number): number {
  const daily = (rateKgPerWeek * KCAL_PER_KG) / 7
  if (goal === 'lose') return -daily
  if (goal === 'gain') return daily
  return 0
}

/** Reparto de macros basado en evidencia: proteína alta según objetivo */
export function macrosForCalories(profile: Profile, calories: number, weightKg: number): Omit<MacroPlan, 'effectiveFrom' | 'estimatedExpenditure'> {
  const proteinPerKg = profile.goal === 'lose' ? 2.0 : profile.goal === 'gain' ? 1.8 : 1.6
  const proteinG = Math.round(proteinPerKg * weightKg)
  const fatKcalPct = profile.goal === 'gain' ? 0.25 : 0.28
  const fatG = Math.round((calories * fatKcalPct) / KCAL_PER_G.fat)
  const carbsG = Math.max(
    0,
    Math.round((calories - proteinG * KCAL_PER_G.protein - fatG * KCAL_PER_G.fat) / KCAL_PER_G.carbs),
  )
  return { calories: Math.round(calories), proteinG, carbsG, fatG }
}

export function initialPlan(profile: Profile): MacroPlan {
  const bmr = mifflinStJeor(profile.sex, profile.startWeightKg, profile.heightCm, profile.age)
  const tdee = bmr * ACTIVITY_FACTORS[profile.activity].factor
  const target = Math.max(1200, tdee + dailyDeltaForRate(profile.goal, profile.rateKgPerWeek))
  return {
    ...macrosForCalories(profile, target, profile.startWeightKg),
    effectiveFrom: todayStr(),
    estimatedExpenditure: Math.round(tdee),
  }
}

/* ---------------- Tendencia de peso ---------------- */

/**
 * Tendencia de peso con media móvil exponencial (alfa ~0.1, como MacroFactor).
 * Devuelve pares [fecha, pesoTendencia].
 */
export function weightTrend(weights: WeightEntry[]): { date: string; trend: number }[] {
  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date))
  if (sorted.length === 0) return []
  const alpha = 0.1
  const out: { date: string; trend: number }[] = []
  let trend = sorted[0].kg
  for (const w of sorted) {
    trend = trend + alpha * (w.kg - trend)
    out.push({ date: w.date, trend: Math.round(trend * 100) / 100 })
  }
  return out
}

export function currentTrendWeight(weights: WeightEntry[]): number | null {
  const t = weightTrend(weights)
  return t.length ? t[t.length - 1].trend : null
}

/* ---------------- Registro de comida ---------------- */

export function entryMacros(food: FoodItem, grams: number) {
  const f = grams / 100
  return {
    kcal: food.kcal * f,
    protein: food.protein * f,
    carbs: food.carbs * f,
    fat: food.fat * f,
  }
}

export function dayTotals(entries: FoodLogEntry[], foods: FoodItem[]) {
  const map = new Map(foods.map((f) => [f.id, f]))
  let kcal = 0,
    protein = 0,
    carbs = 0,
    fat = 0
  for (const e of entries) {
    const food = map.get(e.foodId)
    if (!food) continue
    const m = entryMacros(food, e.grams)
    kcal += m.kcal
    protein += m.protein
    carbs += m.carbs
    fat += m.fat
  }
  return { kcal, protein, carbs, fat }
}

/* ---------------- Algoritmo adaptativo ---------------- */

/**
 * Estima el gasto energético real a partir de la ingesta media y el cambio
 * de la tendencia de peso en una ventana de días:
 *   gasto = ingestaMedia − (ΔtendenciaKg/día × 7700)
 * Se suaviza con la estimación anterior (60% nuevo / 40% previo).
 */
export function estimateExpenditure(
  avgIntakeKcal: number,
  trendDeltaKg: number,
  days: number,
  previousEstimate: number,
): number {
  if (days < 5 || avgIntakeKcal <= 0) return previousEstimate
  const raw = avgIntakeKcal - (trendDeltaKg / days) * KCAL_PER_KG
  const clamped = Math.min(Math.max(raw, previousEstimate * 0.85), previousEstimate * 1.15)
  return Math.round(0.6 * clamped + 0.4 * previousEstimate)
}

export interface WeekSummary {
  daysWithIntake: number
  avgIntakeKcal: number
  trendStart: number | null
  trendEnd: number | null
  trendDeltaKg: number
  days: number
  adherencePct: number // % de días con registro
}

export function summarizeWeek(
  foodLog: FoodLogEntry[],
  foods: FoodItem[],
  weights: WeightEntry[],
  endDate: string,
): WeekSummary {
  const end = parseISO(endDate)
  const start = addDays(end, -6)
  const dayList = Array.from({ length: 7 }, (_, i) => formatISO(addDays(start, i), { representation: 'date' }))

  let intakeSum = 0
  let daysWithIntake = 0
  for (const d of dayList) {
    const tot = dayTotals(foodLog.filter((e) => e.date === d), foods)
    if (tot.kcal > 0) {
      intakeSum += tot.kcal
      daysWithIntake++
    }
  }

  const trend = weightTrend(weights)
  const inRange = trend.filter((t) => t.date >= dayList[0] && t.date <= endDate)
  const before = trend.filter((t) => t.date < dayList[0])
  const trendStart = inRange.length ? inRange[0].trend : before.length ? before[before.length - 1].trend : null
  const trendEnd = inRange.length ? inRange[inRange.length - 1].trend : trendStart

  return {
    daysWithIntake,
    avgIntakeKcal: daysWithIntake ? Math.round(intakeSum / daysWithIntake) : 0,
    trendStart,
    trendEnd,
    trendDeltaKg: trendStart != null && trendEnd != null ? Math.round((trendEnd - trendStart) * 100) / 100 : 0,
    days: 7,
    adherencePct: Math.round((daysWithIntake / 7) * 100),
  }
}

/** Genera el check-in semanal: nuevo gasto estimado + nuevo plan */
export function buildCheckIn(
  profile: Profile,
  plan: MacroPlan,
  summary: WeekSummary,
  currentWeightKg: number,
): CheckIn {
  const newExpenditure = estimateExpenditure(
    summary.avgIntakeKcal,
    summary.trendDeltaKg,
    summary.daysWithIntake >= 5 ? summary.days : summary.daysWithIntake,
    plan.estimatedExpenditure,
  )
  const target = Math.max(1200, newExpenditure + dailyDeltaForRate(profile.goal, profile.rateKgPerWeek))
  const macros = macrosForCalories(profile, target, currentWeightKg)

  const parts: string[] = []
  if (summary.daysWithIntake < 5) {
    parts.push('Pocos días registrados esta semana: la estimación es menos precisa. Intenta registrar al menos 5 días.')
  }
  const delta = summary.trendDeltaKg
  const goalDir = profile.goal === 'lose' ? -1 : profile.goal === 'gain' ? 1 : 0
  if (goalDir === -1) {
    if (delta <= -profile.rateKgPerWeek * 0.6) parts.push('La tendencia de peso baja al ritmo previsto. El plan se mantiene en la dirección correcta.')
    else if (delta > 0) parts.push('La tendencia subió pese al déficit previsto: tu gasto real era menor al estimado y se ha corregido a la baja.')
    else parts.push('La pérdida es más lenta de lo previsto: el coach ajusta calorías para acercarte al ritmo objetivo.')
  } else if (goalDir === 1) {
    if (delta >= profile.rateKgPerWeek * 0.6) parts.push('La ganancia sigue el ritmo previsto sin exceso de grasa aparente.')
    else parts.push('La ganancia es más lenta de lo previsto: se ajusta el superávit al alza.')
  } else {
    if (Math.abs(delta) < 0.15) parts.push('Peso estable: el gasto estimado coincide con tu ingesta. Plan sin cambios relevantes.')
    else parts.push('Se detectó una deriva de peso: el gasto estimado se ha recalibrado.')
  }
  if (Math.abs(newExpenditure - plan.estimatedExpenditure) > 50) {
    parts.push(
      `Nuevo gasto estimado: ${newExpenditure} kcal/día (antes ${plan.estimatedExpenditure}).`,
    )
  }

  return {
    date: todayStr(),
    avgIntakeKcal: summary.avgIntakeKcal,
    trendDeltaKg: summary.trendDeltaKg,
    estimatedExpenditure: newExpenditure,
    previousCalories: plan.calories,
    newCalories: macros.calories,
    newProteinG: macros.proteinG,
    newCarbsG: macros.carbsG,
    newFatG: macros.fatG,
    explanation: parts.join(' '),
  }
}

/* ---------------- Proyecciones ---------------- */

/** Fecha estimada de objetivo dado el ritmo actual */
export function projectGoalDate(weights: WeightEntry[], goalWeightKg: number): string | null {
  const t = weightTrend(weights)
  if (t.length < 7) return null
  const last7 = t.slice(-7)
  const rate = (last7[last7.length - 1].trend - last7[0].trend) / 6 // kg/día
  if (Math.abs(rate) < 0.005) return null
  const remaining = goalWeightKg - last7[last7.length - 1].trend
  if (remaining * rate <= 0) return null
  const days = Math.abs(remaining / rate)
  if (days > 365 * 3) return null
  return formatISO(addDays(parseISO(t[t.length - 1].date), Math.round(days)), { representation: 'date' })
}

export function daysSince(dateISO: string): number {
  return differenceInCalendarDays(new Date(), parseISO(dateISO))
}
