FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001

COPY --from=builder /app/node_modules ./node_modules
COPY --chown=nodeuser:nodejs ./src ./src
COPY --chown=nodeuser:nodejs package*.json ./

USER nodeuser

EXPOSE 5001

CMD ["npm", "start"]
