import './types'

export const native_ws = (() => {try {return WebSocket||null}catch { return null }})()

export const add_event = (o: wsc.Socket, e: string, handler: wsc.EventHandler) => {
  return o.addEventListener(e, handler)
}

export const sett = (
  a: number,
  b: { (): void; (...args: any[]): void; }
) => setTimeout(b, a)

export const try_splice = <T = any>(arr: T[], el: T) => {
  const i = arr.indexOf(el)
  if(~i) return arr.splice(arr.indexOf(el), 1)
  else return []
}