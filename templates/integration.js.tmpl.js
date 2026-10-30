'use strict'

const test = require('brittle')
const path = require('path')

const createGrapes = require('@bitfinex/bfx-svc-test-helper/grapes')
const createWorker = require('@bitfinex/bfx-svc-test-helper/worker')
const createClient = require('@bitfinex/bfx-svc-test-helper/client')

test('RPC integration: hello world', { timeout: 30000 }, async (t) => {
  const grapes = createGrapes()
  let worker = null
  let client = null

  t.teardown(async () => {
    if (client) await client.stop()
    if (worker && worker.worker) await worker.stop()
    await grapes.stop()
  }, { force: true })

  await grapes.start()

  worker = createWorker({
    env: 'development',
    wtype: '__WORKERNAME__',
    apiPort: '__PORT__',
    serviceRoot: path.join(__dirname, '..')
  }, grapes)

  await worker.start()

  client = createClient(worker)

  const query = {
    action: 'getHelloWorld',
    args: [{ name: 'Paolo' }]
  }

  const res = await client.request(query, { timeout: 7000 })
  t.is(res, 'Hello Paolo')
})
