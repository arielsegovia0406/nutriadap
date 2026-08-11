import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowDown, ArrowRight, Brain, CalendarCheck, Flame, Info, LineChart, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { CheckIn } from '@/types'
import { currentTrendWeight, summarizeWeek, todayStr, weightTrend } from '@/lib/nutrition'
import { useStore } from '@/lib/store'

export default function Coach() {
  const { profile, plan, foodLog, foods, weightLog, checkIns, runCheckIn } = useStore()
  const [result, setResult] = useState<CheckIn | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const summary = useMemo(
    () => (plan ? summarizeWeek(foodLog, foods, weightLog, todayStr()) : null),
    [foodLog, foods, weightLog, plan],
  )
  const trendW = useMemo(() => currentTrendWeight(weightLog), [weightLog])
  const trend = useMemo(() => weightTrend(weightLog), [weightLog])
  const canCheckIn = summary !== null && summary.daysWithIntake >= 3 && trend.length >= 4

  if (!profile || !plan || !summary) return null

  const doCheckIn = () => {
    const ci = runCheckIn()
    setConfirmOpen(false)
    if (ci) setResult(ci)
  }

  return (
    <div className="space-y-5 pb-6">
      {/* Gasto estimado */}
      <Card className="border-primary/40 bg-gradient-to-b from-primary/10 to-transparent">
        <CardContent className="p-5">
          <div className="mb-1 flex items-center gap-2 text-sm font-medium text-primary">
            <Flame className="h-4 w-4" /> Tu gasto energético estimado
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold">{plan.estimatedExpenditure.toLocaleString('es-ES')}</span>
            <span className="pb-1 text-sm text-muted-foreground">kcal / día</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Calculado a partir de lo que comes y de cómo responde tu peso, no solo de fórmulas teóricas.
            Se recalibra en cada check-in semanal.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-card p-3">
              <div className="text-lg font-bold">{plan.calories.toLocaleString('es-ES')}</div>
              <div className="text-[10px] text-muted-foreground">kcal objetivo</div>
            </div>
            <div className="rounded-xl bg-card p-3">
              <div className="text-lg font-bold text-protein">{plan.proteinG} g</div>
              <div className="text-[10px] text-muted-foreground">proteína</div>
            </div>
            <div className="rounded-xl bg-card p-3">
              <div className="text-lg font-bold">
                {plan.estimatedExpenditure - plan.calories > 0 ? '−' : '+'}
                {Math.abs(plan.estimatedExpenditure - plan.calories).toLocaleString('es-ES')}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {plan.estimatedExpenditure - plan.calories > 0 ? 'déficit/día' : plan.estimatedExpenditure - plan.calories < 0 ? 'superávit/día' : 'equilibrio'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen de la semana */}
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2 font-semibold">
            <LineChart className="h-4 w-4 text-primary" /> Tu semana en curso
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-secondary p-3">
              <div className="text-xs text-muted-foreground">Ingesta media</div>
              <div className="text-lg font-bold">
                {summary.avgIntakeKcal > 0 ? `${summary.avgIntakeKcal.toLocaleString('es-ES')} kcal` : '—'}
              </div>
              <div className="text-[10px] text-muted-foreground">{summary.daysWithIntake}/7 días registrados</div>
            </div>
            <div className="rounded-xl bg-secondary p-3">
              <div className="text-xs text-muted-foreground">Cambio de tendencia</div>
              <div className={`flex items-center gap-1 text-lg font-bold ${summary.trendDeltaKg < 0 ? 'text-primary' : summary.trendDeltaKg > 0 ? 'text-carbs' : ''}`}>
                {summary.trendDeltaKg < 0 ? <TrendingDown className="h-4 w-4" /> : summary.trendDeltaKg > 0 ? <TrendingUp className="h-4 w-4" /> : null}
                {summary.trendDeltaKg > 0 ? '+' : ''}{summary.trendDeltaKg} kg
              </div>
              <div className="text-[10px] text-muted-foreground">
                {trendW ? `tendencia actual: ${trendW.toFixed(1)} kg` : 'registra tu peso'}
              </div>
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${summary.adherencePct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Adherencia al registro</span>
            <span>{summary.adherencePct}%</span>
          </div>

          <Button className="w-full" size="lg" disabled={!canCheckIn} onClick={() => setConfirmOpen(true)}>
            <CalendarCheck className="mr-2 h-4 w-4" /> Hacer check-in semanal
          </Button>
          {!canCheckIn && (
            <div className="flex gap-2 rounded-xl bg-secondary p-3 text-xs text-muted-foreground">
              <Info className="h-4 w-4 shrink-0 text-primary" />
              El check-in necesita al menos 3 días de comida registrada y 4 pesajes esta semana para ser fiable.
              Actualmente: {summary.daysWithIntake} días de comida y {trend.length} pesajes totales.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cómo funciona */}
      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center gap-2 font-semibold">
            <Brain className="h-4 w-4 text-primary" /> Cómo piensa tu coach
          </div>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><span className="font-bold text-primary">1.</span> Compara tu ingesta media con el cambio de la tendencia de peso (media exponencial, inmune a la retención de líquidos de un día).</li>
            <li className="flex gap-2"><span className="font-bold text-primary">2.</span> Deduce tu gasto real: si comiste 2.100 kcal y bajaste 0,3 kg, gastaste más de lo que comiste (~2.430 kcal/día).</li>
            <li className="flex gap-2"><span className="font-bold text-primary">3.</span> Ajusta tus calorías y macros para mantener el ritmo objetivo de {profile.rateKgPerWeek} kg/sem. Sin castigos por días malos: manda la tendencia.</li>
          </ol>
        </CardContent>
      </Card>

      {/* Historial */}
      {checkIns.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1 font-semibold">
            <RefreshCw className="h-4 w-4 text-primary" /> Historial de ajustes
          </div>
          {[...checkIns].reverse().map((ci, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium first-letter:uppercase">
                    {format(parseISO(ci.date), "d 'de' MMMM", { locale: es })}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="text-muted-foreground">{ci.previousCalories.toLocaleString('es-ES')}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className={`font-bold ${ci.newCalories < ci.previousCalories ? 'text-primary' : ci.newCalories > ci.previousCalories ? 'text-carbs' : ''}`}>
                      {ci.newCalories.toLocaleString('es-ES')} kcal
                    </span>
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Flame className="h-3 w-3" /> gasto: {ci.estimatedExpenditure.toLocaleString('es-ES')}
                  </span>
                  <span>tendencia: {ci.trendDeltaKg > 0 ? '+' : ''}{ci.trendDeltaKg} kg</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ci.explanation}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmación */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Check-in semanal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              El coach analizará tus últimos 7 días ({summary.daysWithIntake} días registrados, ingesta media de{' '}
              {summary.avgIntakeKcal.toLocaleString('es-ES')} kcal, tendencia {summary.trendDeltaKg > 0 ? '+' : ''}
              {summary.trendDeltaKg} kg) y recalculará tu gasto y tus macros.
            </p>
            <Button className="w-full" onClick={doCheckIn}>Analizar y ajustar mi plan</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resultado del check-in */}
      <Dialog open={result !== null} onOpenChange={() => setResult(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Plan actualizado</DialogTitle>
          </DialogHeader>
          {result && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-muted-foreground line-through">{result.previousCalories.toLocaleString('es-ES')}</div>
                  <div className="text-[10px] text-muted-foreground">antes</div>
                </div>
                {result.newCalories !== result.previousCalories ? (
                  <ArrowDown className={`h-5 w-5 ${result.newCalories < result.previousCalories ? 'text-primary' : 'rotate-180 text-carbs'}`} />
                ) : (
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                )}
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{result.newCalories.toLocaleString('es-ES')}</div>
                  <div className="text-[10px] text-muted-foreground">kcal/día</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-secondary p-2.5">
                  <div className="font-bold text-protein">{result.newProteinG} g</div>
                  <div className="text-[10px] text-muted-foreground">Proteína</div>
                </div>
                <div className="rounded-xl bg-secondary p-2.5">
                  <div className="font-bold text-carbs">{result.newCarbsG} g</div>
                  <div className="text-[10px] text-muted-foreground">Carbos</div>
                </div>
                <div className="rounded-xl bg-secondary p-2.5">
                  <div className="font-bold text-fat">{result.newFatG} g</div>
                  <div className="text-[10px] text-muted-foreground">Grasa</div>
                </div>
              </div>
              <div className="rounded-xl bg-secondary p-3 text-center text-sm">
                Nuevo gasto estimado: <span className="font-semibold text-primary">{result.estimatedExpenditure.toLocaleString('es-ES')} kcal/día</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{result.explanation}</p>
              <Button className="w-full" onClick={() => setResult(null)}>Aceptar nuevo plan</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
