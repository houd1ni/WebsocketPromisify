import './types'

export const add_event = (o: wsc.Socket, e: string, handler: wsc.EventHandler) => {
  return o.addEventListener(e, handler)
}

export const sett = (
  a: number,
  b: { (): void; (...args: any[]): void; }
) => setTimeout(b, a)