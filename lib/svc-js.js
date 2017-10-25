'use strict'

const fs = require('fs')
const path = require('path')

const log = require('npmlog')
const commandsDir = path.join(__dirname, 'cmds')

const svcJs = {
  config: null
}

module.exports = (exports = svcJs)

let cliFuncs = {}

Object.defineProperty(svcJs, 'cli', {
  get: () => {
    if (!svcJs.config) {
      throw new Error('run svcJs.load before')
    }
    return cliFuncs
  }
})

exports.load = load
function load (opts, cb) {
  fs.readdir(commandsDir, (err, res) => {
    if (err) return err
    const c = populateCommands(cliFuncs, res)
    cliFuncs = Object.assign({}, cliFuncs, c.cliFuncs)

    const defaults = {
      base: 'https://github.com/bitfinexcom/bfx-svc-js'
    }

    svcJs.config = Object.assign({}, defaults, opts)
    svcJs.log = log

    cb(null, svcJs)
  })
}

exports.populateCommands = populateCommands
function populateCommands (cliFuncs, list) {
  const cli = {}

  list.filter((file) => {
    return /\.js$/.test(file)
  }).forEach((file) => {
    const cmdName = path.basename(file, '.js')
    const cmd = require(path.join(commandsDir, file))

    cli[cmdName] = cmd.cli
  })

  return {
    cliFuncs: cli
  }
}
