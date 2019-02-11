
import packNumber from './packNumber'
import connectLib from './connectLib'
import { add_event, sett } from './utils'
import { enrichConfig } from './config'
import './types'

const MAX_32 = 2**31 - 1

/*  .send(your_data) wraps request to server with {id: `hash`, data: `actually your data`},
    returns a Promise, that will be rejected after a timeout or
    resolved if server returns the same signature: {id: `same_hash`, data: `response data`}
*/
class WebSocketClient {

  private open = null
  private ws = null
  // in use by side functions.
  private forcibly_closed = false
  private reconnect_timeout: NodeJS.Timer = null
  private queue = {}
  private messages = []
  private onReadyQueue = []
  private onCloseQueue = []
  private config = <wsc.Config>{}

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
    return new Promise((ff) => {
      connectLib.call(this, ff)
    })
  }

  public get socket() {
    return this.ws
  }

  public async ready() {
    return new Promise((ff) => {
      if(this.open) {
        ff()
      } else {
        this.onReadyQueue.push(ff)
      }
    })
  }

  public on(
    event_name: string,
    handler: (data: any) => any,
    predicate?: (data: any) => boolean
  ) {
    return add_event(this.ws, event_name, event => {
      if(!predicate || predicate(event)) {
        handler(event)
      }
    })
  }

  public async close(): wsc.AsyncErrCode {
    return new Promise((ff, rj) => {
      if(this.ws === null) {
        rj('WSP: closing a non-inited socket!')
      } else {
        this.open = null
        this.onCloseQueue.push(() => {
          this.init_flush()
          this.ws = null
          this.forcibly_closed = true
          ff(null)
        })
        this.ws.close()
      }
    })
  }

  public async send(message_data: any, opts = <wsc.SendOptions>{}): wsc.AsyncErrCode {
    this.log('Send.', message_data)
    const config   = this.config
    const message  = {}
    const data_key = config.server.data_key
    const first_time_lazy = config.lazy && !this.open

    const message_id = packNumber((Math.random()*(MAX_32-10))|0)
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


  constructor(user_config: wsc.UserConfig = {}) {
    this.config = enrichConfig(user_config)
    // Init.
    this.init_flush()
    // Flags.
    this.open = false
    this.reconnect_timeout = null
    this.forcibly_closed = false
    if(!this.config.lazy) {
      this.connect()
    }
  }
}

export default WebSocketClient