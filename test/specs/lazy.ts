import { createNew, timeout } from '../utils'
import mockServer from '../mock/server'
import { equals } from 'pepka'
import { test } from '../suite'

/** Lazy connect */
test('lazy', timeout(2e3, () => {
  return new Promise<void>(async (ff, rj) => {
    const {port} = await mockServer()
    const ws = createNew({ lazy: true }, port)

    setTimeout(async () => {
      if(ws.socket !== null) {
        rj()
      } else {
        const msg = {echo: true, msg: 'hello!'}
        const response = await ws.send(msg)
        if(equals(response, msg)) ff(); else rj()
      }
    }, 500)
  })
}))