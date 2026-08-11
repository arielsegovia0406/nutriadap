import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Bot, Check, Loader2, Lock, MessageSquareText, Send, Sparkles, Trash2, UtensilsCrossed, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { FoodItem, MealType } from '@/types'
import { todayStr } from '@/lib/nutrition'
import { useStore } from '@/lib/store'
import { trpc } from '@/providers/trpc'

const QUICK_PROMPTS = [
  '¿Qué ceno si me quedan 30 g de proteína?',
  'Explícame mi último check-in',
  'Ideas de desayuno alto en proteína',
  '¿Por qué fluctúa tanto mi peso?',
]

type Mode = 'chat' | 'log'

interface ParsedItem {
  foodId: string | null
  name: string
  grams: number
  kcal: number
  protein: number
  carbs: number
  fat: number
  included: boolean
}

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Desayuno',
  lunch: 'Comida',
  dinner: 'Cena',
  snacks: 'Snacks',
}

export default function AICoach() {
  const { isAuthenticated, addFoodEntry, addCustomFood } = useStore()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('chat')

  /* ---------- Chat ---------- */
  const history = trpc.ai.history.useQuery(undefined, { enabled: isAuthenticated })
  const utils = trpc.useUtils()
  const chat = trpc.ai.chat.useMutation({
    onSuccess: () => utils.ai.history.invalidate(),
  })
  const clear = trpc.ai.clear.useMutation({
    onSuccess: () => utils.ai.history.invalidate(),
  })
  const [message, setMessage] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [history.data, chat.isPending])

  const send = (text: string) => {
    const msg = text.trim()
    if (!msg || chat.isPending) return
    setMessage('')
    chat.mutate({ message: msg })
  }

  /* ---------- Registro por texto ---------- */
  const parse = trpc.ai.parseMeal.useMutation()
  const [description, setDescription] = useState('')
  const [meal, setMeal] = useState<MealType>('lunch')
  const [items, setItems] = useState<ParsedItem[] | null>(null)
  const [logged, setLogged] = useState(false)

  const analyze = () => {
    const desc = description.trim()
    if (!desc || parse.isPending) return
    setLogged(false)
    parse.mutate(
      { description: desc },
      {
        onSuccess: (data) => setItems(data.items.map((i) => ({ ...i, included: true }))),
      },
    )
  }

  const confirmLog = () => {
    if (!items) return
    const date = todayStr()
    for (const item of items.filter((i) => i.included)) {
      let foodId = item.foodId
      if (!foodId) {
        // Crea un alimento personalizado estimado por la IA (valores por 100 g)
        foodId = `ai_${Math.random().toString(36).slice(2, 10)}`
        const factor = 100 / item.grams
        const custom: FoodItem = {
          id: foodId,
          name: item.name,
          category: 'Estimado por IA',
          source: 'ai',
          kcal: Math.round(item.kcal * factor),
          protein: Math.round(item.protein * factor * 10) / 10,
          carbs: Math.round(item.carbs * factor * 10) / 10,
          fat: Math.round(item.fat * factor * 10) / 10,
          servingDesc: `1 porción (${Math.round(item.grams)} g)`,
          servingG: Math.round(item.grams),
        }
        addCustomFood(custom)
      }
      addFoodEntry(date, meal, foodId, Math.round(item.grams))
    }
    setItems(null)
    setDescription('')
    setLogged(true)
  }

  /* ---------- Invitado ---------- */
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center pb-6">
        <Card className="border-primary/30">
          <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Lock className="h-7 w-7" />
            </div>
            <div>
              <div className="text-lg font-bold">La IA requiere cuenta</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Inicia sesión con Kimi para chatear con tu coach de IA y registrar comidas describiendo lo que comiste.
                Además tus datos se sincronizarán en la nube.
              </p>
            </div>
            <Button size="lg" className="w-full" onClick={() => navigate('/login')}>
              Iniciar sesión con Kimi
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const apiKeyMissing =
    chat.error?.data?.code === 'PRECONDITION_FAILED' || parse.error?.data?.code === 'PRECONDITION_FAILED'

  return (
    <div className="flex h-[calc(100dvh-170px)] flex-col gap-3 pb-4">
      {/* Selector de modo */}
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1">
        <button
          onClick={() => setMode('chat')}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors ${mode === 'chat' ? 'bg-background text-primary shadow' : 'text-muted-foreground'}`}
        >
          <MessageSquareText className="h-3.5 w-3.5" /> Pregunta al coach
        </button>
        <button
          onClick={() => setMode('log')}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors ${mode === 'log' ? 'bg-background text-primary shadow' : 'text-muted-foreground'}`}
        >
          <UtensilsCrossed className="h-3.5 w-3.5" /> Registra por texto
        </button>
      </div>

      {apiKeyMissing && (
        <Card className="border-carbs/40">
          <CardContent className="p-3 text-xs text-muted-foreground">
            <span className="font-semibold text-carbs">Falta la clave de IA.</span> El servidor necesita{' '}
            <code className="rounded bg-secondary px-1">MOONSHOT_API_KEY</code> (gratuita en platform.moonshot.ai)
            en sus variables de entorno para activar esta sección.
          </CardContent>
        </Card>
      )}

      {mode === 'chat' ? (
        <>
          {/* Mensajes */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto pr-1 scrollbar-thin">
            {(history.data ?? []).length === 0 && !chat.isPending && (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="text-sm font-semibold">Pregúntame lo que quieras</div>
                <p className="max-w-xs text-xs text-muted-foreground">
                  Conozco tu plan, tus macros de hoy y tu progreso. Algunas ideas:
                </p>
                <div className="flex max-w-sm flex-wrap justify-center gap-2">
                  {QUICK_PROMPTS.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {(history.data ?? []).map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'rounded-br-md bg-primary text-primary-foreground'
                      : 'rounded-bl-md bg-secondary'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {chat.isPending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-secondary px-3.5 py-2.5 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" /> Pensando…
                </div>
              </div>
            )}
            {chat.error && !apiKeyMissing && (
              <div className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
                {chat.error.message}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            {(history.data ?? []).length > 0 && (
              <Button variant="ghost" size="icon" title="Borrar conversación" onClick={() => clear.mutate()}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
            <Input
              placeholder="Escribe tu pregunta…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send(message)}
              disabled={chat.isPending}
            />
            <Button size="icon" onClick={() => send(message)} disabled={!message.trim() || chat.isPending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </>
      ) : (
        /* ---------- Registrar por texto ---------- */
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1 scrollbar-thin">
          <p className="text-xs text-muted-foreground">
            Describe lo que comiste con cantidades aproximadas. La IA lo desglosa en alimentos y calcula los macros.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Ej: un encebollado con arroz y una colada morada"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && analyze()}
              disabled={parse.isPending}
            />
            <Button onClick={analyze} disabled={description.trim().length < 2 || parse.isPending}>
              {parse.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex gap-1.5">
            {(Object.keys(MEAL_LABELS) as MealType[]).map((m) => (
              <button
                key={m}
                onClick={() => setMeal(m)}
                className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition-colors ${meal === m ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground'}`}
              >
                {MEAL_LABELS[m]}
              </button>
            ))}
          </div>

          {parse.error && !apiKeyMissing && (
            <div className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive">{parse.error.message}</div>
          )}

          {logged && (
            <div className="flex items-center gap-2 rounded-xl bg-primary/10 p-3 text-sm text-primary">
              <Check className="h-4 w-4" /> Registrado en {MEAL_LABELS[meal].toLowerCase()} de hoy
            </div>
          )}

          {items && (
            <Card>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Revisa antes de registrar</div>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(items.filter((i) => i.included).reduce((s, i) => s + i.kcal, 0))} kcal
                  </span>
                </div>
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 transition-colors ${item.included ? 'border-border' : 'border-transparent opacity-40'}`}
                  >
                    <button
                      onClick={() => setItems((arr) => arr && arr.map((x, i) => (i === idx ? { ...x, included: !x.included } : x)))}
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${item.included ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}
                    >
                      {item.included ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium">{item.name}</span>
                        {!item.foodId && (
                          <span className="shrink-0 rounded-full bg-carbs/15 px-1.5 py-0.5 text-[9px] font-medium text-carbs">estimado</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round(item.grams)} g · P {Math.round(item.protein)} · C {Math.round(item.carbs)} · G {Math.round(item.fat)}
                      </div>
                    </div>
                    <div className="text-sm font-semibold">{Math.round(item.kcal)} kcal</div>
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" className="flex-1" onClick={() => setItems(null)}>Descartar</Button>
                  <Button className="flex-1" onClick={confirmLog} disabled={!items.some((i) => i.included)}>
                    Registrar en {MEAL_LABELS[meal].toLowerCase()}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!items && !parse.isPending && !logged && (
            <div className="rounded-xl bg-secondary p-3 text-[11px] leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">Consejos:</span> incluye cantidades ("200 g de arroz"),
              métodos ("a la plancha") y marcas si las hay. Si un alimento está en tu base verificada o en Open Food
              Facts, la IA usará sus valores exactos; si no, los estimará con la etiqueta «estimado».
            </div>
          )}
        </div>
      )}
    </div>
  )
}
