import './types'
import { Zipnum } from 'zipnum'
import { add_event, sett } from './utils'
import { processConfig } from './config'
import { AnyFunc, F, once, qfilter, T } from 'pepka'

const MAX_32 = 2**31 - 1
const zipnum = new Zipnum()

type EventHandler<T extends keyof WebSocketEventMap> = AnyFunc<any, [WebSocketEventMap[T]]>
type EventHandlers = {
  open: EventHandler<'open'>[]
  close: EventHandler<'close'>[]
  error: EventHandler<'error'>[]
  message: AnyFunc<any, [WebSocketEventMap['message'] & {data: any}]>[]
  timeout: AnyFunc<any, [data: any]>[]
}

class WebSocketClient {
  private open = false
  private ws: wsc.Socket|null = null
  private forcibly_closed = false
  private reconnect_timeout: NodeJS.Timeout|null = null
  private queue: Record<string, wsc.Message> = {}
  private onReadyQueue: AnyFunc[] = []
  private onCloseQueue: AnyFunc[] = []
  private handlers: EventHandlers = { open: [], close: [], message: [], error: [], timeout: [] }
  private config = <wsc.Config>{}

  private init_flush(): void {
    // TODO: reject them or save somehow ?..
    qfilter(F, this.queue)
  }
  private call(event_name: wsc.WSEvent, ...args: any[]) {
    // this.handlers.open[0]()
    for(const h of this.handlers[event_name]) h(...args)
  }

  private log(event: string, message: any = null, time: number|null = null): void {
    const config = this.config
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

  private initSocket(ws: wsc.Socket) {
    const {queue, config} = this
    this.open = true
    this.ws = ws
    this.onReadyQueue.forEach((fn: Function) => fn())
    this.onReadyQueue.splice(0)
    const {id_key, data_key} = config.server
    // Works also on previously opened sockets that do not fire 'open' event.
    this.call('open', ws)
    for(const msg_id in queue) ws.send(queue[msg_id].msg)
    if(this.reconnect_timeout !== null) {
      clearInterval(this.reconnect_timeout)
      this.reconnect_timeout = null
    }
    if(config.ping) {
      const ping_interval = setInterval(() => {
        if(this.open) this.send(config.ping.content)
        if(this.forcibly_closed) clearInterval(ping_interval)
      }, config.ping.interval*1e3)
    }
    add_event(ws, 'close', async (...e) => {
      this.log('close')
      this.open = false
      this.ws = null
      this.onCloseQueue.forEach((fn: Function) => fn())
      this.onCloseQueue.splice(0)
      this.call('close', ...e)
      // Auto reconnect.
      const reconnect = config.reconnect
      if(
        typeof reconnect === 'number' &&
        !isNaN(reconnect) &&
        !this.forcibly_closed
      ) {
        const reconnectFunc = async () => {
          this.log('reconnect')
          if(this.ws !== null) {
            this.ws.close()
            this.ws = null
          }
          // If some error occured, try again.
          const status = await this.connect()
          if(status !== null)
            this.reconnect_timeout = setTimeout(reconnectFunc, reconnect * 1000)
        }
        // TODO: test normal close by server. Would it be infinite ?
        reconnectFunc()
      }
      // reset the flag to reuse.
      this.forcibly_closed = false
    })
    add_event(ws, 'message', (e) => {
      try {
        const data = config.decode(e.data)
        this.call('message', {...e, data})
        if(data[id_key]) {
          const q = this.queue[data[id_key]]
          if(q) {
            // Debug, Log.
            const time = q.sent_time ? (Date.now() - q.sent_time) : null
            this.log('message', data[data_key], time)
            // Play.
            q.ff(data[data_key])
          }
        }
      } catch (err) {
        console.error(err, `WSP: Decode error. Got: ${e.data}`)
      }
    })
  }

  private connect() { // returns status if won't open or null if ok.
    return new Promise((ff) => {
      if(this.open === true) {
        return ff(null)
      }
      const config = this.config
      const ws = config.socket || config.adapter(config.url, config.protocols)
      this.ws = ws
      if(!ws || ws.readyState > 1) {
        this.ws = null
        this.log('error', 'ready() on closing or closed state! status 2.')
        return ff(2)
      }
      const ffo = once(ff)
      add_event(ws, 'error', once((e) => {
        this.log('error', 'status 3. Err: '+e.message)
        this.call('error', e)
        this.ws = null
        // Some network error: Connection refused or so.
        ffo(3)
      }))
      // Because 'open' won't be envoked on opened socket.
      if(ws.readyState) {
        this.initSocket(ws)
        ffo(null)
      } else {
        add_event(ws, 'open', once(() => {
          this.log('open')
          this.initSocket(ws)
          ffo(null)
        }))
      }
    })
  }
  public get socket() { return this.ws }
  public async ready() {
    return new Promise<void>((ff) => {
      if(this.open) ff()
      else this.onReadyQueue.push(ff)
    })
  }
  public on(
    event_name: wsc.WSEvent,
    handler: (data: any) => any,
    predicate: (data: any) => boolean = T,
    raw = false
  ) {
    const _handler: wsc.EventHandler = (event) =>
      predicate(event) && handler(event)
    return raw
      ? add_event(this.ws as wsc.Socket, event_name, _handler)
      : this.handlers[event_name].push(_handler)
  }

  public async close(): wsc.AsyncErrCode {
    return new Promise((ff, rj) => {
      if(this.ws === null) {
        rj('WSP: closing a non-inited socket!')
      } else {
        this.open = false
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

  /**  .send(your_data) wraps request to server with {id: `hash`, data: `actually your data`},
    returns a Promise that will be rejected after a timeout or
    resolved if server returns the same signature: {id: `same_hash`, data: `response data`}.
  */
  public async send<RequestDataType = any, ResponseDataType = any>(
    message_data: RequestDataType,
    opts = <wsc.SendOptions>{}
  ): Promise<ResponseDataType> {
    this.log('send', message_data)
    const {config, ws, forcibly_closed, queue} = this
    const message  = {}
    const data_key = config.server.data_key

    const message_id = zipnum.zip((Math.random()*(MAX_32-10))|0)
    if(typeof opts.top === 'object') {
      if(opts.top[data_key]) {
        throw new Error('Attempting to set data key/token via send() options!')
      }
      Object.assign(message, opts.top)
    }
    config.pipes.forEach((pipe) => message_data = pipe(message_data))

    if(forcibly_closed)
      throw new Error('Attempting to send via closed WebSocket connection!')
    if(!this.open) this.connect()
    const msg = await config.encode(message_id, message_data, config)
    if(ws?.readyState===1) // The only opened state.
      ws.send(msg)

    return new Promise((ff, rj) => {
      this.queue[message_id] = {
        msg, ff(x: any) {
          ff(x)
          // cleanup.
          clearTimeout(this.timeout) // from this object!
          delete queue[message_id]
        },
        data_type: config.data_type,
        sent_time: config.timer ? Date.now() : null,
        timeout: sett(config.timeout, () => {
          if(this.queue[message_id]) {
            this.call('timeout', message_data)
            rj({
              'Websocket timeout expired: ': config.timeout,
              'for the message ': message_data
            })
            delete queue[message_id]
          }
        })
      }
    })
  }

  // TODO: Add .on handlers to config!
  constructor(user_config: wsc.UserConfig = {}) {
    this.config = processConfig(user_config)
    this.init_flush()
    if(!this.config.lazy) this.connect()
  }
}

/* TODO: v3: @.deprecated. Use named import { WebSocketClient } instead. */
export default WebSocketClient