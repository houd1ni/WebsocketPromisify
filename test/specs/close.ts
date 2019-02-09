import test from 'ava'
import {
  createNew,
  shutDown
} from '../utils'
import mockServer from '../mock'

/** Closes the connenction. */
test('close', (t) => {
  return new Promise(async (ff) => {
    await mockServer()
    const port = 40513
    const ws = await createNew({}, port)

    setTimeout(async () => {
      await ws.close()

      if(ws.socket === null) {
        await shutDown(port)
        t.pass()
      } else {
        await shutDown(port)
        t.fail()
      }
      return ff()
    }, 500)
  })
})