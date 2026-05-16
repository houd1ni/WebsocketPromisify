# WebsocketPromisify
[![Scrutinizer build](https://scrutinizer-ci.com/g/houd1ni/WebsocketPromisify/badges/build.png?b=master)](https://scrutinizer-ci.com/g/houd1ni/WebsocketPromisify/build-status/master) [![Scrutinizer code quality](https://scrutinizer-ci.com/g/houd1ni/WebsocketPromisify/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/houd1ni/WebsocketPromisify/code-structure/master) [![codecov](https://codecov.io/gh/houd1ni/WebsocketPromisify/branch/master/graph/badge.svg)](https://codecov.io/gh/houd1ni/WebsocketPromisify) [![bundlejs](https://deno.bundlejs.com/badge?q=wspromisify@2.6.2&treeshake=[*])](https://deno.bundlejs.com/badge?q=wspromisify@2.6.2&treeshake=[*])  [![npm](https://badgen.net/npm/v/wspromisify)](https://www.npmjs.com/package/wspromisify)

A nice-looking this readme version: https://houd1ni.github.io/WebsocketPromisify/

Makes websocket's API just like REST with Promise-like API, with native Promises.
Has a lot of yummies and very lightweight (less than 3kb in gzip)!

```javascript
const responseData = await ws.send({catSaid: 'Meow!'})
```

// If you detected some bug, want some stuff to be added, feel free to open an issue!
Large data support (chunking), plugins and different server-side implementations are coming.
To see a Node.js server-side part example, please, take a look on test/mock in github repo.


Makes a Promise-like WebSocket connection.
Features (almost all are tunable via constructor config below.)
- Fully asynchronous with promises.
- ES-module and CommonJS versions.
- Types (d.ts) included.
- Automatically reconnects, resends, closes when idle, pings. All parametrized.
- Streams are supported. For example, you can stream your AI response.
- Data piping, routing (via .route()).
- Handy logging API.
- Supports existent native WebSocket or ws-like implementation (ws npm package) via `socket` property.
- And provide your own socket instance via socket config fabric prop.
- Any id and data keys to negotiate with your back-end.
- Any (serialiser)/Decoder(deserialiser).
- Lazy connect: connects only if something sent, then send all of them!
- Supports middleware-adapter. E.g. you can use 'ws' package.
- .on() method with or without condition: analog with .addEventListener.

for more, please, take a look at its' typescript types or ask in [discussions](https://github.com/houd1ni/WebsocketPromisify/discussions).

How it on Server Side ?
```
Let thisnk you use default (JSON) adapter with default (id, data) props. Then:
  1. Serialized JSON is sent by this lib = {id: 'generated_id', data: your data}
  2. Some Server processing...
  3. Serialized JSON is sent back by the Server = {id: 'the same generated_id', data: feedback data}
    3.1 if it was stream, it may respond with multiple (id, data) pairs, but in the last message it must add `done: true` prop: {id, data, done: true} to let the library know that it is the last one. 
```


Default constructor config is (all time units are in seconds):
```typescript
interface TimeFnParams { base: number, max: number, jitter: number }
interface Config {
  log: ((event, time, message): any) // only one place where time is in milliseconds.
  timer: false // add or not time deltas to the fn above.
  // Required if `socket` is not set. URL to connect without a protocol.
  // Can start with /, then current page host and port will be used.
  url: 'localhost',
  // Timeout after sending a message before it drops with error.
  timeout: 1.4
  reconnect: { // Reconnect timeout in seconds or false to disable.
    stop_after: number  // seconds before giving up.
    on_timeout: boolean // should it reconnect on message timeout ?
    on_break: boolean   // should it reconnect on the connection break ?
    time_fn: (params: TimeFnParams, attempt: number): number
    params: { base: number, max: number, jitter: number } // params for the function.
  }
  max_idle_time: Infinity // Time in seconds after the connection is closed if nothing was sent explicitly by send() or stream().
  lazy: false // Lazy connect: connects only if something sent.
  socket: null // Existing socket if you already have one to augment with wspromisify.
  adapter: ((host, protocols): new WebSocket(host, protocols)) // your own middleware here.
  // You can replace original serialisation to your own or even binary stuff. Eg MessagePack or CBOR.
  encode: (message_id, message_data, config): data
  decode: (raw_message): { message_id, message_data } // id_key and data_key could be taken from the config argument.
  protocols: [] // WebSocket constructor's protocol field.
  server: { // Unique id's and data keys to negotiate with back-end.
    id_key:   'id'
    data_key: 'data'
  }
  ping: { // Pings to avoid interruptions or false to disable.
    interval: number       // inter-ping interval. default: 55.
    timeout:  number       // when a server does not reply with its' `pong` in this time, close the connection. set to Infinity to disable. default: 30.
    out: string|Uint8Array // frame content for pinging the server. default: 'ping'
    in:  string|Uint8Array // frame content the server must send back. default: 'pong'
  }
}
```

Fields/Props:
```javascript

  // read-only, returns WebSocket (or so) instance to use with other stuff.
  socket
```

Methods:
```javascript
  ready() // Returns Promise that connection is open. Works even if it already opened.
  send(message) // sends any type of message and returns a Promise.
  // Streams as async generator, resolving in chunks.
  // The server must send the same id for chunks then add done: true in the last one.
  *stream(message)
  // .addEventListener with optional predicate that works after reconnections.
  on(event_name, handler, predicate?: ((WebSocketEvent) => boolean), raw?: boolean)
  off(event_name, handler, raw?: boolean) // `raw` is to attach it to the socket itself.
  addEventListener(event_name, handler, {predicate, raw})    // almost alias for .on()
  removeEventListener(event_name, handler, {predicate, raw}) // almost alias for .off()
  // Closes the connection and free up memory. Returns Promise that it has been done.
  close()
  // Routers or modifies frames before the library. Call next(data) to route it to the lib.
  route(handler: (data: T, next: Function) => any)
```

Example (more in `tests` dir in the repo):
```typescript

  import {WebSocketClient} from 'wspromisify' // or const WSP = require('wspromisify') in Node.

  const somehost = 'example.com:8080'
  type Protocol = Uint8Array // or string (in the native WebSocket by default).

  const ws = new WebSocketClient<Protocol>({
    // If url starts with /,
    // it results in ws(s if in https)://currentHost:currentPort/thisUrl
    url: 'ws://example.com/ws',
    timeout: 2e3, // 1400ms by default.
    timer: true, // false by default.
    // To log data trips. Events: open, close, send, reconnect, error.
    // If timer isn't enabled, the signature is log(event, message)
    log(event, time, message = '') {
      if(time !== null) {
        console.log(event, `in ${time}ms`, message)
      } else {
        console.log(event, message)
      }
    }
  })

  try {
    // You can wait for ready by calling await ws.ready() or send it right now:
    // the messages will be sent as soon as the connection is opened.
    const data = await ws.send({catSaid: 'Meow!'})
    console.log({data})
  } catch(error) {
    console.error('Cannot send a message due to ', error)
  }

```
