FROM node:20-bookworm as build-deps

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      fonts-liberation \
      libreoffice-writer \
      wget \
    && rm -rf /var/lib/apt/lists/*

ENV DOCKERIZE_VERSION v0.6.1
RUN wget https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && tar -C /usr/local/bin -xzvf dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && rm dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz

ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.1/dumb-init_1.2.1_amd64 /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init

WORKDIR /usr/src/app
COPY package*.json ./
RUN PUPPETEER_SKIP_DOWNLOAD=true npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD dockerize -wait tcp://${DB_HOST}:3306 \
  && npx sequelize db:migrate \
  && npx sequelize db:seed:all \
  && node dist/server.js
