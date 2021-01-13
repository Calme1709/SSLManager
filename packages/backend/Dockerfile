FROM node:latest

WORKDIR /usr/src/app

COPY . .

RUN npm install

RUN npm run build

RUN rm -rf node_modules/

RUN npm install --only=production

EXPOSE 80

CMD [ "node", "dist/build.js" ]