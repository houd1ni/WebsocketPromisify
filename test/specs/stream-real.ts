import { equals } from 'pepka'
import { createNew, timeout } from '../utils'
import mockServer from '../mock/server'
import { test } from '../suite'

/** Test real streaming functionality with multiple chunks. */
test('stream-real', timeout(1.5e4, () => new Promise<void>(async (ff, rj) => {

    const {port} = await mockServer()
    let to = setTimeout(() => {
      console.log('STREAM-REAL: Timeout - cannot create')
      rj('cannot create')
    }, 2e2)
    const ws = await createNew({}, port)
    clearTimeout(to)

    to = setTimeout(() => rj('cannot ready'), 2e2)
    await ws.ready()
    clearTimeout(to)

    // Test real streaming with multiple chunks
    const streamMsg = {stream: true, multi: true, test: 'real-stream', chunks: [1, 2, 3], delay: 50}
    to = setTimeout(() => rj('stream timeout'), 5e3)

    try {
      const stream = ws.stream<typeof streamMsg, any>(streamMsg)
      const chunks: any[] = []

      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      clearTimeout(to)

      // Verify we got all chunks
      if (chunks.length !== 3) {
        return rj(`Expected 3 chunks, got ${chunks.length}`)
      }

      // Verify chunks are in order and have correct data
      for (let i = 0; i < 3; i++) {
        if (chunks[i].chunk !== i + 1) {
          return rj(`Chunk ${i} should be ${i + 1}, got ${chunks[i].chunk}`)
        }
      }

      // Verify last chunk has done flag
      if (!chunks[2].done) {
        return rj('Last chunk should have done flag')
      }
      ff()
    } catch (error) {
      clearTimeout(to)
      console.log('STREAM-REAL TEST FAILED:', error)
      rj('stream real error: ' + error)
    }
  })
))