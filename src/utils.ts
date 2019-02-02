
import "./types"

const add_event = (o: wsc.Socket, e: string, handler: wsc.EventHandler) => {
  return o.addEventListener(e, handler)
}

const once = (fn: Function) => {
  let has_been_cached = false
  let cached = null
  return (...args: any) => {
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