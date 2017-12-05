'use strict'

const { Api } = require('bfx-wrk-api')
const _ = require('lodash')

class __CLASSNAME__ extends Api {
  space (service, msg) {
    const space = super.space(service, msg)
    return space
  }

  getHelloWorld (space, name, cb) {
    const res = 'Hello ' + name

    cb(null, res)
  }
}

module.exports = __CLASSNAME__
