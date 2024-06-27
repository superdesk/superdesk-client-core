FROM node:14-alpine

RUN apk add openssh-client
RUN apk add python3
RUN apk add git
RUN apk add chromium

RUN git clone https://github.com/superdesk/superdesk-client-core.git

WORKDIR /superdesk-client-core

RUN git checkout origin/develop

RUN npm ci

ENV CHROME_BIN="/usr/bin/chromium-browser"
ENV TZ="Europe/Prague"

# keep running
CMD python3 -m http.server 8001