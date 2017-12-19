
import {
  createNew
} from '../utils'


/** Closes the connenction. */
const close = async (t) => {
  return new Promise(async (ff, rj) => {
    const ws = await createNew({}, 40513)

    setTimeout(async () => {
      await ws.close()
      if(ws.socket === null) {
        t.pass()
      } else {
        t.fail()
      }
      return ff()
    }, 500)
  })
}



export default close