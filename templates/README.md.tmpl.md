# __SERVICENAME__

## Setup

Run two Grapes:

```
grape --dp 20001 --aph 30001 --bn '127.0.0.1:20002'
grape --dp 20002 --aph 40001 --bn '127.0.0.1:20001'
```

```
# Add base as upstream:
git remote add upstream __UPSTREAM__

# Configure service:
bash setup-config.sh
```


### Boot worker

```
node worker.js --env=development --wtype=__WORKERNAME__ --apiPort __PORT__
```

### Integration test

Stop any manually started workers and Grapes before testing with:

```
npx brittle test/integration.js
```

The Brittle test starts its own two Grapes and worker, checks the greeting,
and stops them afterward.

## Grenache API

### action: 'getHelloWorld'

  - `args <Array>`
    - `0 <Object>`
      - `name <String>` Name to greet


**Response:**

  - `<String>` The Greeting

**Example Payload:**

```js
args: [ { name: 'Paolo' } ]
```

**Example Response:**

```js
'Hello Paolo'
```

Example: [example.js](example.js)
