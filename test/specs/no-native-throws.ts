import mockServer from '../mock/server'
import { test } from '../suite'
import {WebSocketClient} from '../../src/WSC'

/** Ready method. */
test('No native throws without an adapter', async () => {
  const {port} = await mockServer()
  let pass = false
  try {
    new WebSocketClient({ url: 'ws://127.0.0.1:' + port })
    try {
      if(WebSocket) pass = true
    } catch {}
  } catch {
    pass=true
  }
  throw new Error('Does not throw.')
})