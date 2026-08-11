import type { FoodItem } from '@/types'

/**
 * Integración con Open Food Facts (https://world.openfoodfacts.org)
 * Base de datos abierta y gratuita: 3M+ productos, sin API key.
 * Los nutrientes son datos de etiqueta aportados por la comunidad y fabricantes.
 */

const API = 'https://world.openfoodfacts.org'
const FIELDS = 'code,product_name,brands,nutriments,serving_size'

interface OFFNutriments {
  'energy-kcal_100g'?: number
  energy_100g?: number // kJ
  proteins_100g?: number
  carbohydrates_100g?: number
  fat_100g?: number
}

interface OFFProduct {
  code: string
  product_name?: string
  brands?: string
  serving_size?: string
  nutriments?: OFFNutriments
}

/** Extrae los gramos de un serving_size tipo "125 g" o "1 barrita (40 g)" */
function parseServingG(servingSize?: string): number {
  if (!servingSize) return 100
  const m = servingSize.match(/(\d+(?:[.,]\d+)?)\s*g/i)
  if (!m) return 100
  const g = parseFloat(m[1].replace(',', '.'))
  return g >= 5 && g <= 1000 ? Math.round(g) : 100
}

/** Convierte un producto OFF a FoodItem; null si no tiene datos nutricionales útiles */
function toFoodItem(p: OFFProduct): FoodItem | null {
  const n = p.nutriments ?? {}
  let kcal = n['energy-kcal_100g']
  if (kcal == null && n.energy_100g != null) kcal = n.energy_100g / 4.184
  const protein = n.proteins_100g
  const carbs = n.carbohydrates_100g
  const fat = n.fat_100g
  // Sin energía ni macros no sirve para registrar
  if (kcal == null && protein == null && carbs == null && fat == null) return null
  if (kcal == null) kcal = (protein ?? 0) * 4 + (carbs ?? 0) * 4 + (fat ?? 0) * 9
  if (kcal <= 0 || kcal > 950) return null

  const name = (p.product_name ?? '').trim()
  const brand = (p.brands ?? '').split(',')[0]?.trim() || undefined
  if (!name && !brand) return null

  const servingG = parseServingG(p.serving_size)
  return {
    id: `off_${p.code}`,
    name: name || brand || 'Producto',
    brand,
    category: 'Open Food Facts',
    barcode: p.code,
    source: 'openfoodfacts',
    kcal: Math.round(kcal),
    protein: Math.round((protein ?? 0) * 10) / 10,
    carbs: Math.round((carbs ?? 0) * 10) / 10,
    fat: Math.round((fat ?? 0) * 10) / 10,
    servingDesc: p.serving_size ? `1 porción (${servingG} g)` : '100 g',
    servingG,
  }
}

const searchCache = new Map<string, FoodItem[]>()

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** fetch con reintentos ante errores transitorios (503/rate-limit de OFF) */
async function fetchOFF(url: string): Promise<Response> {
  let lastError: unknown = new Error('Error desconocido')
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(800 * attempt)
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'NutriAdapt/1.0 (prototipo educativo)' } })
      if (res.ok) return res
      // 4xx: error nuestro, no tiene sentido reintentar
      if (res.status < 500) throw new Error(`Open Food Facts respondió ${res.status}`)
      lastError = new Error(`Open Food Facts respondió ${res.status}`)
    } catch (e) {
      lastError = e
      if (e instanceof Error && /respondió 4/.test(e.message)) throw e
    }
  }
  throw lastError
}

/** Búsqueda de texto en Open Food Facts (productos envasados del mundo entero) */
export async function searchOFF(query: string, pageSize = 25): Promise<FoodItem[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const key = `${q.toLowerCase()}_${pageSize}`
  const cached = searchCache.get(key)
  if (cached) return cached

  const url =
    `${API}/cgi/search.pl?search_terms=${encodeURIComponent(q)}` +
    `&search_simple=1&action=process&json=1&page_size=${pageSize}&fields=${FIELDS}`
  const res = await fetchOFF(url)
  const data = (await res.json()) as { products?: OFFProduct[] }

  const seen = new Set<string>()
  const items: FoodItem[] = []
  for (const p of data.products ?? []) {
    const item = toFoodItem(p)
    if (!item || seen.has(item.id)) continue
    seen.add(item.id)
    items.push(item)
  }
  searchCache.set(key, items)
  return items
}

/** Consulta un producto por código de barras (EAN-13/UPC). null si no existe o sin datos */
export async function fetchOFFByBarcode(code: string): Promise<FoodItem | null> {
  const clean = code.replace(/\D/g, '')
  if (clean.length < 8) return null
  let data: { status?: number; product?: OFFProduct }
  try {
    const res = await fetchOFF(`${API}/api/v2/product/${clean}.json?fields=${FIELDS}`)
    data = (await res.json()) as typeof data
  } catch (e) {
    // OFF devuelve 404 cuando el producto no existe en su base
    if (e instanceof Error && e.message.includes('404')) return null
    throw e
  }
  if (data.status !== 1 || !data.product) return null
  return toFoodItem({ ...data.product, code: clean })
}
