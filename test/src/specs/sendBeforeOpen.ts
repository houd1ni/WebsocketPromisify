
import {
  createNew,
  is
} from '../utils'


/** Sends massages if they were .send() before connection is estabilished. */
const sendBeforeOpen = async (t) => {
  return new Promise(async (ff, rj) => {
    const ws = await createNew({
      lazy: true
    })

    const msg = {echo: true, msg: 'hello!'}
    const response = await ws.send(msg)
    
    is(t)(response, msg)
    ff()
  })
}



export default sendBeforeOpen