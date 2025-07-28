
import WebSocketClient from '../src/WSC'
import {AnyFunc, AnyObject} from 'pepka'
import { native_ws } from '../src/utils'
import WS from 'ws'

export const createNew = (config = {} as wsc.UserConfig, port: number) => new Promise<WebSocketClient>((ff, rj) => {
  const ws = new WebSocketClient(Object.assign({
    url: 'ws://127.0.0.1:' + port,
    // log: (...a: any[]) => console.log(...a),
    adapter: (host: string, protocols?: string|string[]) => new (native_ws || WS)(host, protocols)
  }, config))
  if(ws.socket?.readyState===1 || config.lazy) return ff(ws)
  ws.on('error', rj)
  ws.on('open', () => {console.log('OPEN!'); ff(ws)})
})

// Inspired by tinchoz49 https://github.com/lukeed/uvu/issues/33#issuecomment-879870292
export const timeout = (time: number, handler: AnyFunc) => async (context: AnyObject) => {
  let timer: NodeJS.Timeout
  try {
    await Promise.race([
      handler(context),
      new Promise((_resolve, reject) =>
        timer = setTimeout(() => reject(new Error('timeout')), time)
      )
    ])
  } catch(e) {
    throw e
  } finally {
    if(timer!) clearTimeout(timer)
  }
}