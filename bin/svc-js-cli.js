#!/usr/bin/env node

'use strict'

const nopt = require('nopt')
const handleError = require('../lib/handle-error.js')
process.on('uncaughtException', handleError)
const svcJs = require('../lib/svc-js.js')

const parsed = nopt(
  { 'base': [ String ] },
  {},
  process.argv, 2
)

const cmd = parsed.argv.remain.shift()

svcJs.load(parsed, (err) => {
  if (err) return handleError(err)

  if (!cmd || !svcJs.cli[cmd]) {
    return svcJs.cli.help([], () => {})
  }

  svcJs
    .cli[cmd](parsed.argv.remain, (err) => {
      if (err) handleError(err)
    })
})
