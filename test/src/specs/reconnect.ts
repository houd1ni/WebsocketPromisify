
import {
  createNew,
  shutDown,
  turnOn,
  is
} from '../utils'
import { setTimeout } from 'timers';


/** Reconnects if connection is broken. */
const reconnect = async (t) => {
  const port = 40511

  return new Promise(async (ff, rj) => {
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
          is(t)(response, msg)
          ff()
        }, 1500)
      }, 1100)
    }, 500)
  })
}



export default reconnect