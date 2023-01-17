import test from 'ava'
import { createNew, shutDown, turnOn } from '../utils.js'
import mockServer from '../mock/index.js'

/** Reconnects if connection is broken. */
test.serial('reconnect', (t) => {
  const port = 8116
  return new Promise(async (ff) => {
    await mockServer()
    const to = setTimeout(() => ff(t.fail()), 4e4)
    const ws = await createNew({
      reconnect: 1
    }, port)

    setTimeout(async () => {
      await shutDown(port)
      setTimeout(async () => {
        await turnOn(port)
        setTimeout(async () => {
          const msg = {echo: true, msg: 'hello!'}
          const response = await ws.send(msg)
          clearTimeout(to)
          ff(t.deepEqual(response, msg))
        }, 1500)
      }, 1100)
    }, 500)
  })
})