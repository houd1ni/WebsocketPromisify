import { createNew, timeout } from '../utils'
import mockServer from '../mock/server'
import { equals, wait } from 'pepka'
import { test } from '../suite'

/** Lazy connect */
test('lazy', timeout(2e3, async () => {
  const {port} = await mockServer()
  const ws = createNew({ lazy: true }, port)

  await wait(500)
  if(ws.socket !== null) throw new Error('Socket is not open.')
  else {
    const msg = {echo: true, msg: 'hello!'}
    if(!equals(await ws.send(msg), msg)) throw new Error('msg\s not equal.')
  }
}))