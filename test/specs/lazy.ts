import test from 'ava'
import {
  createNew, shutDown
} from '../utils'
import mockServer from '../mock'



/** Lazy connect */
test('lazy', (t) => {
  t.timeout(2000)
  return new Promise(async (ff) => {
    await mockServer()
    const ws = await createNew({
      lazy: true
    }, 8103)

    setTimeout(async () => {
      if(ws.socket !== null) {
        shutDown()
        ff(t.fail())
      } else {
        const msg = {echo: true, msg: 'hello!'}
        const response = await ws.send(msg)
        shutDown()
        ff(t.deepEqual(response, msg))
      }
    }, 500)
  })
})