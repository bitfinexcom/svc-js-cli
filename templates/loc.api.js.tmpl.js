'use strict'

const { Api } = require('bfx-wrk-api')

class __CLASSNAME__ extends Api {
  getHelloWorld (space, args, cb) {
    const name = args.name
    const res = 'Hello ' + name

    cb(null, res)
  }
}

module.exports = __CLASSNAME__
