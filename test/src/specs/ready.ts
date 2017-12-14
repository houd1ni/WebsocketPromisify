
import {
  createNew
} from '../utils'


/** Ready method. */
const ready = async (t) => {

  const ws = await createNew({})

  await ws.ready()

  if(ws.socket) {
    t.pass()
  } else {
    t.fail()
  }
}



export default ready