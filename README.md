# WebsocketPromisify
Makes websocket's API just like REST with Promise-like API, with native Promises.

// If you detected some bug or so, please, fill an issue.


Makes a Promise-like WebSocket connection.
Features (almost all are tunable via constructor config below.)
- Async/await ready.
- ES-module and commonjs built-in.
- Types (d.ts) included.
- Automatically reconnects.
- Any id and data keys to negotiate with your back-end.
- Lazy connect: connects only if something sent, then send all of them!
- Supports middleware. E.g. you can use 'ws' package in Node!
- Custom easy .on method with or without condition: analog to .addEventListener.
- Can log messages/frames/response time into console or wherever you want to. (Hello, firefox 57+!)
- Any protocols field.
- Rejects if sent into closed socket or after some timeout without response.
- If something sent before connection is connection is estabilished, it sends when its ready.


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
    // Timeout after sending a message before it dropes with error.
    timeout: 1400,
    // Reconnect timeout in seconds or null.
    reconnect: 2,
    // Lazy connect: connects only if something sent (then sends all of them!)
    lazy: false,
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

Methods:
```javascript

  // sends any type of message.
  send(message),
  on(event_name, handler, predicate),
  close()

```

Example:
```javascript

  import * as WSP from 'wspromisify'  // Temporary. Will be regular esm.


  const somehost = 'example.com:8080'

  const someFunction = async () => {
    const ws = new WSP({
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
      const data = await ws.send({catSaid: 'Meow!'})
      console.log({data})
    } catch(error) {
      console.error('Cannot send a message due to ', error)
    }
  }

  someFunction()

```