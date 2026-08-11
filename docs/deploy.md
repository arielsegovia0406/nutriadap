# Guía de publicación de NutriAdapt

Cómo llevar la app a producción con tu propio dominio, paso a paso.

---

## 1. Arquitectura de la app

| Pieza | Tecnología | Qué necesita |
|---|---|---|
| Frontend | React + Vite (estáticos en `dist/public`) | Servir archivos |
| Backend | Hono + tRPC (`dist/boot.js`, puerto 3000) | Node 20+ |
| Base de datos | MySQL (Drizzle ORM) | `DATABASE_URL` |
| Login | OAuth de Kimi | `APP_ID`, `APP_SECRET`, `KIMI_*` |
| IA | API de Moonshot (OpenAI-compatible) | `MOONSHOT_API_KEY` |

El `Dockerfile` incluido construye todo en una sola imagen (frontend + backend).

---

## 2. Opciones de alojamiento

**Opción A — Todo en uno (recomendada para empezar)**
- **Railway, Render o Fly.io**: subes el repo, detectan el `Dockerfile`, despliegan.
- Base de datos MySQL gestionada en el mismo panel (Railway la incluye con un clic).
- Coste: 0–5 $/mes al inicio.

**Opción B — VPS (más control)**
- Un servidor (Hetzner, DigitalOcean, ~4 €/mes) con Docker instalado:
  ```bash
  docker build -t nutriadapt .
  docker run -d -p 3000:3000 --env-file .env nutriadapt
  ```
- MySQL en otro contenedor o gestionado.

---

## 3. Variables de entorno necesarias

En el panel de tu hosting, configura:

```
DATABASE_URL=mysql://usuario:clave@host:3306/nutriadapt
APP_ID=...                  # portal de Kimi
APP_SECRET=...
KIMI_AUTH_URL=...
KIMI_OPEN_URL=...
VITE_APP_ID=...
VITE_KIMI_AUTH_URL=...
MOONSHOT_API_KEY=sk-...     # https://platform.moonshot.ai → API keys (gratuita)
MOONSHOT_MODEL=kimi-k2-0905-preview   # opcional
```

> Sin `MOONSHOT_API_KEY` la app funciona entera excepto la pestaña IA (mostrará un aviso amable).

## 4. Base de datos en producción

```bash
npm run db:generate   # genera la migración SQL
npm run db:migrate    # la aplica a la base de datos de producción
```

## 5. Conectar tu dominio

1. **Compra el dominio** (Namecheap, Cloudflare, GoDaddy… ~10-12 $/año).
2. **En tu hosting**, añade el dominio personalizado (Railway/Render tienen sección "Custom Domain").
3. **En el DNS de tu registrador**, crea:

| Tipo | Nombre | Valor |
|---|---|---|
| `CNAME` | `www` | el host que te indique el hosting |
| `A` o `ALIAS` | `@` (raíz) | la IP/host del hosting |

4. **HTTPS**: el hosting emite el certificado automáticamente (Let's Encrypt). Espera 5-30 min de propagación DNS.
5. **OAuth**: añade `https://tudominio.com/api/oauth/callback` como URL de callback en la configuración de tu app del portal de Kimi.

---

## 6. Checklist legal antes de abrir al público

- [ ] **Política de privacidad** (RGPD si hay usuarios europeos): qué datos guardas, por qué, cómo borrarlos.
- [ ] **Términos de servicio**.
- [ ] **Descargo médico**: "NutriAdapt no es un dispositivo médico ni sustituye consejo profesional".
- [ ] **Atribución a Open Food Facts**: datos bajo licencia ODbL — mención en "Acerca de" o ajustes.
- [ ] Si cobras suscripciones: política de reembolsos y facturación (Stripe/Paddle simplifican el IVA).

---

## 7. Lo que YA incluye la app (v1.0)

- ✅ Cuentas: **email + contraseña** (scrypt) y **Kimi OAuth**, sincronización nube multi-dispositivo
- ✅ **PWA instalable** (manifiesto, iconos, service worker, botón "Instalar" en Ajustes)
- ✅ **Landing page** pública + páginas legales (/privacidad, /terminos, descargo médico)
- ✅ Ajustes: editar perfil y recalcular plan, exportar datos (RGPD), eliminar cuenta
- ✅ IA (chat + registro por descripción) — requiere `MOONSHOT_API_KEY`
- ✅ Comida ecuatoriana + Open Food Facts + escáner real

## 8. Roadmap sugerido

1. Pagos: Stripe Checkout con los planes estilo MacroFactor (la pantalla de precios ya está)
2. Recuperación de contraseña por email (necesita servicio de correo: Resend, SendGrid)
3. Notificaciones push (recordatorio de pesaje y check-in)
4. App móvil nativa: Capacitor envuelve esta misma web para iOS/Android
