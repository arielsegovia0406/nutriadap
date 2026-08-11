FROM node:20-slim
WORKDIR /app

# Dependencias
COPY package.json package-lock.json ./
RUN npm ci

# Código y build (frontend → dist/public, backend → dist/boot.js)
COPY . .
RUN npm run build

# Variables de entorno se inyectan en el despliegue (DATABASE_URL, APP_ID/APP_SECRET,
# KIMI_AUTH_URL, KIMI_OPEN_URL, VITE_*, MOONSHOT_API_KEY…)
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
