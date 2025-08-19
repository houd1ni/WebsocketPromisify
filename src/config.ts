import './types'
import { native_ws } from './utils'

const default_config = <wsc.Config>{
  data_type: 'json',  // ToDo some other stuff maybe.
  // Debug features.
  log: (() => null),
  timer: false,
  // Set up.
  url: 'localhost',
  timeout: 1400,
  reconnect: 2,       // Reconnect timeout in seconds or null.
  reconnection_attempts: Infinity,
  max_idle_time: Infinity,
  lazy: false,
  socket: null,
  adapter: ((host, protocols) => new WebSocket(host, protocols)),
  encode: (key, data, { server }) => JSON.stringify({
    [server.id_key]: key,
    [server.data_key]: data
  }),
  decode: (rawMessage) => JSON.parse(rawMessage),
  protocols: [],
  pipes: [],
  server: {
    id_key: 'id',
    data_key: 'data'
  },
  ping: {
    interval: 55,
    content: {}
  }
}

export const processConfig = (config: wsc.UserConfig) => {
  if(native_ws===null && !('adapter' in config)) throw new Error(`
    This platform has no native WebSocket implementation.
    Please use 'ws' package as an adapter.
    See https://github.com/houd1ni/WebsocketPromisify/issues/23
  `)
  const full_config: wsc.Config = Object.assign(
    {},
    default_config,
    config
  )
  const url = full_config.url
  if(url[0] == '/') {
    try {
      const protocol = location.protocol.includes('s:') ? 'wss' : 'ws'
      full_config.url = `${protocol}://${location.hostname}:${location.port}${url}`
    } catch (e) {
      throw new Error('WSP: URL starting with / in non-browser environment!')
    }
  }

  return full_config
}