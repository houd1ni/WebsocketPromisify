import test from 'ava'
import { createNew, shutDown, turnOn } from '../utils.js'
import mockServer from '../mock/index.js'

import * as WS from 'ws'

/** If an existing socket connection is provided via config. */
test.serial('existing_socket', (t) => {
  const existing_port = 8095
  const existing_addr = 'ws://localhost:' + existing_port
  return new Promise(async (ff) => {
    await mockServer()
    const to = setTimeout(() => ff(t.fail()), 4e4)

    await turnOn(existing_port)

    // This one CANNOT connect as fast as we send to it,
    // So readyState is 0.
    const ws1 = await createNew({
      socket: new WS(existing_addr)
    })

    t.is(ws1.socket.readyState, 0)

    const msg1 = {echo: true, msg: 'existing_socket!'}
    const response1 = await ws1.send(msg1)

    t.is(ws1.socket.readyState, 1)
    t.deepEqual(response1, msg1)
    await ws1.close()

    // This one DO CAN connect as fast as we send to it,
    // So readyState should be 1.
    const ws2_0 = new WS(existing_addr)

    ws2_0.addEventListener('open', async () => {
      const ws2 = await createNew({
        socket: ws2_0
      })

      t.is(ws2.socket.readyState, 1)
    
      const msg2 = {echo: true, msg: 'existing_socket!'}
      const response2 = await ws2.send(msg2)
    
      t.is(ws2.socket.readyState, 1)
      t.deepEqual(response2, msg2)
      await ws2.close()

      clearTimeout(to)
      shutDown()
      ff()
    })
  })
})