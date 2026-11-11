# Node só para gerar o build; quem serve os arquivos estáticos é o nginx
FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# O Vite embute a variável no bundle durante o build, por isso build arg:
# definir só no "environment" do container não teria efeito
ARG VITE_API_URL
RUN npm run build

FROM nginx:1.29-alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
