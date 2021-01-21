FROM node:lts-alpine@sha256:2ae9624a39ce437e7f58931a5747fdc60224c6e40f8980db90728de58e22af7c

RUN apk add dumb-init openssl python3 make gcc musl-dev g++

WORKDIR /usr/src/app

COPY --chown=node:node . .

RUN npm ci

RUN ls /usr/src/app/node_modules

ENV NODE_ENV production

RUN npm ci

RUN ls /usr/src/app/node_modules/

USER node

CMD [ "dumb-init", "node", "dist/build.js" ]