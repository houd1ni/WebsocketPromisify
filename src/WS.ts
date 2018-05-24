
import SHA1 from './SHA1.js'
import * as types from '../types'
import connectLib from './connectLib'
import { add_event } from './utils'

/*  .send(your_data) wraps request to server with {id: `hash`, data: `actually your data`},
    returns a Promise, that will be rejected after a timeout or
    resolved if server returns the same signature: {id: `same_hash`, data: `response data`}
*/


const sett = (a, b) => setTimeout(b, a)

const default_config = <types.Config>{
  data_type: 'json',  // ToDo some other stuff maybe.
  // Debug features.
  log: ((event = '', time = 0, message = '') => null),
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


class WebSocketClient implements types.WebSocketClient {

  private open = null
  private ws = null
  private forcibly_closed = false
  private reconnect_timeout: NodeJS.Timer = null
  private queue = {}
  private messages = []
  private onReadyQueue = []
  private onCloseQueue = []
  private config = <types.Config>{}

  private init_flush(): void {
    this.queue    = {}  // data queuse
    this.messages = []  // send() queue
  }

  private log(event: string, message: any = null, time: number = null): void {
    const config = this.config
    event = `WSP: ${event}`
    if(time !== null) {
      config.log(event, time, message)
    } else {
      if(config.timer) {
        config.log(event, null, message)
      } else {
        config.log(event, message)
      }
    }
  }

  private async connect() { // returns status if won't open or null if ok.
    return new Promise((ff, rj) => {
      connectLib.call(this, ff)
    })
  }

  public get socket() {
    return this.ws
  }

  public async ready() {
    return new Promise((ff, rj) => {
      if(this.open) {
        return true
      } else {
        this.onReadyQueue.push(ff)
      }
    })
  }

  public on(event_name, handler, predicate?) {
    return add_event(this.ws, event_name, event => {
      if(!predicate || predicate(event)) {
        handler(event)
      }
    })
  }

  public async close(): types.AsyncErrCode {
    return new Promise((ff, rj) => {
      if(this.ws === null) {
        rj('WSP: closing a non-inited socket!')
      } else {
        this.open = null
        this.onCloseQueue.push(() => {
          this.init_flush()
          this.ws = null
          this.forcibly_closed = true
          ff()
        })
        this.ws.close()
      }
    })
  }

  public async send(message_data, opts = <types.SendOptions>{}): types.AsyncErrCode {
    this.log('Send.', message_data)
    const config   = this.config
    const message  = {}
    const id_key   = config.server.id_key
    const data_key = config.server.data_key
    const first_time_lazy = config.lazy && !this.open

    const message_id = SHA1('' + ((Math.random()*1e5)|0)).slice(0, 20)
    if(typeof opts.top === 'object') {
      if(opts.top[data_key]) {
        throw new Error('Attempting to set data key/token via send() options!')
      }
      Object.assign(message, opts.top)
    }

    config.pipes.forEach(
      (pipe) => message_data = pipe(message_data)
    )

    if(this.open === true) {
      this.ws.send(config.encode(message_id, message_data, config))
    } else if(this.open === false || first_time_lazy) {
      this.messages.push({
        send: () => this.ws.send(config.encode(message_id, message_data, config))
      })
      if(first_time_lazy) {
        this.connect()
      }
    } else if(this.open === null) {
      throw new Error('Attempting to send via closed WebSocket connection!')
    }

    return new Promise((ff, rj) => {
      this.queue[message_id] = {
        ff,
        data_type: config.data_type,
        sent_time: config.timer ? Date.now() : null,
        timeout: sett(config.timeout, () => {
          if(this.queue[message_id]) {
            rj({
              'Websocket timeout expired: ': config.timeout,
              'for the message': message
            })
            delete this.queue[message_id]
          }
        })
      }
    })
  }


  constructor(user_config = {}) {
    // Config.
    const config = {} as types.Config
    Object.assign(config, default_config)
    Object.assign(config, user_config)
    this.config = config
    // Init.
    this.init_flush()
    // Flags.
    this.open = false
    this.reconnect_timeout = null
    this.forcibly_closed = false
    if(!config.lazy) {
      this.connect()
    }
  }
}

export default WebSocketClient