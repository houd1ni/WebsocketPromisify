import { createNew, timeout } from '../utils'
import mockServer from '../mock/server'
import { test } from '../suite'

/** Ready method. */
test('ready', timeout(4e3, async () => {
  const {port} = await mockServer()
  const ws = await createNew({}, port)

  await ws.ready()
  if(!ws.socket) throw new Error()
}))