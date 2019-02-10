import './types'

const default_config = <wsc.Config>{
  data_type: 'json',  // ToDo some other stuff maybe.
  // Debug features.
  log: (() => null),
  timer: false,
  // Set up.
  url: 'localhost',
  timeout: 1400,
  reconnect: 2,       // Reconnect timeout in seconds or null.
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
  }
}

const enrichConfig = (config: wsc.UserConfig) => {
  const full_config: wsc.Config = Object.assign(
    {},
    default_config,
    config
  )

  const url = full_config.url
  if(url[0] == '/') {
    try {
      full_config.url = `${location.hostname}:${location.port}${url}`
    } catch (e) {
      throw new Error('WSP: URL starting with / in non-browser environment!')
    }
  }

  return full_config
}

export {
  enrichConfig
}