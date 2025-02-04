import { createNew, timeout } from '../utils'
import mockServer from '../mock/server'
import { test } from '../suite'

/** Socket property check. */
test('sockets', timeout(1e4, () => new Promise<void>(async (ff, rj) => {
  const {port} = await mockServer()
  const ws = createNew({}, port)

  await ws.ready()

  if(ws.socket && !isNaN(ws.socket.readyState)) ff(); else rj()
})))