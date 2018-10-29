'use strict'

const { WrkApi } = require('bfx-wrk-api')

class __WORKERCLASSNAME__ extends WrkApi {
  constructor (conf, ctx) {
    super(conf, ctx)

    this.loadConf('__CONFIG1__', '__CONFIG_2__')

    this.init()
    this.start()
  }

  getPluginCtx (type) {
    const ctx = super.getPluginCtx(type)

    switch (type) {
      case 'api_bfx':
        // ctx.foo = 'bar'
        break
    }

    return ctx
  }

  init () {
    super.init()

    // contains all args passed to worker.js - also custom ones
    // console.log(this.ctx)
  }
}

module.exports = __WORKERCLASSNAME__
