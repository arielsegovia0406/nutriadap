import { useEffect, useMemo, useState } from 'react'
import { Barcode, Globe, Loader2, Minus, Plus, Search, ShieldCheck, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { FoodItem, MealType } from '@/types'
import { entryMacros } from '@/lib/nutrition'
import { FOOD_CATEGORIES } from '@/lib/foods'
import { searchOFF } from '@/lib/openfoodfacts'
import { useStore } from '@/lib/store'
import BarcodeScanner from './BarcodeScanner'

interface Props {
  meal: MealType | null
  date: string
  onClose: () => void
}

type Tab = 'local' | 'online'

function SourceBadge({ source }: { source?: FoodItem['source'] }) {
  if (source === 'openfoodfacts') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-carbs/15 px-2 py-0.5 text-[10px] font-medium text-carbs">
        <Globe className="h-3 w-3" /> Open Food Facts
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
      <ShieldCheck className="h-3 w-3" /> Verificado
    </span>
  )
}

export default function FoodSearch({ meal, date, onClose }: Props) {
  const { foods, addFoodEntry, addCustomFood } = useStore()
  const [tab, setTab] = useState<Tab>('local')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [selected, setSelected] = useState<FoodItem | null>(null)
  const [grams, setGrams] = useState(100)
  const [scanOpen, setScanOpen] = useState(false)

  // Estado de la búsqueda en línea
  const [onlineResults, setOnlineResults] = useState<FoodItem[]>([])
  const [onlineLoading, setOnlineLoading] = useState(false)
  const [onlineError, setOnlineError] = useState(false)
  const [onlineSearched, setOnlineSearched] = useState(false)

  const localResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    return foods.filter((f) => {
      if (category && f.category !== category) return false
      if (q && !f.name.toLowerCase().includes(q) && !(f.brand ?? '').toLowerCase().includes(q)) return false
      return true
    })
  }, [foods, query, category])

  // Búsqueda en Open Food Facts con debounce
  useEffect(() => {
    if (tab !== 'online') return
    const q = query.trim()
    if (q.length < 2) {
      setOnlineResults([])
      setOnlineSearched(false)
      setOnlineLoading(false)
      return
    }
    setOnlineLoading(true)
    setOnlineError(false)
    const t = setTimeout(async () => {
      try {
        const items = await searchOFF(q)
        setOnlineResults(items)
        setOnlineSearched(true)
      } catch {
        setOnlineError(true)
      } finally {
        setOnlineLoading(false)
      }
    }, 600)
    return () => clearTimeout(t)
  }, [query, tab])

  const close = () => {
    setQuery('')
    setCategory(null)
    setSelected(null)
    setTab('local')
    setOnlineResults([])
    setOnlineSearched(false)
    onClose()
  }

  const pick = (f: FoodItem) => {
    setSelected(f)
    setGrams(f.servingG)
  }

  const macros = selected ? entryMacros(selected, grams) : null

  return (
    <Sheet open={meal !== null} onOpenChange={(open) => !open && close()}>
      <SheetContent side="bottom" className="flex h-[92dvh] flex-col rounded-t-3xl px-4 pb-6">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            {selected ? (
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate">{selected.brand ? `${selected.name} · ${selected.brand}` : selected.name}</span>
              </span>
            ) : (
              'Añadir alimento'
            )}
          </SheetTitle>
        </SheetHeader>

        {selected && macros ? (
          /* ---- Detalle del alimento ---- */
          <div className="flex flex-1 flex-col gap-4 overflow-hidden">
            <div className="flex items-center gap-2">
              <SourceBadge source={selected.source} />
              {selected.barcode && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Barcode className="h-3.5 w-3.5" /> {selected.barcode}
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="rounded-xl bg-secondary p-3">
                <div className="text-lg font-bold">{Math.round(macros.kcal)}</div>
                <div className="text-[10px] text-muted-foreground">kcal</div>
              </div>
              <div className="rounded-xl bg-secondary p-3">
                <div className="text-lg font-bold text-protein">{Math.round(macros.protein)} g</div>
                <div className="text-[10px] text-muted-foreground">Proteína</div>
              </div>
              <div className="rounded-xl bg-secondary p-3">
                <div className="text-lg font-bold text-carbs">{Math.round(macros.carbs)} g</div>
                <div className="text-[10px] text-muted-foreground">Carbos</div>
              </div>
              <div className="rounded-xl bg-secondary p-3">
                <div className="text-lg font-bold text-fat">{Math.round(macros.fat)} g</div>
                <div className="text-[10px] text-muted-foreground">Grasa</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cantidad</span>
                <button
                  className="text-xs text-primary underline-offset-2 hover:underline"
                  onClick={() => setGrams(selected.servingG)}
                >
                  Usar {selected.servingDesc}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => setGrams((g) => Math.max(5, g - 10))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="flex flex-1 items-center gap-2 rounded-xl border border-input bg-background px-3 py-2">
                  <Input
                    type="number" min={5} max={1500}
                    value={grams}
                    onChange={(e) => setGrams(Math.max(5, Math.min(1500, +e.target.value || 5)))}
                    className="border-0 p-0 text-center text-lg font-bold focus-visible:ring-0"
                  />
                  <span className="text-sm text-muted-foreground">g</span>
                </div>
                <Button variant="outline" size="icon" onClick={() => setGrams((g) => Math.min(1500, g + 10))}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                {[50, 100, 150, 200].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGrams(g)}
                    className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition-colors ${grams === g ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground'}`}
                  >
                    {g} g
                  </button>
                ))}
              </div>
            </div>

            {selected.source === 'openfoodfacts' && (
              <p className="rounded-xl bg-secondary p-3 text-[11px] leading-relaxed text-muted-foreground">
                Valores de etiqueta aportados por la comunidad de Open Food Facts. El coach los corregirá
                automáticamente según la respuesta de tu peso.
              </p>
            )}

            <div className="mt-auto flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setSelected(null)}>Volver</Button>
              <Button
                className="flex-1"
                onClick={() => {
                  if (meal) {
                    if (selected.source === 'openfoodfacts') addCustomFood(selected)
                    addFoodEntry(date, meal, selected.id, grams)
                  }
                  close()
                }}
              >
                Añadir · {Math.round(macros.kcal)} kcal
              </Button>
            </div>
          </div>
        ) : (
          /* ---- Búsqueda ---- */
          <div className="flex flex-1 flex-col gap-3 overflow-hidden">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder={tab === 'local' ? 'Buscar en alimentos verificados…' : 'Buscar productos en todo el mundo…'}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => setScanOpen(true)} title="Escanear código de barras">
                <Barcode className="h-5 w-5" />
              </Button>
            </div>

            {/* Pestañas de origen */}
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1">
              <button
                onClick={() => setTab('local')}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors ${tab === 'local' ? 'bg-background text-primary shadow' : 'text-muted-foreground'}`}
              >
                <ShieldCheck className="h-3.5 w-3.5" /> Verificados
              </button>
              <button
                onClick={() => setTab('online')}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors ${tab === 'online' ? 'bg-background text-primary shadow' : 'text-muted-foreground'}`}
              >
                <Globe className="h-3.5 w-3.5" /> En línea
              </button>
            </div>

            {tab === 'local' ? (
              <>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  <button
                    onClick={() => setCategory(null)}
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${category === null ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground'}`}
                  >
                    Todos
                  </button>
                  {FOOD_CATEGORIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c === category ? null : c)}
                      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${category === c ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  Base verificada (referencia USDA) · {foods.length} alimentos · valores por 100 g
                </div>

                <div className="flex-1 space-y-1 overflow-y-auto pr-1 scrollbar-thin">
                  {localResults.length === 0 && (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                      Sin resultados para «{query}».{' '}
                      <button className="text-primary underline-offset-2 hover:underline" onClick={() => setTab('online')}>
                        Buscar en línea
                      </button>
                    </div>
                  )}
                  {localResults.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => pick(f)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-secondary/70"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{f.name}</span>
                          {f.source === 'openfoodfacts' && <SourceBadge source={f.source} />}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {f.brand ? `${f.brand} · ` : ''}{f.servingDesc} · {f.category}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-semibold">{f.kcal}</div>
                        <div className="text-[10px] text-muted-foreground">kcal/100 g</div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Globe className="h-3.5 w-3.5 text-carbs" />
                  Open Food Facts · 3M+ productos envasados · datos de etiqueta de la comunidad
                </div>

                <div className="flex-1 space-y-1 overflow-y-auto pr-1 scrollbar-thin">
                  {onlineLoading && (
                    <div className="flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      Buscando «{query}» en Open Food Facts…
                    </div>
                  )}
                  {onlineError && !onlineLoading && (
                    <div className="flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground">
                      <WifiOff className="h-6 w-6 text-destructive" />
                      Error de conexión con Open Food Facts. Inténtalo de nuevo.
                    </div>
                  )}
                  {!onlineLoading && !onlineError && query.trim().length < 2 && (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                      Escribe al menos 2 letras para buscar productos envasados
                    </div>
                  )}
                  {!onlineLoading && !onlineError && onlineSearched && onlineResults.length === 0 && (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                      Ningún producto encontrado para «{query}»
                    </div>
                  )}
                  {!onlineLoading &&
                    onlineResults.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => pick(f)}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-secondary/70"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{f.name}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {f.brand ? `${f.brand} · ` : ''}{f.servingDesc}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-sm font-semibold">{f.kcal}</div>
                          <div className="text-[10px] text-muted-foreground">kcal/100 g</div>
                        </div>
                      </button>
                    ))}
                </div>
              </>
            )}
          </div>
        )}
      </SheetContent>

      <BarcodeScanner
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onFound={(food) => {
          setScanOpen(false)
          pick(food)
        }}
      />
    </Sheet>
  )
}
