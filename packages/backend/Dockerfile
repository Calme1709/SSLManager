FROM node:latest

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --only=production

COPY ./dist ./

EXPOSE 80

CMD [ "node", "build.js" ]