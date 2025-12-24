import { equals } from 'pepka'
import { createNew, timeout } from '../utils'
import mockServer from '../mock/server'
import { test } from '../suite'

/** Comprehensive test for stream method. */
test('stream-comprehensive', timeout(1e4, () => new Promise<void>(async (ff, rj) => {

    const {port} = await mockServer()
    let to = setTimeout(() => rj('cannot create'), 2e2)
    const ws = await createNew({}, port)
    clearTimeout(to)

    to = setTimeout(() => rj('cannot ready'), 2e2)
    await ws.ready()
    clearTimeout(to)

    // Test 1: Basic stream functionality
    const msg1 = {stream: true, test: 'stream1', chunks: [1], delay: 10}
    to = setTimeout(() => rj('stream1 timeout'), 2e2)

    try {
      const stream1 = ws.stream(msg1)
      const result1 = await stream1.next()

      // Check that we got a valid response with the expected test property
      if (result1.done || !result1.value?.test || result1.value.test !== msg1.test) {
        clearTimeout(to)
        return rj('stream1 failed')
      }

      clearTimeout(to)

      // Test 2: Stream with for-await loop
      const msg2 = {stream: true, test: 'stream2'}
      to = setTimeout(() => rj('stream2 timeout'), 2e2)

      const stream2 = ws.stream<typeof msg2, any>(msg2)
      const results: any[] = []

      for await (const chunk of stream2) {
        results.push(chunk)
        break // We expect only one chunk
      }

      clearTimeout(to)

      // For streaming messages, check that we got a valid chunk with the expected properties
      if (results.length !== 1 || !results[0].test || results[0].test !== msg2.test) {
        return rj('stream2 failed')
      }

      // Test 3: Multiple concurrent streams
      const msg3a = {stream: true, test: 'stream3a'}
      const msg3b = {stream: true, test: 'stream3b'}
      to = setTimeout(() => rj('stream3 timeout'), 2e2)

      const stream3a = ws.stream(msg3a)
      const stream3b = ws.stream(msg3b)

      const result3a = await stream3a.next()
      const result3b = await stream3b.next()

      clearTimeout(to)

      // For streaming messages, check that we got valid chunks with the expected properties
      if (result3a.done || result3b.done ||
          !result3a.value?.test || result3a.value.test !== msg3a.test ||
          !result3b.value?.test || result3b.value.test !== msg3b.test) {
        return rj('stream3 failed')
      }

      ff()
    } catch (error) {
      clearTimeout(to)
      console.log('STREAM-COMPREHENSIVE TEST FAILED:', error)
      rj('stream comprehensive error: ' + error)
    }
  })
))