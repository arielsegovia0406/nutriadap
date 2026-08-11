import { useMemo, useState } from 'react'
import { Activity, ArrowLeft, ArrowRight, Flame, Sparkles, Target, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import type { ActivityLevel, Goal, Profile, Sex } from '@/types'
import { ACTIVITY_FACTORS, GOAL_LABELS, RATE_OPTIONS, initialPlan } from '@/lib/nutrition'
import { useStore } from '@/lib/store'

const steps = ['Tus datos', 'Actividad', 'Objetivo', 'Tu plan']

export default function Onboarding() {
  const { completeOnboarding, loadDemoData } = useStore()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [sex, setSex] = useState<Sex>('male')
  const [age, setAge] = useState('30')
  const [heightCm, setHeightCm] = useState('175')
  const [weight, setWeight] = useState('80')
  const [activity, setActivity] = useState<ActivityLevel>('moderate')
  const [goal, setGoal] = useState<Goal>('lose')
  const [rate, setRate] = useState('0.5')

  const canNext = useMemo(() => {
    if (step === 0) return +age >= 14 && +age <= 100 && +heightCm >= 120 && +heightCm <= 230 && +weight >= 35 && +weight <= 300
    return true
  }, [step, age, heightCm, weight])

  const previewPlan = useMemo(() => {
    const p: Profile = {
      name: name.trim() || 'Atleta',
      sex,
      age: +age || 30,
      heightCm: +heightCm || 175,
      startWeightKg: +weight || 80,
      activity,
      goal,
      rateKgPerWeek: goal === 'maintain' ? 0 : +rate || 0.5,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    return initialPlan(p)
  }, [name, sex, age, heightCm, weight, activity, goal, rate])

  const finish = () => {
    completeOnboarding({
      name: name.trim() || 'Atleta',
      sex,
      age: +age,
      heightCm: +heightCm,
      startWeightKg: +weight,
      activity,
      goal,
      rateKgPerWeek: goal === 'maintain' ? 0 : +rate,
      createdAt: new Date().toISOString().slice(0, 10),
    })
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Flame className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">NutriAdapt</h1>
          <p className="text-sm text-muted-foreground">Coach nutricional adaptativo</p>
        </div>
      </div>

      <div className="mb-6 space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{steps[step]}</span>
          <span>{step + 1} / {steps.length}</span>
        </div>
        <Progress value={((step + 1) / steps.length) * 100} className="h-1.5" />
      </div>

      <div className="flex-1">
        {step === 0 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-lg font-semibold"><User className="h-5 w-5 text-primary" /> Cuéntanos sobre ti</div>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre (opcional)</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="¿Cómo te llamamos?" />
            </div>
            <div className="space-y-2">
              <Label>Sexo biológico</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['male', 'female'] as Sex[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSex(s)}
                    className={`rounded-xl border p-3 text-sm font-medium transition-colors ${sex === s ? 'border-primary bg-primary/15 text-primary' : 'border-border bg-card text-muted-foreground hover:border-primary/50'}`}
                  >
                    {s === 'male' ? 'Hombre' : 'Mujer'}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="age">Edad</Label>
                <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} min={14} max={100} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="h">Altura (cm)</Label>
                <Input id="h" type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} min={120} max={230} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="w">Peso (kg)</Label>
                <Input id="w" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} min={35} max={300} step={0.1} />
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Usamos la ecuación de Mifflin-St Jeor, la más precisa según la evidencia, para estimar tu metabolismo basal. Luego el algoritmo lo refinará con tus datos reales.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-lg font-semibold"><Activity className="h-5 w-5 text-primary" /> Nivel de actividad</div>
            <div className="space-y-2">
              {(Object.keys(ACTIVITY_FACTORS) as ActivityLevel[]).map((a) => (
                <button
                  key={a}
                  onClick={() => setActivity(a)}
                  className={`w-full rounded-xl border p-4 text-left transition-colors ${activity === a ? 'border-primary bg-primary/15' : 'border-border bg-card hover:border-primary/50'}`}
                >
                  <div className={`font-medium ${activity === a ? 'text-primary' : ''}`}>{ACTIVITY_FACTORS[a].label}</div>
                  <div className="text-sm text-muted-foreground">{ACTIVITY_FACTORS[a].desc}</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">No te preocupes por acertar: el coach ajustará tu gasto real semana a semana con tu peso y tu ingesta.</p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-lg font-semibold"><Target className="h-5 w-5 text-primary" /> ¿Qué quieres conseguir?</div>
            <div className="grid grid-cols-1 gap-2">
              {(['lose', 'maintain', 'gain'] as Goal[]).map((g) => (
                <button
                  key={g}
                  onClick={() => {
                    setGoal(g)
                    setRate(RATE_OPTIONS[g][Math.min(1, RATE_OPTIONS[g].length - 1)].value.toString())
                  }}
                  className={`rounded-xl border p-4 text-left transition-colors ${goal === g ? 'border-primary bg-primary/15' : 'border-border bg-card hover:border-primary/50'}`}
                >
                  <div className={`font-medium ${goal === g ? 'text-primary' : ''}`}>{GOAL_LABELS[g]}</div>
                  <div className="text-sm text-muted-foreground">
                    {g === 'lose' && 'Déficit controlado preservando músculo'}
                    {g === 'maintain' && 'Encuentra tu punto de equilibrio calórico'}
                    {g === 'gain' && 'Superávit magro para maximizar músculo'}
                  </div>
                </button>
              ))}
            </div>
            {goal !== 'maintain' && (
              <div className="space-y-2">
                <Label>Ritmo semanal</Label>
                <div className="grid grid-cols-2 gap-2">
                  {RATE_OPTIONS[goal].map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setRate(r.value.toString())}
                      className={`rounded-xl border p-3 text-sm font-medium transition-colors ${+rate === r.value ? 'border-primary bg-primary/15 text-primary' : 'border-border bg-card text-muted-foreground hover:border-primary/50'}`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-lg font-semibold"><Sparkles className="h-5 w-5 text-primary" /> Tu plan inicial</div>
            <Card className="border-primary/40 bg-gradient-to-b from-primary/10 to-transparent">
              <CardContent className="space-y-4 p-5">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">{previewPlan.calories.toLocaleString('es-ES')}</div>
                  <div className="text-sm text-muted-foreground">kcal / día</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-card p-3">
                    <div className="text-lg font-bold text-protein">{previewPlan.proteinG} g</div>
                    <div className="text-xs text-muted-foreground">Proteína</div>
                  </div>
                  <div className="rounded-xl bg-card p-3">
                    <div className="text-lg font-bold text-carbs">{previewPlan.carbsG} g</div>
                    <div className="text-xs text-muted-foreground">Carbos</div>
                  </div>
                  <div className="rounded-xl bg-card p-3">
                    <div className="text-lg font-bold text-fat">{previewPlan.fatG} g</div>
                    <div className="text-xs text-muted-foreground">Grasa</div>
                  </div>
                </div>
                <div className="rounded-xl bg-card p-3 text-center text-sm">
                  Gasto estimado inicial: <span className="font-semibold text-primary">{previewPlan.estimatedExpenditure.toLocaleString('es-ES')} kcal</span>
                </div>
              </CardContent>
            </Card>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Este es solo el punto de partida. Cada semana, el check-in del coach comparará tu ingesta real con la tendencia de tu peso para recalcular tu gasto verdadero y ajustar los macros. Sin castigos si un día te pasas: lo que importa es la tendencia.
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-3">
        {step > 0 && (
          <Button variant="outline" size="lg" onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Atrás
          </Button>
        )}
        {step < 3 ? (
          <Button size="lg" className="flex-1" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
            Siguiente <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button size="lg" className="flex-1" onClick={finish}>
            Empezar mi plan
          </Button>
        )}
      </div>

      <button onClick={loadDemoData} className="mt-4 text-center text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline">
        ¿Solo quieres explorar? Cargar datos de ejemplo (4 semanas)
      </button>
    </div>
  )
}
