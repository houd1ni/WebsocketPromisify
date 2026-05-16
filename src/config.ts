import { qmergeDeep } from 'pepka'
import './types'
import { native_ws } from './utils'
const { min, random } = Math

const default_config = (): wsc.Config => ({
  // Debug features.
  log: (() => null),
  timer: false,
  // Set up.
  url: '',
  timeout: 1.4,
  reconnect: {
    stop_after: 45,
    on_timeout: true,
    on_break: true,
    time_fn: ({base, max, jitter}: wsc.TimeFnParams, attempt: number) =>
      min(max, base**(attempt+random()*jitter)),
    params: { base: 2, max: 20, jitter: .1 }
  },
  max_idle_time: Infinity,
  lazy: false,
  socket: null,
  adapter: ((host: string, protocols?: string[]) => new WebSocket(host, protocols)),
  encode: (key, data, { server }) => JSON.stringify({
    [server.id_key]: key,
    [server.data_key]: data
  }),
  decode: (rawMessage) => JSON.parse(rawMessage),
  protocols: [], pipes: [],
  server: { id_key: 'id', data_key: 'data' },
  ping: { interval: 55, timeout: 30, out: 'ping', in: 'pong' }
})

export const processConfig = (config: wsc.UserConfig) => {
  if(native_ws===null && !('adapter' in config)) throw new Error(`
    This platform has no native WebSocket implementation.
    Please use 'ws' package as an adapter.
    See https://github.com/houd1ni/WebsocketPromisify/issues/23
  `)
  const full_config = qmergeDeep(default_config(), config) as wsc.Config
  const url = full_config.url
  if(url[0] == '/') try {
    const protocol = location.protocol.includes('s:') ? 'wss' : 'ws'
    full_config.url = `${protocol}://${location.hostname}:${location.port}${url}`
  } catch (e) {
    throw new Error('WSP: URL starting with / in non-browser environment!')
  }

  return full_config
}