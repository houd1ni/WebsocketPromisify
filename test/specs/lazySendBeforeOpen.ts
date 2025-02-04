import { createNew } from '../utils.js'
import mockServer from '../mock/server'
import { equals } from 'pepka'
import { test } from '../suite'

/** Sends massages if they were .send() before connection is estabilished. */
test('lazy send before open queued.', () => new Promise(async (ff, rj) => {
  const {port} = await mockServer()
  let to = setTimeout(() => rj('cannot create'), 2e2)
  const ws = createNew({lazy: true}, port)
  clearTimeout(to)

  const msg = {echo: true, msg: 'hello!'}
  to = setTimeout(() => rj('cannot send'), 2e2)
  const response = await ws.send(msg)
  clearTimeout(to)

  if(equals(response, msg)) ff(); else rj()
}))