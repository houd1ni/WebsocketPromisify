import { createNew, timeout } from '../utils'
import mockServer from '../mock/server'
import { equals, wait } from 'pepka'
import { test } from '../suite'

/** Reconnects if connection is broken. */
test('reconnect', timeout(1e4, () => async () => {
  const {port, shutDown} = await mockServer()
  const ws = await createNew({ reconnect: 1 }, port)
  await wait(200)
  await shutDown()
  await wait(500)
  await mockServer(port)
  await wait(600)
  const msg = {echo: true, msg: 'hello!'}
  const response = await ws.send(msg)
  if(!equals(response, msg)) throw new Error('not equals.')
}))
/** Should send messages that were queued while being disconnected right after the reconnect. */
test('reconnect-queue', timeout(1e4, async () => {
  const {port, shutDown} = await mockServer()
  const ws = await createNew({ reconnect: 1, timeout: 5e3 }, port)
  await ws.ready()
  await shutDown()
  const msg1 = {echo: true, msg: 'hello!'}
  const msg2 = {echo: true, msg: 'hello 2!'}
  const msg3 = {echo: true, msg: 'hello 3!'}
  let ok = false
  const p = new Promise<void>((ff) => ws.send(msg1).then((res) => {
    if(!equals(res, msg1)) throw new Error('msg1 not equals.')
    else ws.send(msg2).then((res) => {
      if(!equals(res, msg2)) throw new Error('msg2 not equals.')
      else {ok=true}
      ff()
    })
  }))
  await mockServer(port)
  await p
  if(!ok) throw new Error('Not sent.')
  if(!equals(await ws.send(msg3), msg3)) throw new Error('not sent or msg3 not equals.')
}))