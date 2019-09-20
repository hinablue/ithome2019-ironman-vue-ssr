FROM node:lts-alpine
MAINTAINER Hina Chen <hinablue@gmail.com>

USER root

RUN npm update -g \
  && npm install -g concurrently cross-env \
  && npm cache verify

RUN mkdir -p /usr/app \
  && chmod a+w /usr/app \
  && rm -rf /var/cache/apk/*

WORKDIR /usr/app

COPY package.json package.json

RUN npm install \
  && npm cache verify

VOLUME ["/usr/app", "/usr/app/node_modules"]

COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
