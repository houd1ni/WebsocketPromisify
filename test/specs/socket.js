import test from 'ava'
import { createNew, shutDown } from '../utils.js'
import mockServer from '../mock/index.js'

/** Socket property check. */
test.serial('sockets', (t) => {
  return new Promise(async ff => {
    await mockServer()
    const to = setTimeout(() => ff(t.fail()), 4e4)
    const ws = await createNew()

    await ws.ready()

    clearTimeout(to)
    shutDown()
    if(ws.socket && !isNaN(ws.socket.readyState)) {
      ff(t.pass())
    } else {
      ff(t.fail())
    }
  })
})