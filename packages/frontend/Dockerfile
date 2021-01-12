FROM node:latest as builder

WORKDIR /usr/src/app

COPY . .

RUN npm install

RUN npm run build

WORKDIR /usr/src/app/dist

FROM nginx
COPY --from=builder ./ /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf