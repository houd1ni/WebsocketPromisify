
import {
  createNew,
  is
} from '../utils'

import * as WS from 'ws'


/** If an existing socket connection is provided via config. */
const existing_socket = async (t) => {
  let done = false
  const existing_addr = 'ws://localhost:40510'
  return new Promise(async (ff, rj) => {

    setTimeout(() => {
      if(!done) {
        ff(t.fail())
      }
    }, 3e3)

    // This one CANNOT connect as fast as we send to it,
    // So readyState is 0.
    const ws1 = await createNew({
      socket: new (WS as any)(existing_addr)
    })

    is(t)(ws1.socket.readyState, 0)

    const msg1 = {echo: true, msg: 'existing_socket!'}
    const response1 = await ws1.send(msg1)

    is(t)(ws1.socket.readyState, 1)
    is(t)(response1, msg1)
    await ws1.close()


    // This one DO CAN connect as fast as we send to it,
    // So readyState should be 1.
    const ws2_0 = new (WS as any)(existing_addr)

    ws2_0.addEventListener('open', async () => {
      const ws2 = await createNew({
        socket: ws2_0
      })

      is(t)(ws2.socket.readyState, 1)
    
      const msg2 = {echo: true, msg: 'existing_socket!'}
      const response2 = await ws2.send(msg2)
    
      is(t)(ws2.socket.readyState, 1)
      is(t)(response2, msg2)
      await ws2.close()

      ff()
      done = true
    })
  })
}



export default existing_socket