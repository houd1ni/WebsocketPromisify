import test from 'ava'
import { createNew, shutDown } from '../utils.js'
import mockServer from '../mock/index.js'

/** Ready method. */
test.serial('ready', async (t) => {
  await mockServer()
  t.timeout(4e3)

  const ws = await createNew()
  await ws.ready()
  // t.fail('fuck!')

  await shutDown()
  return ws.socket ? t.pass() : t.fail()
})