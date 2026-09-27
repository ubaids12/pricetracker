FROM node:24-bookworm

WORKDIR /app

COPY package*.json ./

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

RUN npm ci

RUN npx playwright install --with-deps chromium

COPY . .

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]