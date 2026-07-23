FROM node:24-alpine AS builder

WORKDIR /app

RUN apk update && \
    apk upgrade && \
    apk add \
    make \
    g++ \
    python3 

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

RUN corepack enable

RUN pnpm install --prod --frozen-lockfile

FROM node:24-alpine

WORKDIR /app

ENV NODE_ENV="production"

RUN apk update && \
    apk upgrade && \
    apk add --no-cache dumb-init

RUN mkdir /app/data && \
    chown -R node:node /app

COPY --chown=node:node --from=builder /app .
COPY --chown=node:node src/ src/

USER node:node

EXPOSE 3000/tcp

ENV SCRIPT_NAME=start

ENTRYPOINT [ "/usr/bin/dumb-init", "--" ]
CMD npm run $SCRIPT_NAME
