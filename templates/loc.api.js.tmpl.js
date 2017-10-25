'use strict'

const { Api } = require('bfx-wrk-api')
const _ = require('lodash')

class __CLASSNAME__ extends Api {
  space (service, msg) {
    const space = super.space(service, msg)
    return space
  }

  getHelloWorld (space, name, cb) {
    if (!_.isFunction(cb)) return cb(new Error('ERR_API_CB_INVALID'))

    const res = 'Hello ' + name

    cb(null, res)
  }
}

module.exports = __CLASSNAME__
