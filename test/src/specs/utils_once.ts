
import { once as onceTest } from '../../../src/utils'


/** Utils::once should cache a result and call a func just once. */
const once = async (t) => {
  return new Promise(async (ff, rj) => {
    const fn = (a) => a*2
    const cached = onceTest(fn)

    t.is(cached(5), cached(10))
    t.is(cached(25), 10)
    return ff()
  })
}



export default once