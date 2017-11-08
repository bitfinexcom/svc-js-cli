# svc-js-cli

Bootstraps Grenache Services.

## Installation

```
npm i -g https://github.com/bitfinexcom/svc-js-cli.git

# or link it (good for development):

git clone https://github.com/bitfinexcom/svc-js-cli
cd svc-js-cli
npm link
```

You'll also need an up-to-date fork of the base repo you want to use as service base, e.g.

 - https://github.com/bitfinexcom/bfx-svc-js
 - https://github.com/bitfinexcom/bfx-util-js
 - https://github.com/bitfinexcom/bfx-ext-js

## Usage

Internally the CLI copies a base service, e.g. bfx-util-js over to the new target directory and creates required files and configurations to run a basic service. The first two arguments are the service-name and the port for the new service. After that you have to provide the service source, e.g. `bfx-util-js`.

*Note:* the upstream path is derived from the directory name of the service source, but can be overriden with the `--upstream` argument.

To setup a util-js based Grenache API service, run:

```
svc-js-cli init grenache-api-base <service-name> <port> <svc-src>

Example:

svc-js-cli init grenache-api-base bfx-util-net-js 1337 ~/bitfinex/bfx-util-js
```
