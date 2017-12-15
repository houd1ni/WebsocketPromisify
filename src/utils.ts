
import * as types from '../types'


const add_event = (o: types.Socket, e: string, handler: types.EventHandler) => {
  return o.addEventListener(e, handler)
}

const once = (fn) => {
  let has_been_cached = false
  let cached = null
  return (...args) => {
    if(has_been_cached) {
      return cached
    } else {
      has_been_cached = true
      return cached = fn(...args)
    }
  }
}


export {
  add_event,
  once,
}