import { equals } from 'pepka'
import { createNew, timeout } from '../utils'
import mockServer from '../mock/server'
import { test } from '../suite'

/** Simple test for stream method basic functionality. */
test('stream-basic', timeout(5e3, () => new Promise<void>(async (ff, rj) => {
    const {port} = await mockServer()
    let to = setTimeout(() => rj('cannot create'), 2e2)
    const ws = await createNew({}, port)
    clearTimeout(to)

    to = setTimeout(() => rj('cannot ready'), 2e2)
    await ws.ready()
    clearTimeout(to)

    const msg = {stream: true, test: 'stream'}
    to = setTimeout(() => rj('stream timeout'), 2e2)

    try {
      const stream = ws.stream(msg)

      // Test that stream is an AsyncGenerator
      if (typeof stream[Symbol.asyncIterator] !== 'function') {
        clearTimeout(to)
        return rj('stream is not an AsyncGenerator')
      }

      // Test that we can iterate over it
      const iterator = stream[Symbol.asyncIterator]()
      const firstResult = await iterator.next()

      clearTimeout(to)

      // For streaming messages, check that we got a valid chunk with the expected properties
      if (!firstResult.done && firstResult.value && firstResult.value.test === msg.test) {
        ff()
      } else {
        rj(`stream did not return expected value. Got: ${JSON.stringify(firstResult.value)}, Expected test: ${msg.test}`)
      }
    } catch (error) {
      clearTimeout(to)
      rj('stream error: ' + error)
    }
  })
))