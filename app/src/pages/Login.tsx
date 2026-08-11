import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Flame, Loader2, Mail, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

type Mode = "login" | "register";

export default function Login() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSuccess = async () => {
    await refresh();
    navigate("/app");
  };

  const login = trpc.emailAuth.login.useMutation({
    onSuccess,
    onError: (e) => setError(e.message),
  });
  const register = trpc.emailAuth.register.useMutation({
    onSuccess,
    onError: (e) => setError(e.message),
  });
  const pending = login.isPending || register.isPending;

  const submit = () => {
    setError(null);
    if (mode === "login") {
      login.mutate({ email: email.trim(), password });
    } else {
      register.mutate({ name: name.trim(), email: email.trim(), password });
    }
  };

  const canSubmit =
    /^\S+@\S+\.\S+$/.test(email.trim()) &&
    password.length >= 8 &&
    (mode === "login" || name.trim().length > 0);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-5 py-8">
      <Link to="/" className="mb-8 flex items-center justify-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Flame className="h-6 w-6" />
        </div>
        <div className="text-left">
          <div className="text-xl font-bold tracking-tight">NutriAdapt</div>
          <div className="text-xs text-muted-foreground">Coach nutricional adaptativo</div>
        </div>
      </Link>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1">
            <button
              onClick={() => { setMode("login"); setError(null); }}
              className={`rounded-lg py-1.5 text-xs font-medium transition-colors ${mode === "login" ? "bg-background text-primary shadow" : "text-muted-foreground"}`}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => { setMode("register"); setError(null); }}
              className={`rounded-lg py-1.5 text-xs font-medium transition-colors ${mode === "register" ? "bg-background text-primary shadow" : "text-muted-foreground"}`}
            >
              Crear cuenta
            </button>
          </div>

          {mode === "register" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="¿Cómo te llamamos?" autoComplete="name" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" autoComplete="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              onKeyDown={(e) => e.key === "Enter" && canSubmit && !pending && submit()}
            />
          </div>

          {error && (
            <div className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive">{error}</div>
          )}

          <Button className="w-full" size="lg" disabled={!canSubmit || pending} onClick={submit}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
            {mode === "login" ? "Entrar con email" : "Crear mi cuenta"}
          </Button>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> o <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            className="w-full"
            size="lg"
            onClick={() => { window.location.href = getOAuthUrl(); }}
          >
            <Sparkles className="mr-2 h-4 w-4" /> Continuar con Kimi
          </Button>

          <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
            Al continuar aceptas los <Link to="/terminos" className="underline hover:text-primary">términos</Link> y la{" "}
            <Link to="/privacidad" className="underline hover:text-primary">política de privacidad</Link>.
          </p>
        </CardContent>
      </Card>

      <button onClick={() => navigate("/app")} className="mt-4 text-center text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline">
        Seguir sin cuenta (los datos quedan solo en este dispositivo)
      </button>
    </div>
  );
}
