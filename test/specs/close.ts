import { test } from '../suite'
import { createNew } from '../utils.js'
import mockServer from '../mock/server'

/** Closes the connenction. */
test('close', () => new Promise<void>(async (ff, rj) => {
  const {port} = await mockServer()
  const ws = createNew({}, port)

  setTimeout(async () => {
    try {
      await ws.close()
      if(ws.socket === null) ff(); else rj()
    } catch(e) {
      rj()
    }
  }, 500)
}))