# WebsocketPromisify

[![Build Status](https://circleci.com/gh/houd1ni/WebsocketPromisify/tree/master.svg?style=shield)](https://circleci.com/gh/houd1ni/WebsocketPromisify/tree/master) 

a nice this readme version: https://houd1ni.github.io/WebsocketPromisify/

Makes websocket's API just like REST with Promise-like API, with native Promises.
Has a lot of yummies and very lightweight (less than 5kb in gzip)!

// If you detected some bug, want some stuff to be added, feel free to open an issue!
Large data support (chunking), plugins, streams and different server-side implementations are coming.
To see a Node.js server-side part example, please, take a look on test/mock in github repo.


Makes a Promise-like WebSocket connection.
Features (almost all are tunable via constructor config below.)
- Async/await ready.
- ES-module and commonjs built-in.
- Types (d.ts) included.
- Automatically reconnects.
- You can use the WebSocket (or your ws-like implementation) further in other stuff (socket property).
- And provide your own socket instance via socket config prop.
- Any id and data keys to negotiate with your back-end.
- Lazy connect: connects only if something sent, then send all of them!
- Supports middleware-adapter. E.g. you can use 'ws' package in Node!
- Custom easy .on method with or without condition: analog to .addEventListener.
- Can log messages/frames/response time into console or wherever you want to. (Hello, firefox 57+!)
- Any protocols field.
- Rejects if sent into closed socket or after some timeout without response.
- If something sent before connection is estabilished, it sends when it's ready.

How it on Server Side ?
```
  1. Serialized JSON is sent by this lib = {id: 'generated_id', data: your data}
  2. Some Server processing...
  3. Serialized JSON is sent back by the Server = {id: 'the same generated_id', data: feedback data}
```


Default constructor config is
```javascript
{
  // You can also use plain text and blobs in future.
  data_type: 'json',
  // Debug features. Not required.
    log: ((event, time, message) => null),
    // Will count milliseconds for responses and put them to log function above.
    timer: false,
  // Set up.
    // Required. URL to connect.
    url: 'localhost',
    // Timeout after sending a message before it drops with error.
    timeout: 1400,
    // Reconnect timeout in seconds or null.
    reconnect: 2,
    // Lazy connect: connects only if something sent (then sends all of them!)
    lazy: false,
    // Existing socket if you already have one to augment with this force.
    socket: null,
    // You can set your own middleware here.
    adapter: ((host, protocols) => new WebSocket(host, protocols)),
    // WebSocket constructor's protocol field.
    protocols: [],
    // Unique id's and data keys to negotiate with back-end.
    server: {
      id_key: 'id',
      data_key: 'data'
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

  // Returns Promise that connection is open. Works even if it already opened.
  ready()
  // sends any type of message and returns a Promise.
  send(message),
  // .addEventListener with optional predicate.
  on(event_name, handler, predicate = (WebSocketEvent) => true),
  // Closes the connection and free up memory. Returns Promise that it has been done.
  close()

```

Example:
```javascript

  import WSP from 'wspromisify'


  const somehost = 'example.com:8080'

  const someFunction = async () => {
    const ws = new WSP({
      // Just a random config. log() is ok.
      url: `${somehost}/ws`,
      timeout: 2e3,
      timer: true,
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
  }

  someFunction()

```