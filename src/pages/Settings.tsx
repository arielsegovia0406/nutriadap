import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  ArrowLeft, Download, Flame, Loader2, LogOut, Recycle, Save,
  Smartphone, Trash2, TriangleAlert, UserRound,
} from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ActivityLevel, Goal, Profile } from '@/types'
import { ACTIVITY_FACTORS, GOAL_LABELS, RATE_OPTIONS, currentTrendWeight, initialPlan, todayStr } from '@/lib/nutrition'
import { useStore } from '@/lib/store'
import { useAuth } from '@/hooks/useAuth'
import { trpc } from '@/providers/trpc'

export default function Settings() {
  const navigate = useNavigate()
  const { profile, plan, weightLog, updateProfile, resetAll, isAuthenticated } = useStore()
  const { user, logout, refresh } = useAuth()
  const [saved, setSaved] = useState(false)

  const [name, setName] = useState(profile?.name ?? '')
  const [age, setAge] = useState(String(profile?.age ?? 30))
  const [heightCm, setHeightCm] = useState(String(profile?.heightCm ?? 175))
  const [activity, setActivity] = useState<ActivityLevel>(profile?.activity ?? 'moderate')
  const [goal, setGoal] = useState<Goal>(profile?.goal ?? 'maintain')
  const [rate, setRate] = useState(String(profile?.rateKgPerWeek ?? 0.5))

  useEffect(() => {
    if (profile) {
      setName(profile.name); setAge(String(profile.age)); setHeightCm(String(profile.heightCm))
      setActivity(profile.activity); setGoal(profile.goal); setRate(String(profile.rateKgPerWeek))
    }
  }, [profile])

  /* Instalación PWA */
  const [installEvt, setInstallEvt] = useState<Event | null>(null)
  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setInstallEvt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  /* Exportar datos */
  const exportQ = trpc.nutria.exportData.useQuery(undefined, { enabled: false })
  const [exporting, setExporting] = useState(false)
  const exportData = async () => {
    setExporting(true)
    try {
      const data = isAuthenticated
        ? (await exportQ.refetch()).data
        : JSON.parse(localStorage.getItem('nutriadapt-v1') ?? '{}')
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `nutriadapt-datos-${todayStr()}.json`
      a.click()
      URL.revokeObjectURL(a.href)
    } finally {
      setExporting(false)
    }
  }

  const deleteAccount = trpc.nutria.deleteAccount.useMutation({
    onSuccess: async () => {
      resetAll()
      await refresh()
      navigate('/')
    },
  })

  if (!profile) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-5 text-sm text-muted-foreground">
        Completa primero tu perfil. <Button variant="link" onClick={() => navigate('/app')}>Ir a la app</Button>
      </div>
    )
  }

  const saveProfile = () => {
    const newProfile: Profile = {
      ...profile,
      name: name.trim() || profile.name,
      age: +age || profile.age,
      heightCm: +heightCm || profile.heightCm,
      activity,
      goal,
      rateKgPerWeek: goal === 'maintain' ? 0 : +rate || profile.rateKgPerWeek,
    }
    // Recalcula el plan con el peso tendencia actual (más preciso que el de inicio)
    const trendKg = currentTrendWeight(weightLog) ?? profile.startWeightKg
    const newPlan = { ...initialPlan({ ...newProfile, startWeightKg: trendKg }), effectiveFrom: todayStr() }
    updateProfile(newProfile, newPlan)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg px-4 pb-10 pt-4">
      <div className="mb-5 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/app')}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Volver
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Flame className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold">Ajustes</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Perfil y objetivo */}
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2 font-semibold"><UserRound className="h-4 w-4 text-primary" /> Perfil y objetivo</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-3 space-y-1.5">
                <Label>Nombre</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Edad</Label>
                <Input type="number" min={14} max={100} value={age} onChange={(e) => setAge(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Altura (cm)</Label>
                <Input type="number" min={120} max={230} value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Actividad</Label>
                <select
                  value={activity}
                  onChange={(e) => setActivity(e.target.value as ActivityLevel)}
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                >
                  {Object.entries(ACTIVITY_FACTORS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Objetivo</Label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as Goal)}
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                >
                  {Object.entries(GOAL_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              {goal !== 'maintain' && (
                <div className="space-y-1.5">
                  <Label>Ritmo</Label>
                  <select
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  >
                    {RATE_OPTIONS[goal].map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {plan && (
              <p className="rounded-xl bg-secondary p-3 text-xs text-muted-foreground">
                Al guardar se recalculará tu plan con tu peso tendencia actual. Plan vigente:{' '}
                <span className="font-semibold text-foreground">{plan.calories.toLocaleString('es-ES')} kcal</span>.
              </p>
            )}
            <Button className="w-full" onClick={saveProfile}>
              {saved ? '¡Guardado y plan recalculado!' : <><Save className="mr-2 h-4 w-4" /> Guardar cambios</>}
            </Button>
          </CardContent>
        </Card>

        {/* Instalar app */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Smartphone className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">Instalar NutriAdapt</div>
              <div className="text-xs text-muted-foreground">
                {installEvt ? 'Disponible en este dispositivo' : 'Menú del navegador → «Añadir a pantalla de inicio»'}
              </div>
            </div>
            {installEvt && (
              <Button size="sm" onClick={() => (installEvt as unknown as { prompt: () => void }).prompt()}>Instalar</Button>
            )}
          </CardContent>
        </Card>

        {/* Cuenta */}
        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center gap-2 font-semibold"><LogOut className="h-4 w-4 text-primary" /> Cuenta</div>
            {isAuthenticated && user ? (
              <>
                <div className="rounded-xl bg-secondary p-3 text-sm">
                  <div className="font-medium">{user.name ?? 'Usuario'}</div>
                  {user.email && <div className="text-xs text-muted-foreground">{user.email}</div>}
                </div>
                <Button variant="outline" className="w-full" onClick={logout}>Cerrar sesión</Button>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  Estás en modo invitado: tus datos solo viven en este dispositivo. Crea una cuenta para sincronizarlos y usar la IA.
                </p>
                <Button className="w-full" onClick={() => navigate('/login')}>Crear cuenta o entrar</Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Datos */}
        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center gap-2 font-semibold"><Download className="h-4 w-4 text-primary" /> Tus datos</div>
            <Button variant="outline" className="w-full" onClick={exportData} disabled={exporting}>
              {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Exportar todo (JSON)
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Recycle className="mr-2 h-4 w-4" /> Reiniciar datos (mantener cuenta)
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-sm">
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Reiniciar todos los datos?</AlertDialogTitle>
                  <AlertDialogDescription>Se borran perfil, registros y ajustes del coach{isAuthenticated ? ', también en la nube' : ''}. Tu cuenta sigue activa.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { resetAll(); navigate('/app') }}>Reiniciar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* Zona de peligro */}
        {isAuthenticated && (
          <Card className="border-destructive/40">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center gap-2 font-semibold text-destructive"><TriangleAlert className="h-4 w-4" /> Zona de peligro</div>
              <p className="text-xs text-muted-foreground">
                Eliminar tu cuenta borra permanentemente todos tus datos de nuestros servidores. No se puede deshacer.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full" disabled={deleteAccount.isPending}>
                    {deleteAccount.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Eliminar mi cuenta definitivamente
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-sm">
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar la cuenta para siempre?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se borrarán tu cuenta, tu perfil, todos tus registros y conversaciones de IA. Escribe mentalmente tu despedida: esto no tiene vuelta atrás.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Mejor no</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteAccount.mutate()}>Sí, eliminar todo</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        )}

        {/* Legal */}
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 pt-2 text-xs text-muted-foreground">
          <Link to="/privacidad" className="hover:text-primary">Privacidad</Link>
          <Link to="/terminos" className="hover:text-primary">Términos</Link>
          <Link to="/terminos#descargo" className="hover:text-primary">Descargo médico</Link>
          <span>v1.0.0</span>
        </div>
      </div>
    </div>
  )
}
