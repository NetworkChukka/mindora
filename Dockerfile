# Multi-stage build for MINDORA Client & Server
FROM node:20-alpine AS build-client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --silent
COPY client/ ./
RUN npm run build

# Final Production Stage
FROM node:20-alpine
WORKDIR /app

# Copy server package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production --silent

# Copy server codebase and compiled static frontend build
COPY server/ ./server
COPY --from=build-client /app/client/dist ./client/dist

# Expose server port
EXPOSE 3000

ENV NODE_ENV=production
ENV MONGODB_URI=mongodb://mongo:27017/mindora
ENV PORT=3000

CMD ["node", "server/server.js"]
