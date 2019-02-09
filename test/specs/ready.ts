import test from 'ava'
import {
  createNew,
  shutDown
} from '../utils'
import mockServer from '../mock'


/** Ready method. */
test('ready', async (t) => {
  await mockServer()
  t.timeout(4e3)

  const ws = await createNew()
  await ws.ready()
  // t.fail('fuck!')

  await shutDown()
  return ws.socket ? t.pass() : t.fail()
})