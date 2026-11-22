FROM node:22-alpine AS build
WORKDIR /app
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM node:22-alpine
WORKDIR /app
RUN npm install --global vite
COPY --from=build /app/dist ./dist
EXPOSE 5173
CMD ["vite", "preview", "--host", "0.0.0.0", "--port", "5173"]
