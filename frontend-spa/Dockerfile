FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Uruchom serwer deweloperski Vite z dostępem z zewnątrz
CMD ["npm", "run", "dev"]
