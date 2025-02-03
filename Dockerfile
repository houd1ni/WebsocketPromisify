FROM node:18

WORKDIR /app
COPY . ./

RUN npm install --package-lock-only

EXPOSE 3000
CMD ["npm", "start"]