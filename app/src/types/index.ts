export type Sex = 'male' | 'female'
export type Goal = 'lose' | 'maintain' | 'gain'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks'

export interface Profile {
  name: string
  sex: Sex
  age: number
  heightCm: number
  startWeightKg: number
  activity: ActivityLevel
  goal: Goal
  // kg per week the user wants to change (positive = direction of goal)
  rateKgPerWeek: number
  createdAt: string // ISO date
}

export interface MacroPlan {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  effectiveFrom: string // ISO date
  estimatedExpenditure: number // kcal/day used to build this plan
}

export interface FoodItem {
  id: string
  name: string
  brand?: string
  category: string
  barcode?: string
  /** Procedencia del dato nutricional */
  source?: 'verified' | 'openfoodfacts' | 'ai'
  // per 100 g
  kcal: number
  protein: number
  carbs: number
  fat: number
  // common serving description, e.g. "1 unidad (50 g)"
  servingDesc: string
  servingG: number
}

export interface FoodLogEntry {
  id: string
  date: string // YYYY-MM-DD
  meal: MealType
  foodId: string
  grams: number
}

export interface WeightEntry {
  date: string // YYYY-MM-DD
  kg: number
}

export interface CheckIn {
  date: string // YYYY-MM-DD
  avgIntakeKcal: number
  trendDeltaKg: number // change in trend weight over the week
  estimatedExpenditure: number
  previousCalories: number
  newCalories: number
  newProteinG: number
  newCarbsG: number
  newFatG: number
  explanation: string
}

export interface AppState {
  onboarded: boolean
  profile: Profile | null
  plan: MacroPlan | null
  foods: FoodItem[]
  /** Productos añadidos desde Open Food Facts (persistidos para reutilizarlos) */
  customFoods: FoodItem[]
  foodLog: FoodLogEntry[]
  weightLog: WeightEntry[]
  checkIns: CheckIn[]
}
