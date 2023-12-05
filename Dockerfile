FROM node:18-alpine

ENV NODE_ENV=production

WORKDIR /ALEMENO

COPY ["package.json", "package-lock.json*", "./"]

RUN npm config set registry http://registry.npmjs.org/

RUN npm install 

COPY . .

EXPOSE 3000

CMD ["node", "src/index.js"]