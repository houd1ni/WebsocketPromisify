
import {
  createNew,
  is
} from '../utils'


/** Lazy connect */
const lazy = async (t) => {
  return new Promise(async (ff, rj) => {
    const ws = await createNew({
      lazy: true
    })

    setTimeout(async () => {
      if(ws.socket !== null) {
        t.fail()
        ff()
      } else {
        const msg = {echo: true, msg: 'hello!'}
        const response = await ws.send(msg)
        is(t)(response, msg)
        ff()
      }
    }, 500)
  })
}



export default lazy