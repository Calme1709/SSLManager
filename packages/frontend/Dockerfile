FROM node:latest as builder

WORKDIR /usr/src/app

COPY . .

RUN npm install

RUN npm run build

FROM nginx
COPY --from=builder /usr/src/app/dist/ /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf