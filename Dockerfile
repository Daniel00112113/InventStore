FROM node:18-alpine

# Instalar dependencias del sistema para better-sqlite3
RUN apk add --no-cache python3 make g++

# Crear directorio de la app
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Crear directorio para base de datos
RUN mkdir -p /data

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/data/database.db

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Inicializar base de datos y arrancar
CMD ["sh", "-c", "npm run db:setup && npm start"]
