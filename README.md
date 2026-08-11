# NutriAdapt

Coach nutricional adaptativo que se ajusta a tu metabolismo: seguimiento de macros, peso, check-ins semanales y asistente con IA.

## Características

- Dashboard nutricional con objetivos de macros personalizados
- Búsqueda de alimentos y escáner de código de barras (Open Food Facts)
- Coach con IA para recomendaciones y ajustes
- Seguimiento de progreso y check-ins semanales
- PWA instalable en móvil
- Autenticación OAuth (Kimi)

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 19 + Vite + Tailwind CSS + shadcn/ui |
| Backend | Hono + tRPC |
| Base de datos | MySQL + Drizzle ORM |
| IA | Moonshot API (OpenAI-compatible) |

## Inicio rápido

```bash
git clone https://github.com/arielsegovia0406/nutriadap.git
cd nutriadap
npm install
cp .env.example .env   # completa las variables
npm run dev
```

La app estará disponible en `http://localhost:3000`.

## Variables de entorno

Copia `.env.example` a `.env` y configura:

- `DATABASE_URL` — conexión MySQL
- `APP_ID` / `APP_SECRET` — credenciales de la aplicación
- `KIMI_AUTH_URL` / `KIMI_OPEN_URL` — OAuth Kimi
- `VITE_KIMI_AUTH_URL` / `VITE_APP_ID` — variables expuestas al frontend
- `MOONSHOT_API_KEY` — API de IA

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm start` | Servidor de producción |
| `npm run db:push` | Sincronizar esquema con la base de datos |
| `npm test` | Ejecutar tests |

## Despliegue

Consulta la [guía de publicación y dominio](docs/deploy.md) para desplegar con Docker en Railway, Render, Fly.io o un VPS.

## Estructura del proyecto

```
├── api/           Backend Hono + tRPC
├── src/           Frontend React
├── db/            Esquema y migraciones Drizzle
├── contracts/     Tipos compartidos
├── public/        Iconos y assets estáticos
└── docs/          Documentación de despliegue
```

## Licencia

Proyecto privado. Todos los derechos reservados.
