import { createNew, timeout } from '../utils'
import mockServer from '../mock/server'
import { equals } from 'pepka'
import { test } from '../suite'

/** Reconnects if connection is broken. */
test('reconnect', timeout(1e4, () => new Promise<void>(async (ff, rj) => {
    const {port, shutDown} = await mockServer()
    const ws = await createNew({ reconnect: 1 }, port)

    setTimeout(async () => {
      await shutDown()
      setTimeout(async () => {
        await mockServer(port)
        setTimeout(async () => {
          const msg = {echo: true, msg: 'hello!'}
          const response = await ws.send(msg)
          if(equals(response, msg)) ff(); else rj('not equals.')
        }, 1500)
      }, 1100)
    }, 500)
  })
))