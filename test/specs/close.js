import test from 'ava'
import { createNew, shutDown } from '../utils.js'
import mockServer from '../mock/index.js'

/** Closes the connenction. */
test.serial('close', (t) => {
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