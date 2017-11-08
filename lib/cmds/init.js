'use strict'

const { spawnSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const rimraf = require('rimraf')
const _ = require('lodash')

const svcJs = require('../svc-js.js')

const usage = [
  'Usage: svc-js-cli init grenache-api-base <service-name> <port> <svc-src>',
  '',
  'Example: svc-js-cli init grenache-api-base bfx-util-net-js 1337 ~/bitfinex/bfx-util-js'
].join('\n')

exports.cli = init
exports.cli.usage = usage
function init ([ stype, sname, sport, sroot ], cb) {
  if (!stype) {
    const err = new Error([
      'No service type given.',
      usage
    ].join('\n'))
    err.type = 'EUSAGE'
    return cb(err)
  }

  if (!sname) {
    const err = new Error([
      'No service name given.',
      usage
    ].join('\n'))
    err.type = 'EUSAGE'
    return cb(err)
  }

  if (!sport) {
    const err = new Error([
      'No service port given.',
      usage
    ].join('\n'))
    err.type = 'EUSAGE'
    return cb(err)
  }

  if (!sroot) {
    const err = new Error([
      'No service source given.',
      usage
    ].join('\n'))
    err.type = 'EUSAGE'
    return cb(err)
  }

  const conf = svcJs.config
  // for now we just have 1 type
  initBaseGrenacheService(stype, sname, sport, sroot, conf, (err, data) => {
    if (err) return cb(err)
  })
}

function initBaseGrenacheService (stype, sname, sport, sroot, conf, cb) {
  sport = +sport

  const {
    workername,
    configFileName,
    serviceLookupKey,
    serviceLocApiName,
    baseClassFileName,
    wrkClassName,
    serviceHome,
    servicename,
    configRootSource,
    configRootTarget,
    rootSource,
    rootTemplates
  } = getServiceNaming(sname, sroot)

  if (fs.existsSync(serviceHome)) {
    const err = new Error([
      `Directory ${serviceHome} already exists`
    ].join('\n'))
    err.type = 'EUSAGE'
    return cb(err)
  }

  svcJs.log.info('', `Copying repo base...`)
  svcJs.log.info('', `Target: ${serviceHome}`)

  if (new RegExp('^' + _.escapeRegExp(rootSource), 'i').test(serviceHome)) {
    const err = new Error([
      `Service can't be in a subdirectory of the service source / boilerplate`,
      'Use another target directory.'
    ].join('\n'))
    err.type = 'EUSAGE'
    return cb(err)
  }

  const copyCmd = [ '-R', rootSource, serviceHome ]
  spawnCmd('cp', copyCmd)
  svcJs.log.info('', `Done!`)

  rimraf.sync(path.join(serviceHome, 'node_modules'))

  spawnCmd('git', [ 'remote', 'add', 'upstream', conf.upstream ], { cwd: serviceHome })
  svcJs.log.info('', `Added ${conf.upstream} as upstream to git repo`)

  svcJs.log.info('', `Installing npm dependencies, this may take some time...`)
  spawnCmd('npm', [ 'i' ], { cwd: serviceHome })

  const grenacheDeps = [
    'https://github.com/bitfinexcom/bfx-wrk-api.git',
    'https://github.com/bitfinexcom/bfx-facs-api.git',
    'https://github.com/bitfinexcom/bfx-facs-grc.git'
  ]

  spawnCmd('npm', [ 'i', '--save' ].concat(grenacheDeps), { cwd: serviceHome })

  svcJs.log.info('', 'Creating README.md')
  const exampleReadmeFile = path.join(rootTemplates, 'README.md.tmpl.md')
  const exampleReadmeTxt = fs.readFileSync(exampleReadmeFile, 'utf8')
  const exampleReadmeSubst = exampleReadmeTxt
    .replace(/__WORKERNAME__/ig, workername)
    .replace(/__SERVICENAME__/ig, servicename)
    .replace(/__PORT__/ig, sport)

  fs.writeFileSync(path.join(serviceHome, 'README.md'), exampleReadmeSubst, 'utf8')

  svcJs.log.info('', 'Creating basic config files...')
  const common = fs.readFileSync(path.join(configRootSource, 'common.json.example'), 'utf8')
  fs.writeFileSync(path.join(configRootTarget, 'common.json'), common, 'utf8')

  const gExampleFile = path.join(configRootSource, 'facs', 'grc.config.json.example')
  const grc = fs.readFileSync(gExampleFile, 'utf8')
  fs.writeFileSync(path.join(configRootTarget, 'facs', 'grc.config.json'), grc, 'utf8')

  const sConfig = JSON.stringify({}, null, '  ')
  fs.writeFileSync(path.join(configRootTarget, configFileName), sConfig, 'utf8')

  const exampleJsFile = path.join(rootTemplates, 'example.js.tmpl.js')
  const exampleJsTxt = fs.readFileSync(exampleJsFile, 'utf8')
  const exampleJsSubst = exampleJsTxt.replace(/__SERVICE__/ig, serviceLookupKey)
  fs.writeFileSync(path.join(serviceHome, 'example.js'), exampleJsSubst, 'utf8')

  fs.mkdirSync(path.join(serviceHome, 'workers'))
  fs.mkdirSync(path.join(serviceHome, 'workers', 'loc.api'))

  const exampleLocApiFile = path.join(rootTemplates, 'loc.api.js.tmpl.js')
  const exampleLocApiTxt = fs.readFileSync(exampleLocApiFile, 'utf8')
  const exampleLocApiSubst = exampleLocApiTxt.replace(/__CLASSNAME__/ig, serviceLocApiName)
  const exampleLocFileLoc = path.join(serviceHome, 'workers', 'loc.api', baseClassFileName)
  fs.writeFileSync(exampleLocFileLoc, exampleLocApiSubst, 'utf8')

  const exampleApiWrkFile = path.join(rootTemplates, 'api.wrk.js.tmpl.js')
  const exampleApiWrkTxt = fs.readFileSync(exampleApiWrkFile, 'utf8')
  const exampleApiWrkSubst = exampleApiWrkTxt
    .replace(/__WORKERCLASSNAME__/ig, wrkClassName)
    .replace(/__CONFIG1__/ig, configFileName.replace('.json', ''))
    .replace(/__CONFIG_2__/ig, configFileName.split('.')[0])
    .replace(/__API_PATH__/ig, baseClassFileName.replace('.js', ''))
    .replace(/__SERVICE__/ig, serviceLookupKey)

  const apiWrkFilename = 'api.' + baseClassFileName.replace(/\.js$/, '.wrk.js')
  const exampleApiWrkLoc = path.join(serviceHome, 'workers', apiWrkFilename)
  fs.writeFileSync(exampleApiWrkLoc, exampleApiWrkSubst, 'utf8')

  printFinalText(workername, sport, serviceHome)
  cb(null)
}

function getServiceNaming (serviceArg, sroot) {
  const serviceHome = path.resolve(serviceArg)
  const servicename = path.basename(serviceArg)
  const rootSource = path.resolve(sroot)

  const workername = servicename
    .replace(/^bfx-/, 'wrk-')
    .replace(/-js$/, '-api')

  const configFileName = servicename
    .replace(/^bfx-/, '')
    .replace(/-js$/, '.json')
    .replace(/-/, '.')

  const serviceLookupKey = servicename
    .replace(/^bfx-/, 'rest:')
    .replace(/-js$/, '')
    .replace(/-/, ':')

  const serviceLocApiName = _.camelCase(
    servicename.replace(/-js$/, '')
  ).replace(/^bfx/, '')

  const baseNamesTmp = servicename
    .replace(/^bfx-/, '')
    .replace(/-js$/, '-api')
    .split('-')

  const baseClassFileName = baseNamesTmp[1] + '.' + baseNamesTmp[0] + '.js'

  const wrkClassName = 'Wrk' + serviceLocApiName + 'Api'

  const configRootSource = path.join(rootSource, 'config')
  const configRootTarget = path.join(serviceHome, 'config')

  const rootTemplates = path.join(__dirname, '..', '..', 'templates')

  svcJs.log.info('', 'servicename:', servicename)
  svcJs.log.info('', 'serviceHome:', serviceHome)
  svcJs.log.info('', 'Setting service up with:')
  svcJs.log.info('', 'workername:', workername)
  svcJs.log.info('', 'rootSource:', rootSource)
  svcJs.log.info('', 'rootTemplates:', rootTemplates)

  svcJs.log.info('', 'configRootSource:', configRootSource)
  svcJs.log.info('', 'configRootTarget:', configRootTarget)
  svcJs.log.info('', 'configFileName:', configFileName)
  svcJs.log.info('', 'serviceLookupKey:', serviceLookupKey)
  svcJs.log.info('', 'serviceLocApiName:', serviceLocApiName)
  svcJs.log.info('', 'baseClassFileName:', baseClassFileName)

  svcJs.log.info('')

  return {
    workername,
    configFileName,
    serviceLookupKey,
    serviceLocApiName,
    baseClassFileName,
    wrkClassName,
    serviceHome,
    servicename,
    configRootSource,
    configRootTarget,
    rootSource,
    rootTemplates
  }
}

function spawnCmd (cmd, args, opts = { 'encoding': 'utf8' }) {
  if (!opts.encoding) opts.encoding = 'utf8'

  const out = spawnSync(cmd, args, opts)

  if (out.stderr) {
    console.error(out.stderr)
  }

  if (out.stdout) {
    console.log(out.stdout)
  }
}

function printFinalText (workername, sport, serviceHome) {
  svcJs.log.info('', 'All done!')

  console.log(`
                 .ggggnnvnvnv3
              _ggnnvnvvnvvvnv"JX[
           ggnvvnvvnvvnvnvn"jXSS[
         gvnvvnvnvnvvnvv}' xSSSS
       _xvnvvnvvvnvvnv"' gXSSSSr
       nvnvvnvnvnvv"'  qJSXSSSSf
      jnvvvnvvv}^\`   gXX2SSSSSr
      jnvr"""     guSXXXSXSSSr
              jgJXXXSSXSSSSS"
        _gggZXXXSSSSSSSSSS"
        ""#XXXSSSSSSSS}"'
            7""""""^

     ~~ in crypto we trust ~~
`)

  console.log('All set up!')
  console.log('')

  console.log(`To test the new service, start two grapes:

grape --dp 20001 --aph 30001 --bn '127.0.0.1:20002'
grape --dp 20002 --aph 40001 --bn '127.0.0.1:20001'

Run your worker:

cd ${serviceHome}
node worker.js --env=development --wtype=${workername} --apiPort ${sport}

and run the example.js in ${serviceHome}:

cd ${serviceHome}
node example.js
`)
}
