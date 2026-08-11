import { useMemo, useState } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Coffee, Cookie, Moon, Plus, Sun, Trash2, UtensilsCrossed, Weight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { MealType } from '@/types'
import { dayTotals, entryMacros, todayStr } from '@/lib/nutrition'
import { useStore } from '@/lib/store'
import FoodSearch from './FoodSearch'

const MEALS: { id: MealType; label: string; icon: React.ReactNode }[] = [
  { id: 'breakfast', label: 'Desayuno', icon: <Coffee className="h-4 w-4" /> },
  { id: 'lunch', label: 'Comida', icon: <Sun className="h-4 w-4" /> },
  { id: 'dinner', label: 'Cena', icon: <Moon className="h-4 w-4" /> },
  { id: 'snacks', label: 'Snacks', icon: <Cookie className="h-4 w-4" /> },
]

function CalorieRing({ consumed, target }: { consumed: number; target: number }) {
  const r = 84
  const c = 2 * Math.PI * r
  const pct = Math.min(consumed / target, 1)
  const over = consumed > target
  return (
    <div className="relative h-52 w-52">
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
        <circle cx="100" cy="100" r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="14" />
        <circle
          cx="100" cy="100" r={r} fill="none"
          stroke={over ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
          strokeWidth="14" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={`text-4xl font-bold ${over ? 'text-destructive' : ''}`}>
          {Math.max(0, Math.round(target - consumed)).toLocaleString('es-ES')}
        </div>
        <div className="text-xs text-muted-foreground">{over ? 'kcal excedidas' : 'kcal restantes'}</div>
        <div className="mt-1 text-xs text-muted-foreground">{Math.round(consumed).toLocaleString('es-ES')} / {target.toLocaleString('es-ES')}</div>
      </div>
    </div>
  )
}

function MacroBar({ label, value, target, colorClass }: { label: string; value: number; target: number; colorClass: string }) {
  const pct = Math.min((value / target) * 100, 100)
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{Math.round(value)} / {target} g</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div className={`h-full rounded-full ${colorClass} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function Dashboard({ onGoToWeight }: { onGoToWeight: () => void }) {
  const { plan, profile, foodLog, foods, weightLog, removeFoodEntry, addWeight } = useStore()
  const [date, setDate] = useState(todayStr())
  const [searchMeal, setSearchMeal] = useState<MealType | null>(null)
  const [weightOpen, setWeightOpen] = useState(false)
  const [weightInput, setWeightInput] = useState('')

  const entries = useMemo(() => foodLog.filter((e) => e.date === date), [foodLog, date])
  const totals = useMemo(() => dayTotals(entries, foods), [entries, foods])
  const foodMap = useMemo(() => new Map(foods.map((f) => [f.id, f])), [foods])

  const isToday = date === todayStr()
  const dateLabel = isToday
    ? 'Hoy'
    : format(parseISO(date), "EEEE d 'de' MMMM", { locale: es })

  if (!plan || !profile) return null

  return (
    <div className="space-y-5 pb-6">
      {/* Navegación de fecha */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setDate(format(addDays(parseISO(date), -1), 'yyyy-MM-dd'))}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <div className="font-semibold first-letter:uppercase">{dateLabel}</div>
          <div className="text-xs text-muted-foreground">{GOAL_BADGE[profile.goal]}</div>
        </div>
        <Button variant="ghost" size="icon" disabled={isToday} onClick={() => setDate(format(addDays(parseISO(date), 1), 'yyyy-MM-dd'))}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Anillo de calorías y macros */}
      <Card>
        <CardContent className="flex flex-col items-center gap-5 p-5">
          <CalorieRing consumed={totals.kcal} target={plan.calories} />
          <div className="w-full space-y-3">
            <MacroBar label="Proteína" value={totals.protein} target={plan.proteinG} colorClass="bg-protein" />
            <MacroBar label="Carbohidratos" value={totals.carbs} target={plan.carbsG} colorClass="bg-carbs" />
            <MacroBar label="Grasas" value={totals.fat} target={plan.fatG} colorClass="bg-fat" />
          </div>
        </CardContent>
      </Card>

      {/* Peso rápido */}
      <Card className="cursor-pointer transition-colors hover:border-primary/50" onClick={() => setWeightOpen(true)}>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Weight className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-medium">Peso de hoy</div>
              <div className="text-xs text-muted-foreground">
                {weightLog.find((w) => w.date === todayStr())
                  ? `${weightLog.find((w) => w.date === todayStr())!.kg} kg registrados`
                  : 'Toca para registrar'}
              </div>
            </div>
          </div>
          <Plus className="h-4 w-4 text-muted-foreground" />
        </CardContent>
      </Card>

      {/* Comidas */}
      {MEALS.map((meal) => {
        const mealEntries = entries.filter((e) => e.meal === meal.id)
        const mealKcal = mealEntries.reduce((sum, e) => {
          const f = foodMap.get(e.foodId)
          return sum + (f ? entryMacros(f, e.grams).kcal : 0)
        }, 0)
        return (
          <Card key={meal.id}>
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium">
                  <span className="text-primary">{meal.icon}</span> {meal.label}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{Math.round(mealKcal)} kcal</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSearchMeal(meal.id)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {mealEntries.length === 0 ? (
                <button
                  onClick={() => setSearchMeal(meal.id)}
                  className="flex w-full items-center gap-2 rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                >
                  <UtensilsCrossed className="h-4 w-4" /> Añadir alimento
                </button>
              ) : (
                <div className="space-y-1">
                  {mealEntries.map((e) => {
                    const f = foodMap.get(e.foodId)
                    if (!f) return null
                    const m = entryMacros(f, e.grams)
                    return (
                      <div key={e.id} className="group flex items-center justify-between rounded-lg px-2 py-2 hover:bg-secondary/60">
                        <div>
                          <div className="text-sm font-medium">{f.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {e.grams} g · P {Math.round(m.protein)} · C {Math.round(m.carbs)} · G {Math.round(m.fat)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">{Math.round(m.kcal)} kcal</span>
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={() => removeFoodEntry(e.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      <FoodSearch meal={searchMeal} date={date} onClose={() => setSearchMeal(null)} />

      {/* Registrar peso */}
      <Dialog open={weightOpen} onOpenChange={setWeightOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Peso de hoy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                type="number" step="0.1" min="35" max="300" autoFocus
                placeholder="Ej. 80.5"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
              />
              <span className="text-sm text-muted-foreground">kg</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Pésate en ayunas, tras ir al baño. Lo importante es la tendencia semanal, no el número de un día.
            </p>
            <Button
              className="w-full"
              disabled={!weightInput || +weightInput < 35 || +weightInput > 300}
              onClick={() => {
                addWeight(todayStr(), Math.round(+weightInput * 10) / 10)
                setWeightInput('')
                setWeightOpen(false)
              }}
            >
              Guardar
            </Button>
            <Button variant="outline" className="w-full" onClick={() => { setWeightOpen(false); onGoToWeight() }}>
              Ver mi progreso
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const GOAL_BADGE: Record<string, string> = {
  lose: 'Objetivo: perder grasa',
  maintain: 'Objetivo: mantener',
  gain: 'Objetivo: ganar músculo',
}
