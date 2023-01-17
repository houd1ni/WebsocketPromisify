import test from 'ava'
import mockServer from '../mock/index.js'
import { once as onceTest } from '../../src/utils'

/** Utils::once should cache a result and call a func just once. */
test.serial('once', (t) => {
  return new Promise(async (ff) => {
    await mockServer()
    const fn = (a) => a*2
    const cached = onceTest(fn)

    t.is(cached(5), cached(10))
    t.is(cached(25), 10)
    return ff()
  })
})