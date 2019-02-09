import test from 'ava'
import {
  createNew,
  shutDown
} from '../utils'
import mockServer from '../mock'

/** Rejects messages by timout */
test('drops', (t) => {
  return new Promise(async (ff) => {
    await mockServer()
    const ws = await createNew({
      timeout: 500
    }, 8110)

    await shutDown(8110)

    setTimeout(async () => {
      const msg = {echo: true, msg: 'hello!'}
      try {
        setTimeout(() => {
          return ff(t.fail())
        }, 600)
        await ws.send(msg)
        return ff(t.fail())
      } catch(e) {
        t.pass()
        return ff()
      }
    }, 200)
  })
})