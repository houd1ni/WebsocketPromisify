import test from 'ava'
import {
  createNew,
  shutDown
} from '../utils'
import mockServer from '../mock'

/** Proof of work */
test('echo', (t) => {
  t.timeout(5000)
  return new Promise(async (ff, rj) => {
    await mockServer()
    let to = setTimeout(() => rj(t.fail('cannot create')), 2e2)
    const ws = await createNew()
    clearTimeout(to)
  
    to = setTimeout(() => rj(t.fail('cannot ready')), 2e2)
    await ws.ready()
    clearTimeout(to)
  
    const msg = {echo: true, msg: 'hello!'}
    to = setTimeout(() => rj(t.fail('cannot send')), 2e2)
    const response = await ws.send(msg)
    clearTimeout(to)

    await shutDown()
    ff(t.deepEqual(response, msg))
  })
})