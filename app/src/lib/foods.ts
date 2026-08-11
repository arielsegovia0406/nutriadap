import type { FoodItem } from '@/types'
import { FOOD_DB as FOOD_DB_DATA } from '@contracts/foods'

/**
 * Base de datos de alimentos verificados (valores por 100 g).
 * Fuentes de referencia: USDA FoodData Central / tablas de composición oficiales.
 * Los datos viven en contracts/ para compartirlos con el backend (IA, sync).
 */
export const FOOD_DB: FoodItem[] = FOOD_DB_DATA

export const FOOD_CATEGORIES = [...new Set(FOOD_DB.map((f) => f.category))]
