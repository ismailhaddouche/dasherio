FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build -- --output-path=dist/disherio

FROM caddy:2-alpine AS runner
COPY --from=builder /app/dist/disherio/browser /srv
COPY Caddyfile.frontend /etc/caddy/Caddyfile
EXPOSE 4200
