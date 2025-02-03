
import WSP from '../src/WS'
import {AnyFunc, AnyObject} from 'pepka'
import WS from 'ws'


export const createNew = async (config = {}, port: number) => new WSP(Object.assign({
    url: 'ws://127.0.0.1:' + port,
    // log: (...a) => console.log(...a),
    adapter: (host, protocols) => new WS(host, protocols)
  }, config)
)

// Inspired by tinchoz49 https://github.com/lukeed/uvu/issues/33#issuecomment-879870292
export const timeout = (time: number, handler: AnyFunc) => async (context: AnyObject) => {
  let timer: NodeJS.Timeout
  try {
    return await Promise.race([
      handler(context),
      new Promise((_resolve, reject) =>
        timer = setTimeout(() => reject(new Error('timeout')), time)
      )
    ])
  } finally {
    if(timer!) clearTimeout(timer)
  }
}