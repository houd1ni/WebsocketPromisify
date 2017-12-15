
import {
  createNew,
  is
} from '../utils'


/** Proof of work */
const echo = async (t) => {

  const ws = await createNew({})

  await ws.ready()

  const msg = {echo: true, msg: 'hello!'}
  const response = await ws.send(msg)

  return is(t)(response, msg)
}



export default echo