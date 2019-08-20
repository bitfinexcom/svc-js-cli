/* eslint-env mocha */

'use strict'

const assert = require('assert')
const path = require('path')

const createGrapes = require('bfx-svc-test-helper/grapes')
const createWorker = require('bfx-svc-test-helper/worker')
const createClient = require('bfx-svc-test-helper/client')

let grapes, worker, client
describe('RPC integration', () => {
  before(async function () {
    this.timeout(20000)

    grapes = createGrapes()
    await grapes.start()

    worker = createWorker({
      env: 'development',
      wtype: '__WORKERNAME__',
      apiPort: '__PORT__',
      serviceRoot: path.join(__dirname, '..')
    }, grapes)

    await worker.start()

    client = createClient(worker)
  })

  after(async function () {
    this.timeout(5000)

    await client.stop()
    await worker.stop()
    await grapes.stop()
  })

  it('hello world: retrieves hello world', (done) => {
    const query = {
      action: 'getHelloWorld',
      args: [ { name: 'Paolo' } ]
    }

    client.request(query, (err, res) => {
      if (err) throw err

      assert.strictEqual(res, 'Hello Paolo')
      done()
    })
  }).timeout(7000)
})
