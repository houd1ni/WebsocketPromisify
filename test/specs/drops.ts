import { createNew } from '../utils'
import mockServer from '../mock/server'
import { test } from '../suite'
import { wait } from 'pepka'

/** Rejects messages by timout */
test('drops', () => new Promise(async (ff, rj) => {
  const {port, shutDown} = await mockServer()
  const ws = await createNew({timeout: 500}, port)

  await shutDown()
  await wait(200)

  const msg = {echo: true, msg: 'hello!'}
  let to: NodeJS.Timeout
  try {
    to = setTimeout(() => {
      return rj()
    }, 600)
    await ws.send(msg)
    if(to) clearTimeout(to)
    await mockServer(port)
    return rj()
  } catch(e) {
    if(to!) clearTimeout(to)
    await mockServer(port)
    return ff()
  }
}))