
SHA1 = require('./SHA1.js')

/*  .send(your_data) wraps request to server with {id: `hash`, data: `actually your data`},
    returns a Promise, that will be rejected after a timeout or
    resolved if server returns the same signature: {id: `same_hash`, data: `response data`}
    works only with {json: true} in config to constructor.
*/

is_func   = (handler) => typeof handler == 'function'
add_event = (o, e, handler) => o.addEventListener(e, handler)
sett = (a, b) => setTimeout(b, (a || 0))

const default_config = {
  json: true,
  url: 'localhost',
  timeout: 1400,
  id_name: 'id'
}


class WebSocketClient {

  async send(user_message, opts = {}) {
    let message = {}
    const id_name = this.config.id_name

    message.data = user_message
    message.json = typeof opts.json == 'boolean' ? opts.json : this.config.json
    message[id_name] = SHA1(user_message + '' + ((Math.random()*1e5)|0)).slice(0, 20)

    if(this.open) {
      this.ws.send(JSON.stringify(message))
    } else {
      this.messages.push({send: () => this.ws.send(JSON.stringify(message))})
    }

    return new Promise((ff, rj) => {
      this.queue[message[id_name]] = {
        ff
      }
      sett(this.config.timeout, () => {
        if(this.queue[message[id_name]]) {
          rj({
            'Websocket timeout expired: ': this.config.timeout,
            'for the message': message
          })
          delete this.queue[message[id_name]]
        }
      })
    })
  }


  constructor(config = {}) {
    this.config = {}
    Object.assign(this.config, default_config)
    Object.assign(this.config, config)
    config = this.config
    const id_name = this.config.id_name
    this.queue = {} // data queuse
    this.messages = []  // send() queue
    this.ws = new WebSocket(`ws://${config.url}`)
    const ws = this.ws

    add_event(ws, 'open', (e) => {
      if(is_func(config.onopen)) {
        config.onopen()
      }
      this.open = true
      this.messages.forEach((message) => message.send())
    })
    add_event(ws, 'close', (e) => {
      if(is_func(config.onclose)) {
        config.onclose()
      }
      this.ws = null
      this.open = false
    })
    if(is_func(config.onerror)) {
      add_event(ws, 'error', config.onerror)
    }
    add_event(ws, 'message', (e) => {
      if(is_func(config.onmessage)) {
        config.onmessage({
          data: e.data
        })
      }
      try {
        const data = config.json ? JSON.parse(e.data) : e.data
        if(data[id_name]) {
          const q = this.queue[data[id_name]]
          if(q) {
            q.ff(data.data)
            delete this.queue[data[id_name]]
          }
        }
      } catch (err) {
        console.error(`JSON.parse error. Got: ${e.data}`)
      }
    })
  }
}

module.exports = WebSocketClient