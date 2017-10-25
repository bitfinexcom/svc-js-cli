# svc-js-cli

## Installation

```
npm i -g https://github.com/bitfinexcom/svc-js-cli.git

# or link it (good for development):

git clone https://github.com/bitfinexcom/svc-js-cli
cd svc-js-cli
npm link
```

You'll also need a fork of https://github.com/bitfinexcom/bfx-svc-js

## Usage

Bootstraps Grenache Services. To set up a standard Grenache API service, run:

```
svc-js-cli init grenache-api-base <service-name> <port> <svc-src>

Example:

svc-js-cli init grenache-api-base bfx-util-net-js 1337
```
