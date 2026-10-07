FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY scripts ./scripts
ENV NODE_ENV=production PORT=8788 DB_PATH=/data/campusos.db
VOLUME /data
EXPOSE 8788
CMD ["node", "--disable-warning=ExperimentalWarning", "src/server.js"]
