# __SERVICENAME__

## Setup

Run two Grapes:

```
grape --dp 20001 --aph 30001 --bn '127.0.0.1:20002'
grape --dp 20002 --aph 40001 --bn '127.0.0.1:20001'
```

### Boot worker

```
node worker.js --env=development --wtype=__WORKERNAME__ --apiPort __PORT__
```

## Grenache API

### action: 'getHelloWorld'

  - `args`: &lt;Array&gt;
    - `0`: &lt;String&gt; Name to greet

**Response:**

  - &lt;String&gt; The Greeting

**Example Response:**

```js
'Hello Paolo'
```

Example: [example.js](example.js)
