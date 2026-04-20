FROM node:20-alpine

WORKDIR /app

COPY catalog/package.json catalog/package-lock.json ./
RUN npm ci

COPY catalog/ ./

ENV HOST=0.0.0.0

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
