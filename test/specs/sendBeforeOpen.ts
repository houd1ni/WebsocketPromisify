import test from 'ava'
import {
  createNew,
  shutDown
} from '../utils'
import mockServer from '../mock'

/** Sends massages if they were .send() before connection is estabilished. */
test('sendBeforeOpen', (t) => {
  return new Promise(async (ff, rj) => {
    await mockServer()
    let to = setTimeout(() => rj(t.fail('cannot create')), 2e2)
    const ws = await createNew({
      lazy: true
    }, 8101)
    clearTimeout(to)

    const msg = {echo: true, msg: 'hello!'}
    to = setTimeout(() => rj(t.fail('cannot send')), 2e2)
    const response = await ws.send(msg)
    clearTimeout(to)

    await shutDown()
    ff(t.deepEqual(response, msg))
  })
})