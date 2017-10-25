'use strict'

const pkg = require('../../package.json')

exports.cli = cliHelp
exports.cli.usage = 'Usage: svc-js-cli help'

function cliHelp ([ cmd ], cb) {
  console.log(getMainHelpText())
  cb(null)
}

function getMainHelpText () {
  return `Usage:
svc-js-cli <command>

Available Commands:
init grenache-api-base     creates a simple Grenache service

Example: \`svc-js-cli init grenache-api-base my-service 1337\`

svc-js-cli@${pkg.version}`
}
