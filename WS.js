
const SHA1 = require('./SHA1.js')

/*  .send(your_data) wraps request to server with {id: `hash`, data: `actually your data`},
    returns a Promise, that will be rejected after a timeout or
    resolved if server returns the same signature: {id: `same_hash`, data: `response data`}
*/

const add_event = (o, e, handler) => o.addEventListener(e, handler)
const sett = (a, b) => setTimeout(b, a)

const default_config = {
  data_type: 'json',  // ToDo some other stuff maybe.
  url: 'localhost',
  timeout: 1400,
  adapter: (host => new WebSocket(host)),
  server: {
    id_key: 'id',
    data_key: 'data'
  }
}


class WebSocketClient {

  on(event_name, handler, predicate) {
    return add_event(this.ws, event_name, event => {
      if(!predicate || predicate(event)) {
        handler(event)
      }
    })
  }

  close() {
    delete this.queue   // Free up memory.
    delete this.messages
    this.open = null
    return this.ws.close()
  }

  async send(user_message, opts = {}) {
    const message = {}
    const id_key   = this.config.server.id_key
    const data_key = this.config.server.data_key
    const is_json = typeof opts.json == 'boolean' ? opts.data_type=='json' : this.config.json

    message[data_key] = user_message // is_json ? JSON.stringify(user_message
    message[id_key]   = SHA1(user_message + '' + ((Math.random()*1e5)|0)).slice(0, 20)
    if(typeof opts.top  == 'object') {
      if(opts.top[data_key]) {
        throw new Error('Attempting to set data key/token via send() options!')
      }
      Object.assign(message, opts.top)
    }

    if(this.open === true) {
      this.ws.send(JSON.stringify(message))
    } else if(this.open === false) {
      this.messages.push({send: () => this.ws.send(JSON.stringify(message))})
    } else if(this.open === null) {
      throw new Error('Attempting to send via closed WebSocket connection!')
    }

    return new Promise((ff, rj) => {
      this.queue[message[id_key]] = {
        ff,
        data_type: this.config.data_type,
        timeout: sett(this.config.timeout, () => {
          if(this.queue[message[id_key]]) {
            rj({
              'Websocket timeout expired: ': this.config.timeout,
              'for the message': message
            })
            delete this.queue[message[id_key]]
          }
        })
      }
    })
  }


  constructor(user_config = {}) {
    const config = {}
    Object.assign(config, default_config)
    Object.assign(config, user_config)
    const id_key   = config.server.id_key
    const data_key = config.server.data_key
    const ws = config.adapter(`ws://${config.url}`)
    this.ws  = ws
    this.queue    = {}  // data queuse
    this.messages = []  // send() queue
    this.config   = config

    add_event(ws, 'open', (e) => {
      this.open = true
      this.messages.forEach((message) => message.send())
    })
    add_event(ws, 'close', (e) => {
      this.ws = null
      this.open = false
    })
    add_event(ws, 'message', (e) => {
      try {
        const data = JSON.parse(e.data)
        if(data[id_key]) {
          const q = this.queue[data[id_key]]
          if(q) {
            q.ff(data[data_key])
            clearTimeout(q.timeout)
            delete this.queue[data[id_key]]
          }
        }
      } catch (err) {
        console.error(`JSON.parse error. Got: ${e.data}`)
      }
    })
  }
}

module.exports = WebSocketClient