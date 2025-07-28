import { createNew } from '../utils'
import mockServer from '../mock/server'

import WS from 'ws'
import { test } from '../suite'
import { equals } from 'pepka'


const addr = (port: number) => 'ws://localhost:' + port

/** If an existing socket connection is provided via config. */
test('existing_socket', () => new Promise(async (ff, rj) => {
  const {port} = await mockServer()
  const to = setTimeout(() => rj(), 4e4)
  const existing_addr = addr(port)

  const ws1 = await createNew({socket: new WS(existing_addr)}, port)

  const msg1 = {echo: true, msg: 'existing_socket!'}
  const response1 = await ws1.send(msg1)

  if(!equals(response1, msg1)) return rj('Bad echo.')
  await ws1.close()

  const ws2_0 = new WS(existing_addr)

  ws2_0.addEventListener('open', async () => {
    console.log('START')
    const ws2 = await createNew({socket: ws2_0}, port)
    console.log({ws1})

    if(ws2.socket?.readyState !== 1) return rj('Bad echo.')
  
    const msg2 = {echo: true, msg: 'existing_socket!'}
    const response2 = await ws2.send(msg2)

    if(
      ws2.socket?.readyState as number !== 1
      || !equals(response2, msg2)
    ) return rj('not ready.')
    await ws2.close()

    clearTimeout(to)
    ff()
  })
}))