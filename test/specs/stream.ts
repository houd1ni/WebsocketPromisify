import mockServer from '../mock/server'
import { test } from '../suite'
import { createNew, timeout } from '../utils'

/** Test real streaming functionality with multiple chunks. */
test('stream', timeout(1.5e4, () => new Promise<void>(async (ff, rj) => {
    const {port} = await mockServer()
    let to = setTimeout(() => {
      console.log('STREAM: Timeout - cannot create')
      rj('cannot create')
    }, 2e4)
    const ws = await createNew({}, port)
    clearTimeout(to)
    to = setTimeout(() => rj('cannot ready'), 2e4)
    await ws.ready()
    clearTimeout(to)
    const streamMsg = {stream: true, multi: true, name: 'stream'}
    to = setTimeout(() => rj('stream timeout'), 5e3)
    try {
      const stream = ws.stream<typeof streamMsg, any>(streamMsg)
      const chunks: any[] = []
      for await (const chunk of stream) chunks.push(chunk)
      clearTimeout(to)
      if(chunks.length !== 20)
        return rj(`Expected exactly 20 chunks, got ${chunks.length}`)
      for(let i = 0; i < 20; i++) {
        if(chunks[i].chunk !== i)
          return rj(`Chunk ${i} should be ${i}, got ${chunks[i].chunk}`)
      }
      ff()
    } catch (error) {
      clearTimeout(to)
      console.log('STREAM TEST FAILED:', error)
      rj('stream error: ' + error)
    }
  })
))