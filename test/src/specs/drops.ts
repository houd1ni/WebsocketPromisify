
import {
  createNew,
  shutDown
} from '../utils'
import { setTimeout } from 'timers';

/** Rejects messages by timout */
const drops = async (t) => {

  return new Promise(async (ff, rj) => {
    const ws = await createNew({
      timeout: 500
    }, 40512)

    await shutDown(40512)

    setTimeout(async () => {
      const msg = {echo: true, msg: 'hello!'}
      try {
        setTimeout(() => {
          t.fail()
          return ff()
        }, 600)
        await ws.send(msg)
        t.fail()
        return ff()
      } catch(e) {
        t.pass()
        return ff()
      }
    }, 200)
  })
}



export default drops