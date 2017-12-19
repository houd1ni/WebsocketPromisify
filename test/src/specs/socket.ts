
import {
  createNew
} from '../utils'


/** Socket property check. */
const sockets = async (t) => {

  const ws = await createNew({})

  await ws.ready()

  if(ws.socket && !isNaN(ws.socket.readyState)) {
    t.pass()
  } else {
    t.fail()
  }

  return null
}



export default sockets