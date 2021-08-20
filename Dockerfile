FROM node:16-alpine3.11

WORKDIR /

COPY /package.json ./

RUN npm install

COPY . .

CMD ["npm","run", "start"]


