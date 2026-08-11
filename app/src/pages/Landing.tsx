import { Link, useNavigate } from 'react-router'
import {
  ArrowRight, Barcode, Brain, Check, Cloud, Flame, LineChart, Lock,
  ScanLine, ShieldCheck, Sparkles, TrendingDown, UtensilsCrossed,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

function PhoneMock() {
  const r = 60
  const c = 2 * Math.PI * r
  return (
    <div className="relative mx-auto w-[280px]">
      <div className="rounded-[2.5rem] border border-border bg-card p-3 shadow-2xl shadow-primary/10">
        <div className="rounded-[2rem] bg-background p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Flame className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="h-2.5 w-20 rounded-full bg-secondary" />
          </div>
          <div className="relative mx-auto my-4 h-40 w-40">
            <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
              <circle cx="80" cy="80" r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="12" />
              <circle cx="80" cy="80" r={r} fill="none" stroke="hsl(var(--primary))" strokeWidth="12"
                strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * 0.28} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl font-bold">1.436</div>
              <div className="text-[9px] text-muted-foreground">kcal restantes</div>
            </div>
          </div>
          {[['Proteína', 'bg-protein', 'w-4/5'], ['Carbohidratos', 'bg-carbs', 'w-3/5'], ['Grasas', 'bg-fat', 'w-2/5']].map(([label, color, w]) => (
            <div key={label} className="mb-2.5">
              <div className="mb-1 flex justify-between text-[9px] text-muted-foreground">
                <span>{label}</span><span className="h-2 w-10 rounded-full bg-secondary" />
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                <div className={`h-full rounded-full ${color} ${w}`} />
              </div>
            </div>
          ))}
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between rounded-lg bg-secondary/60 px-2.5 py-2">
              <div className="h-2 w-24 rounded-full bg-muted" /><div className="text-[9px] font-semibold">640 kcal</div>
            </div>
            <div className="flex justify-between rounded-lg bg-secondary/60 px-2.5 py-2">
              <div className="h-2 w-32 rounded-full bg-muted" /><div className="text-[9px] font-semibold">512 kcal</div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -right-8 top-16 rounded-2xl border border-primary/30 bg-card p-3 shadow-xl">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-primary">
          <TrendingDown className="h-3.5 w-3.5" /> −0,5 kg/sem
        </div>
        <div className="mt-1 text-[9px] text-muted-foreground">tendencia real</div>
      </div>
      <div className="absolute -left-10 bottom-24 rounded-2xl border border-border bg-card p-3 shadow-xl">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold"><Brain className="h-3.5 w-3.5 text-primary" /> Check-in</div>
        <div className="mt-1 text-[9px] text-muted-foreground">plan ajustado ✓</div>
      </div>
    </div>
  )
}

const FEATURES = [
  { icon: Brain, title: 'Coach que se adapta a ti', desc: 'Cada semana compara lo que comes con la tendencia de tu peso y recalcula tu gasto energético real. Sin fórmulas genéricas: tus datos mandan.' },
  { icon: ShieldCheck, title: 'Alimentos verificados + Open Food Facts', desc: 'Base curada con referencia USDA (incluye cocina ecuatoriana y latina) más 3M+ de productos envasados del mundo.' },
  { icon: Barcode, title: 'Escáner de código de barras', desc: 'Apunta al envase y registra al instante con datos reales de etiqueta. También entrada manual.' },
  { icon: Sparkles, title: 'IA que entiende lo que comes', desc: 'Escribe "un encebollado con arroz" y la IA lo desglosa en macros. Pregúntale lo que quieras: conoce tu plan y tu progreso.' },
  { icon: LineChart, title: 'Tendencia de peso sin ruido', desc: 'Media exponencial que filtra la retención de líquidos. Verás la dirección real, no el susto del día.' },
  { icon: Cloud, title: 'Sincronizado en la nube', desc: 'Cuenta con email o Kimi. Tus datos en todos tus dispositivos, y modo invitado sin registro si solo quieres probar.' },
]

const STEPS = [
  { n: '1', title: 'Cuéntanos sobre ti', desc: 'Estimamos tu metabolismo con la ecuación de Mifflin-St Jeor y fijamos tu objetivo.' },
  { n: '2', title: 'Registra sin fricción', desc: 'Escáner, búsqueda, IA por texto. 10 segundos por comida.' },
  { n: '3', title: 'El coach ajusta cada semana', desc: 'Tu plan se recalibra con tu progreso real. Sin castigos por días malos.' },
]

export default function Landing() {
  const navigate = useNavigate()
  return (
    <div className="min-h-dvh">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Flame className="h-5 w-5" />
            </div>
            <span className="font-bold tracking-tight">NutriAdapt</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Iniciar sesión</Button>
            <Button size="sm" onClick={() => navigate('/app')}>Empezar gratis</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-5xl items-center gap-10 px-5 pb-16 pt-12 md:grid-cols-2 md:pt-20">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Algoritmo adaptativo basado en evidencia
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
            El coach nutricional que <span className="text-primary">aprende de tu metabolismo</span>
          </h1>
          <p className="mt-4 max-w-md text-lg text-muted-foreground">
            Nada de calorías genéricas. NutriAdapt observa lo que comes y cómo responde tu peso,
            y ajusta tu plan cada semana. Con escáner, IA y base de datos verificada.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => navigate('/app')}>
              Empezar gratis <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/login')}>Ya tengo cuenta</Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Sin tarjeta · Pruébalo sin registrarte · Instálala como app desde el navegador
          </p>
        </div>
        <PhoneMock />
      </section>

      {/* Barra científica */}
      <section className="border-y border-border bg-card/50">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-5 py-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> Ecuación de Mifflin-St Jeor</span>
          <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> Tendencia de peso EMA</span>
          <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> Referencia USDA FoodData Central</span>
          <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> Open Food Facts</span>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="text-center text-3xl font-bold tracking-tight">Todo lo que un coach serio necesita</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-muted-foreground">
          Diseñado como una app premium: rápido de usar, honesto con los datos y sin culpas.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="transition-colors hover:border-primary/40">
              <CardContent className="p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="font-semibold">{f.title}</div>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="border-y border-border bg-card/50">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <h2 className="text-center text-3xl font-bold tracking-tight">Cómo funciona</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="text-center">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {s.n}
                </div>
                <div className="font-semibold">{s.title}</div>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Precios */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="text-center text-3xl font-bold tracking-tight">Empieza gratis hoy</h2>
        <div className="mx-auto mt-10 grid max-w-3xl gap-4 md:grid-cols-2">
          <Card className="border-primary/50 bg-gradient-to-b from-primary/10 to-transparent">
            <CardContent className="p-6">
              <div className="text-sm font-medium text-primary">Plan actual</div>
              <div className="mt-1 flex items-end gap-1">
                <span className="text-4xl font-extrabold">0 $</span>
                <span className="pb-1 text-sm text-muted-foreground">/ para siempre</span>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {['Coach adaptativo con check-in semanal', 'Base verificada + Open Food Facts + escáner', 'Tendencia de peso y proyecciones', 'Sincronización en la nube', 'Cocina ecuatoriana y latina'].map((x) => (
                  <li key={x} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" /> {x}</li>
                ))}
              </ul>
              <Button className="mt-5 w-full" onClick={() => navigate('/app')}>Empezar ahora</Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex h-full flex-col p-6">
              <div className="text-sm font-medium text-muted-foreground">Premium</div>
              <div className="mt-1 flex items-end gap-1">
                <span className="text-4xl font-extrabold text-muted-foreground">—</span>
              </div>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
                {['IA nutricional ilimitada', 'Registro por descripción con IA', 'Planes familiares', 'Exportaciones avanzadas', 'Soporte prioritario'].map((x) => (
                  <li key={x} className="flex gap-2"><Lock className="h-4 w-4 shrink-0" /> {x}</li>
                ))}
              </ul>
              <Button variant="outline" className="mt-5 w-full" disabled>Próximamente</Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA final */}
      <section className="border-t border-border bg-gradient-to-b from-primary/10 to-transparent">
        <div className="mx-auto max-w-5xl px-5 py-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Tu metabolismo es único. Tu plan también debería serlo.</h2>
          <Button size="lg" className="mt-6" onClick={() => navigate('/app')}>
            Empezar gratis <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ScanLine className="h-3.5 w-3.5" /> Instálala desde el navegador: menú → «Añadir a pantalla de inicio»
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-5 py-8 text-center text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Flame className="h-4 w-4" />
            </div>
            <span className="font-semibold text-foreground">NutriAdapt</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link to="/privacidad" className="hover:text-primary">Privacidad</Link>
            <Link to="/terminos" className="hover:text-primary">Términos</Link>
            <Link to="/terminos#descargo" className="hover:text-primary">Descargo médico</Link>
            <Link to="/login" className="hover:text-primary">Iniciar sesión</Link>
          </div>
          <p>
            Datos de productos envasados de <a href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer" className="underline hover:text-primary">Open Food Facts</a> (licencia ODbL).
            NutriAdapt no es un dispositivo médico ni sustituye el consejo de un profesional de la salud.
          </p>
          <p className="flex items-center gap-1.5"><UtensilsCrossed className="h-3 w-3" /> Hecho con ciencia, no con culpa.</p>
        </div>
      </footer>
    </div>
  )
}
