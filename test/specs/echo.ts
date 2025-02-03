import { equals } from 'pepka'
import { createNew, timeout } from '../utils'
import mockServer from '../mock/server'
import { test } from '../suite'

/** Proof of work. */
test('echo', timeout(5e3, () => new Promise<void>(async (ff, rj) => {
    const {port} = await mockServer()
    let to = setTimeout(() => rj('cannot create'), 2e2)
    const ws = await createNew({}, port)
    clearTimeout(to)

    to = setTimeout(() => rj('cannot ready'), 2e2)
    await ws.ready()
    clearTimeout(to)

    const msg = {echo: true, msg: 'hello!'}
    to = setTimeout(() => rj('cannot send'), 2e2)
    const response = await ws.send(msg)
    clearTimeout(to)

    if(equals(response, msg)) ff(); else rj('echo msg is not equal.')
  })
))