# WebsocketPromisify
Makes websocket's API just like REST with Promise-like API, with native Promises.


Makes a Promise-like WebSocket connection.
If something sent before connection is es


Default constructor config is
```{
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
    // You can set your own middleware here.
    adapter: ((host, protocols) => new WebSocket(host, protocols)),
    // WebSocket constructor's protocol field.
    protocols: [],
    // Unique id's and data keys to negotiate with back-end.
    server: {
      id_key: 'id',
      data_key: 'data'
    }
}```

Methods: ```

  send(message),
  close()

```

Example: ```

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