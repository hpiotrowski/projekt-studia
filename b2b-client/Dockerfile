
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm install

FROM node:18-alpine

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV PORT=5002

EXPOSE 5002
CMD ["node", "src/app.js"]
