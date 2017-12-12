
import SHA1 from './SHA1.js'
import * as types from '../index'

/*  .send(your_data) wraps request to server with {id: `hash`, data: `actually your data`},
    returns a Promise, that will be rejected after a timeout or
    resolved if server returns the same signature: {id: `same_hash`, data: `response data`}
*/


const add_event = (o: WebSocket, e: string, handler: types.EventHandler) => o.addEventListener(e, handler)
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
  adapter: ((host, protocols) => new WebSocket(host, protocols)),
  protocols: [],
  server: {
    id_key: 'id',
    data_key: 'data'
  }
}


class WebSocketClient implements WebSocketClient {

  private open = null
  private ws = null
  private forcibly_closed = false
  private reconnect_timeout: NodeJS.Timer = null
  private queue = {}
  private messages = []
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
      if(this.open === true) {
        return ff(1)
      }
      const config = this.config
      const ws = config.adapter(`ws://${config.url}`, config.protocols)
      this.ws = ws
      add_event(ws, 'error', (e) => {
        this.ws = null
        this.log('Error status 3.')
        // Some network error: Connection refused or so.
        return ff(3)
      })
      add_event(ws, 'open', (e) => {
        this.log('Opened.')
        this.open = true
        const {id_key, data_key} = config.server
        // Send all pending messages.
        this.messages.forEach((message) => message.send())
        // It's reconnecting.
        if(this.reconnect_timeout !== null) {
          clearInterval(this.reconnect_timeout)
          this.reconnect_timeout = null
        }
        add_event(ws, 'close', async (e) => {
          this.log('Closed.')
          this.open = false
          // Auto reconnect.
          const reconnect = config.reconnect
          if(
            typeof reconnect === 'number' &&
            !isNaN(reconnect) &&
            !this.forcibly_closed
          ) {
            const reconnectFunc = async () => {
              this.log('Trying to reconnect...')
              if(this.ws !== null) {
                this.ws.close()
                this.ws = null
              }
              // If some error occured, try again.
              const status = await this.connect()
              if(status !== null) {
                this.reconnect_timeout = setTimeout(reconnectFunc, reconnect * 1000)
              }
            }
            // No need for await.
            reconnectFunc()
          } else {
            this.ws = null
            this.open = null
          }
          // reset the flag to reuse.
          this.forcibly_closed = false
        })
        add_event(ws, 'message', (e) => {
          try {
            const data = JSON.parse(e.data)
            if(data[id_key]) {
              const q = this.queue[data[id_key]]
              if(q) {
                // Debug, Log.
                const time = q.sent_time ? (Date.now() - q.sent_time) : null
                this.log('Message.', data[data_key], time)
                // Play.
                q.ff(data[data_key])
                clearTimeout(q.timeout)
                delete this.queue[data[id_key]]
              }
            }
          } catch (err) {
            console.error(err, `JSON.parse error. Got: ${e.data}`)
          }
        })
        return ff(null)
      })
    })
  }

  public on(event_name, handler, predicate) {
    return add_event(this.ws, event_name, event => {
      if(!predicate || predicate(event)) {
        handler(event)
      }
    })
  }

  public close() {
    this.init_flush()
    this.open = null
    this.ws.close()
    this.ws = null
    this.forcibly_closed = true
    return null
  }

  public async send(user_message, opts = <types.SendOptions>{}) {
    this.log('Send.', user_message)
    const config   = this.config
    const message  = {}
    const id_key   = config.server.id_key
    const data_key = config.server.data_key
    const first_time_lazy = config.lazy && !this.open
    // const data_type  = opts.data_type || config.data_type

    message[data_key] = user_message // is_json ? JSON.stringify(user_message
    message[id_key]   = SHA1('' + ((Math.random()*1e5)|0)).slice(0, 20)
    if(typeof opts.top === 'object') {
      if(opts.top[data_key]) {
        throw new Error('Attempting to set data key/token via send() options!')
      }
      Object.assign(message, opts.top)
    }

    if(this.open === true) {
      this.ws.send(JSON.stringify(message))
    } else if(this.open === false || first_time_lazy) {
      this.messages.push({send: () => this.ws.send(JSON.stringify(message))})
      if(first_time_lazy) {
        this.connect()
      }
    } else if(this.open === null) {
      throw new Error('Attempting to send via closed WebSocket connection!')
    }

    return new Promise((ff, rj) => {
      this.queue[message[id_key]] = {
        ff,
        data_type: config.data_type,
        sent_time: config.timer ? Date.now() : null,
        timeout: sett(config.timeout, () => {
          if(this.queue[message[id_key]]) {
            rj({
              'Websocket timeout expired: ': config.timeout,
              'for the message': message
            })
            delete this.queue[message[id_key]]
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