'use strict'

const test = require('brittle')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawnSync } = require('child_process')

const root = path.join(__dirname, '..')
const runtimePackages = [ 'bfx-wrk-api', 'bfx-facs-api', 'bfx-facs-grc' ]

test('init installs the scoped service dependencies without rewriting the base package', async (t) => {
  const fixture = createService(t)
  t.is(fs.readFileSync(path.join(fixture.service, 'package.json'), 'utf8'),
    JSON.stringify(fixture.basePackage), 'base dependencies, scripts, and metadata are not rewritten')

  const installs = fs.readFileSync(fixture.installLog, 'utf8').trim().split('\n').map(JSON.parse)
  t.alike(installs.map(install => install.args), [
    [ 'i', '--save',
      'https://github.com/bitfinexcom/bfx-wrk-api.git',
      'https://github.com/bitfinexcom/bfx-facs-api.git',
      'https://github.com/bitfinexcom/bfx-facs-grc.git' ],
    [ 'i' ],
    [ 'i', '--save-dev', 'https://github.com/bitfinexcom/bfx-svc-test-helper', 'brittle@^3.19.1' ]
  ], 'the original installation sequence adds Brittle as a development dependency')
  t.alike(installs.map(install => install.package), [
    fixture.basePackage, fixture.basePackage, fixture.basePackage
  ], 'npm receives the original base manifest at every step')

  installRuntimeStub(fixture.service)
  const Worker = require(path.join(fixture.service, 'workers/api.hello.util.wrk.js'))
  const worker = new Worker({}, { root: fixture.service })
  t.alike(worker.calls, [
    [ 'loadConf', 'hello.util', 'util' ],
    [ 'init' ],
    [ 'start' ]
  ], 'generated worker loads scoped runtime and starts normally')

  const Api = require(path.join(fixture.service, 'workers/loc.api/hello.util.js'))
  const result = await new Promise((resolve, reject) => {
    new Api().getHelloWorld({}, { name: 'Ada' }, (err, value) => {
      if (err) return reject(err)
      resolve(value)
    })
  })
  t.is(result, 'Hello Ada', 'generated API loads scoped runtime and answers a request')
})

test('generated Brittle integration test cleans up after success and RPC failure', (t) => {
  const fixture = createService(t)
  installRuntimeStub(fixture.service)
  installHelperStubs(fixture.service)

  for (const fail of [ false, true ]) {
    const eventLog = path.join(fixture.directory, fail ? 'failure.log' : 'success.log')
    const result = spawnSync(process.execPath, [ 'test/integration.js' ], {
      cwd: fixture.service,
      env: Object.assign({}, process.env, {
        NODE_PATH: path.join(root, 'node_modules'),
        SVC_CLI_TEST_SERVICE: fixture.service,
        SVC_CLI_TEST_EVENTS: eventLog,
        SVC_CLI_TEST_FAIL_RPC: fail ? '1' : ''
      }),
      encoding: 'utf8',
      timeout: 10000
    })

    t.absent(result.error, 'generated test exits without hanging')
    if (fail) {
      t.is(result.status, 1, 'a rejected RPC fails the generated test')
    } else {
      t.is(result.status, 0, 'the generated test passes')
    }
    const events = fs.readFileSync(eventLog, 'utf8').trim().split('\n')
    t.alike(events, [
      'grapes.start',
      'worker.start',
      'client.request',
      'client.stop',
      'worker.stop',
      'grapes.stop'
    ], 'resources stop in order after ' + (fail ? 'failure' : 'success'))
  }
})

function createService (t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'svc-js-cli-test-'))
  t.teardown(() => fs.rmSync(directory, { recursive: true, force: true }), { force: true })

  const source = path.join(directory, 'base')
  const service = path.join(directory, 'bfx-util-hello-js')
  const installLog = path.join(directory, 'install.log')
  const dependencies = { lodash: '4.17.21' }
  const devDependencies = {
    mocha: '10.2.0',
    standard: '17.1.2',
    '@bitfinex/bfx-svc-test-helper': 'git+https://github.com/bitfinexcom/bfx-svc-test-helper.git'
  }
  runtimePackages.forEach(name => {
    dependencies['@bitfinex/' + name] = 'git+https://github.com/bitfinexcom/' + name + '.git'
  })

  const basePackage = {
    name: 'fixture-base',
    version: '1.0.0',
    private: true,
    engines: { node: '>=16' },
    customConfig: { keep: true },
    scripts: { test: 'mocha', lint: 'standard', custom: 'node custom.js' },
    dependencies,
    devDependencies
  }
  write(source, 'package.json', JSON.stringify(basePackage))
  write(source, 'config/common.json.example', '{"dir_log":"logs"}')
  write(source, 'config/facs/grc.config.json.example', '{"p0":{"grape":"http://127.0.0.1:30001","transport":"http"}}')

  run('git', [ 'init', source ])
  run('git', [ '-C', source, 'add', '.' ])
  run('git', [
    '-C', source,
    '-c', 'user.name=svc-js-cli test',
    '-c', 'user.email=svc-js-cli@example.invalid',
    '-c', 'commit.gpgsign=false',
    '-c', 'core.hooksPath=/dev/null',
    'commit', '-m', 'test base'
  ])

  const bin = path.join(directory, 'bin')
  write(bin, 'npm', `#!${process.execPath}
const fs = require('fs')
fs.appendFileSync(process.env.SVC_CLI_TEST_INSTALL_LOG, JSON.stringify({
  args: process.argv.slice(2),
  package: JSON.parse(fs.readFileSync('package.json', 'utf8'))
}) + '\\n')
`)
  fs.chmodSync(path.join(bin, 'npm'), 0o755)

  run(process.execPath, [
    path.join(root, 'bin/svc-js-cli.js'),
    'init', 'grenache-api-base', 'bfx-util-hello-js', '1337', source
  ], {
    cwd: directory,
    env: Object.assign({}, process.env, {
      PATH: bin + path.delimiter + process.env.PATH,
      SVC_CLI_TEST_INSTALL_LOG: installLog
    })
  })
  return { directory, service, installLog, basePackage }
}

function installRuntimeStub (service) {
  write(service, 'node_modules/@bitfinex/bfx-wrk-api/index.js', `
class WrkApi {
  constructor () { this.calls = [] }
  loadConf (name, group) { this.calls.push(['loadConf', name, group]) }
  init () { this.calls.push(['init']) }
  start () { this.calls.push(['start']) }
  getPluginCtx () { return {} }
}
module.exports = { WrkApi, Api: class Api {} }
`)
}

function installHelperStubs (service) {
  const helper = path.join(service, 'node_modules/@bitfinex/bfx-svc-test-helper')
  write(helper, 'record.js', `
const fs = require('fs')
module.exports = event => fs.appendFileSync(process.env.SVC_CLI_TEST_EVENTS, event + '\\n')
`)
  write(helper, 'grapes.js', `
const record = require('./record')
module.exports = () => ({
  async start () { record('grapes.start') },
  async stop () { record('grapes.stop') }
})
`)
  write(helper, 'worker.js', `
const record = require('./record')
module.exports = () => ({
  worker: null,
  async start () { this.worker = {}; record('worker.start') },
  async stop () { record('worker.stop') }
})
`)
  write(helper, 'client.js', `
const path = require('path')
const record = require('./record')
const Api = require(path.join(process.env.SVC_CLI_TEST_SERVICE, 'workers/loc.api/hello.util.js'))
module.exports = () => ({
  async request (query) {
    record('client.request')
    if (process.env.SVC_CLI_TEST_FAIL_RPC) throw new Error('simulated RPC failure')
    return new Promise((resolve, reject) => {
      new Api()[query.action]({}, ...query.args, (err, result) => {
        if (err) return reject(err)
        resolve(result)
      })
    })
  },
  async stop () { record('client.stop') }
})
`)
}

function write (directory, filename, content) {
  const target = path.join(directory, filename)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, content)
}

function run (command, args, opts = {}) {
  const result = spawnSync(command, args, Object.assign({
    encoding: 'utf8',
    timeout: 15000
  }, opts))
  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(command + ' failed:\n' + result.stdout + result.stderr)
  }
  return result
}
