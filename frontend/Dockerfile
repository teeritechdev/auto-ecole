# --- Étape de build ---
FROM node:24-alpine AS build
WORKDIR /app

# Les dépendances sont mises en cache tant que package*.json ne change pas
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Étape de service (nginx sert les fichiers statiques + reverse-proxy /api) ---
FROM nginx:alpine
COPY --from=build /app/dist/auto-ecole-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
