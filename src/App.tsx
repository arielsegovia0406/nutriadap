import { useState } from 'react'
import { Route, Routes, useNavigate } from 'react-router'
import { Brain, Cloud, CloudOff, CloudRain, Flame, LayoutDashboard, LineChart, Loader2, LogIn, LogOut, RotateCcw, Settings as SettingsIcon, Sparkles } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { StoreProvider, useStore } from '@/lib/store'
import { useAuth } from '@/hooks/useAuth'
import Onboarding from '@/sections/Onboarding'
import Dashboard from '@/sections/Dashboard'
import Coach from '@/sections/Coach'
import Progress from '@/sections/Progress'
import AICoach from '@/sections/AICoach'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Settings from '@/pages/Settings'
import { PrivacyPolicy, Terms } from '@/pages/Legal'
import NotFound from '@/pages/NotFound'

type Tab = 'dashboard' | 'coach' | 'ai' | 'progress'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Hoy', icon: <LayoutDashboard className="h-5 w-5" /> },
  { id: 'coach', label: 'Coach', icon: <Brain className="h-5 w-5" /> },
  { id: 'ai', label: 'IA', icon: <Sparkles className="h-5 w-5" /> },
  { id: 'progress', label: 'Progreso', icon: <LineChart className="h-5 w-5" /> },
]

function SyncBadge() {
  const { syncStatus } = useStore()
  if (syncStatus === 'synced')
    return <span className="flex items-center gap-1 text-[10px] text-primary"><Cloud className="h-3 w-3" /> Sincronizado</span>
  if (syncStatus === 'syncing')
    return <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Sincronizando…</span>
  if (syncStatus === 'error')
    return <span className="flex items-center gap-1 text-[10px] text-destructive"><CloudRain className="h-3 w-3" /> Error de sync</span>
  return <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><CloudOff className="h-3 w-3" /> Solo este dispositivo</span>
}

function AccountMenu() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title="Cuenta">
          {isAuthenticated ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
              {(user?.name?.[0] ?? 'U').toUpperCase()}
            </span>
          ) : (
            <LogIn className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {isAuthenticated ? (
          <>
            <DropdownMenuLabel>
              <div className="font-semibold">{user?.name ?? 'Usuario'}</div>
              {user?.email && <div className="text-xs font-normal text-muted-foreground">{user.email}</div>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Inicia sesión para sincronizar tus datos en la nube y usar la IA.
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/login')}>
              <LogIn className="mr-2 h-4 w-4" /> Iniciar sesión con Kimi
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Shell() {
  const { onboarded, profile, resetAll } = useStore()
  const [tab, setTab] = useState<Tab>('dashboard')
  const navigate = useNavigate()

  if (!onboarded) return <Onboarding />

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight">NutriAdapt</div>
            <div className="text-xs text-muted-foreground">Hola, {profile?.name ?? 'atleta'}</div>
            <SyncBadge />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" title="Ajustes" onClick={() => navigate('/ajustes')}>
            <SettingsIcon className="h-4 w-4 text-muted-foreground" />
          </Button>
          <AccountMenu />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" title="Reiniciar datos">
                <RotateCcw className="h-4 w-4 text-muted-foreground" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle>¿Reiniciar todos los datos?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se borrarán tu perfil, registros de comida, pesajes y ajustes del coach, también en la nube. Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => { resetAll(); setTab('dashboard') }}>Sí, borrar todo</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <main className="flex-1 px-4 pt-4">
        {tab === 'dashboard' && <Dashboard onGoToWeight={() => setTab('progress')} />}
        {tab === 'coach' && <Coach />}
        {tab === 'ai' && <AICoach />}
        {tab === 'progress' && <Progress />}
      </main>

      <nav className="sticky bottom-0 z-10 border-t border-border bg-background/90 backdrop-blur">
        <div className="grid grid-cols-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
                tab === t.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<Shell />} />
        <Route path="/login" element={<Login />} />
        <Route path="/ajustes" element={<Settings />} />
        <Route path="/privacidad" element={<PrivacyPolicy />} />
        <Route path="/terminos" element={<Terms />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </StoreProvider>
  )
}
