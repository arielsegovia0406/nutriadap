import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarClock, Plus, Scale, Trash2, TrendingDown, TrendingUp } from 'lucide-react'
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { currentTrendWeight, daysSince, projectGoalDate, todayStr, weightTrend } from '@/lib/nutrition'
import { useStore } from '@/lib/store'

export default function Progress() {
  const { profile, weightLog, addWeight, removeWeight } = useStore()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')

  const trend = useMemo(() => weightTrend(weightLog), [weightLog])
  const trendNow = useMemo(() => currentTrendWeight(weightLog), [weightLog])

  const chartData = useMemo(() => {
    const map = new Map(weightLog.map((w) => [w.date, w.kg]))
    return trend.map((t) => ({
      date: t.date,
      label: format(parseISO(t.date), 'd MMM', { locale: es }),
      peso: map.get(t.date) ?? null,
      tendencia: t.trend,
    }))
  }, [trend, weightLog])

  const stats = useMemo(() => {
    if (!profile || trend.length === 0 || trendNow == null) return null
    const start = trend[0].trend
    const change = Math.round((trendNow - start) * 100) / 100
    const last7 = trend.slice(-7)
    const weeklyRate = last7.length >= 2 ? Math.round(((last7[last7.length - 1].trend - last7[0].trend) / Math.max(1, last7.length - 1)) * 7 * 100) / 100 : 0
    const bmi = profile.heightCm ? Math.round((trendNow / Math.pow(profile.heightCm / 100, 2)) * 10) / 10 : null
    return { start, change, weeklyRate, bmi }
  }, [profile, trend, trendNow])

  if (!profile) return null

  // Peso objetivo estimado: proyectar la tasa deseada sobre 12 semanas
  const goalWeight = useMemo(() => {
    if (profile.goal === 'maintain' || !stats) return null
    const dir = profile.goal === 'lose' ? -1 : 1
    return Math.round((stats.start + dir * profile.rateKgPerWeek * 12) * 10) / 10
  }, [profile, stats])

  const projectedDate = goalWeight ? projectGoalDate(weightLog, goalWeight) : null

  return (
    <div className="space-y-5 pb-6">
      {/* Stats principales */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Peso tendencia</div>
            <div className="text-2xl font-bold">{trendNow != null ? `${trendNow.toFixed(1)} kg` : '—'}</div>
            {stats && (
              <div className={`mt-0.5 flex items-center gap-1 text-xs ${stats.change < 0 ? 'text-primary' : stats.change > 0 ? 'text-carbs' : 'text-muted-foreground'}`}>
                {stats.change < 0 ? <TrendingDown className="h-3 w-3" /> : stats.change > 0 ? <TrendingUp className="h-3 w-3" /> : null}
                {stats.change > 0 ? '+' : ''}{stats.change} kg desde el inicio
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Ritmo (7 días)</div>
            <div className="text-2xl font-bold">
              {stats ? `${stats.weeklyRate > 0 ? '+' : ''}${stats.weeklyRate}` : '—'}
              <span className="text-sm font-normal text-muted-foreground"> kg/sem</span>
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              objetivo: {profile.goal === 'maintain' ? '±0' : `${profile.goal === 'lose' ? '−' : '+'}${profile.rateKgPerWeek}`} kg/sem
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfica */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <Scale className="h-4 w-4 text-primary" /> Evolución del peso
            </div>
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Registrar
            </Button>
          </div>
          {chartData.length < 2 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <Scale className="h-8 w-8 opacity-40" />
              Registra tu peso unos días para ver la gráfica
            </div>
          ) : (
            <>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 5, right: 4, bottom: 0, left: -18 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={40} />
                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
                      formatter={(value: number, name: string) => [`${value} kg`, name === 'peso' ? 'Peso' : 'Tendencia']}
                    />
                    <Area type="monotone" dataKey="peso" stroke="hsl(var(--muted-foreground))" strokeWidth={1} fill="hsl(var(--secondary))" fillOpacity={0.5} dot={false} connectNulls />
                    <Line type="monotone" dataKey="tendencia" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-muted-foreground/60" /> Peso diario</span>
                <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-primary" /> Tendencia (EMA)</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Proyección */}
      {goalWeight && (
        <Card className="border-primary/30">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div className="text-sm">
              {projectedDate ? (
                <>
                  A tu ritmo actual, alcanzarías <span className="font-bold text-primary">{goalWeight} kg</span> (referencia a 12 semanas) hacia el{' '}
                  <span className="font-bold">{format(parseISO(projectedDate), "d 'de' MMMM", { locale: es })}</span>.
                </>
              ) : (
                <>
                  Referencia a 12 semanas: <span className="font-bold text-primary">{goalWeight} kg</span>. Mantén el ritmo objetivo y el coach corregirá el rumbo si te desvías.
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info extra */}
      {stats?.bmi && (
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-card p-3">
            <div className="text-lg font-bold">{stats.bmi}</div>
            <div className="text-[10px] text-muted-foreground">IMC actual</div>
          </div>
          <div className="rounded-xl bg-card p-3">
            <div className="text-lg font-bold">{weightLog.length}</div>
            <div className="text-[10px] text-muted-foreground">pesajes</div>
          </div>
          <div className="rounded-xl bg-card p-3">
            <div className="text-lg font-bold">{daysSince(profile.createdAt)}</div>
            <div className="text-[10px] text-muted-foreground">días en el plan</div>
          </div>
        </div>
      )}

      {/* Historial de pesajes */}
      {weightLog.length > 0 && (
        <div className="space-y-2">
          <div className="px-1 font-semibold">Registros</div>
          <Card>
            <CardContent className="max-h-64 overflow-y-auto p-2 scrollbar-thin">
              {[...weightLog].reverse().map((w) => (
                <div key={w.date} className="group flex items-center justify-between rounded-lg px-3 py-2 hover:bg-secondary/60">
                  <span className="text-sm text-muted-foreground first-letter:uppercase">
                    {w.date === todayStr() ? 'Hoy' : format(parseISO(w.date), "EEEE d 'de' MMMM", { locale: es })}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{w.kg} kg</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100" onClick={() => removeWeight(w.date)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar peso de hoy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input type="number" step="0.1" min="35" max="300" autoFocus placeholder="Ej. 80.5" value={input} onChange={(e) => setInput(e.target.value)} />
              <span className="text-sm text-muted-foreground">kg</span>
            </div>
            <Button
              className="w-full"
              disabled={!input || +input < 35 || +input > 300}
              onClick={() => {
                addWeight(todayStr(), Math.round(+input * 10) / 10)
                setInput('')
                setOpen(false)
              }}
            >
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
