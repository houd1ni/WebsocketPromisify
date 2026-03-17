import { AnyFunc, AnyObject, both, callWith, F, isNil, notf, once, qfilter, T, tap, typeIs } from 'pepka';
import { Zipnum } from 'zipnum';
import { processConfig } from './config';
import './types';
import { add_event, rm_event, sett } from './utils';

const MAX_32 = 2**31 - 1
const { random } = Math
const zipnum = new Zipnum()
const callit = callWith([])
const isNumber = both(typeIs('Number'), notf(isNaN))
const ping_send_opts: wsc.SendOptions = {_is_ping: true}
const clearTO = (to: NodeJS.Timeout|null) => to && clearTimeout(to)

type EventHandler<T extends keyof WebSocketEventMap> = AnyFunc<any, [WebSocketEventMap[T]]>
type EventHandlers = {
  open: EventHandler<'open'>[]
  close: EventHandler<'close'>[]
  error: EventHandler<'error'>[]
  message: AnyFunc<any, [WebSocketEventMap['message'] & {data: any}]>[]
  timeout: AnyFunc<any, [data: any]>[]
}
const genid = (q: AnyObject) => {
  const id = zipnum.zip((random()*(MAX_32-10))|0)
  return id in q ? genid(q) : id
}

export class WebSocketClient {
  private ws: wsc.Socket|null = null
  private intentionally_closed = false
  private reconnect_timeout: NodeJS.Timeout|null = null
  private queue: Record<string, wsc.Message> = {}
  private onReadyQueue: AnyFunc[] = []
  private onCloseQueue: AnyFunc[] = []
  private handlers: EventHandlers = { open: [], close: [], message: [], error: [], timeout: [] }
  private config = <wsc.Config>{}
  private ping_timer: NodeJS.Timeout|null = null
  private idle_timer: NodeJS.Timeout|null = null
  private get opened() { return this.ws?.readyState===1 }  // The only opened state.

  private init_flush(): void {
    // TODO: reject them or save somehow ?..
    qfilter(F, this.queue)
  }
  private call(event_name: wsc.WSEvent, ...args: any[]) {
    for(const h of this.handlers[event_name]) h(...args)
  }
  private log(event: wsc.WSEvent, message: any = null, time: number|null = null): void {
    const {config} = this
    setTimeout(() => {
      if(time === null)
        if(config.timer) config.log(event, null, message)
        else config.log(event, message)
      else
        config.log(event, time, message)
    })
  }
  private resetPing() {
    const {config: {ping}, ping_timer} = this
    if(ping) {
      if(!isNil(ping_timer))
        clearTimeout(ping_timer as NodeJS.Timeout)
      this.ping_timer = sett(ping.interval*1e3, async () => {
        const {ping_timer, opened} = this
        if(opened) {
          await this.send(ping.content, ping_send_opts)
          this.resetPing()
        } else clearTimeout(ping_timer!)
      })
    }
  }

  // FIXME: Make some version where it could work faster (for streaming).
  private resetIdle() {
    const {config: {max_idle_time: time}, idle_timer} = this
    if(time!==Infinity) {
      if(!isNil(idle_timer)) clearTimeout(idle_timer!)
      this.idle_timer = sett(time*1e3, () => this.opened && this.close())
    }
  }

  private initSocket(ws: wsc.Socket) {
    const {queue, config} = this
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
    this.resetPing(); this.resetIdle()
    add_event(ws, 'close', async (...e) => {
      this.ws = null
      this.onCloseQueue.forEach(callit)
      this.onCloseQueue.splice(0)
      this.call('close', ...e)
      // Auto reconnect.
      let {reconnect, reconnection_attempts} = config
      if(isNumber(reconnect)) {
        const reconnectFunc = async () => {
          if(this.intentionally_closed || !reconnection_attempts) return;
          reconnection_attempts--
          this.log('reconnect')
          if(!isNil(this.ws)) {
            this.ws!.close()
            this.ws = null
          }
          // If some error occured, try again.
          const status = await this.connect()
          if(!isNil(status))
            this.reconnect_timeout = setTimeout(reconnectFunc, reconnect*1e3)
        }
        // TODO: test normal close by server. Would it be infinite ?
        reconnectFunc()
      }
    })
    add_event(ws, 'message', (e) => {
      try {
        const data = config.decode(e.data)
        this.call('message', {...e, data}) // TODO: Breaking: make message-ext another handler.
        let internal = false
        if(typeIs('Object', data) && id_key in data) {
          const q = this.queue[data[id_key]]
          if(q) {
            // Debug, Log.
            const time = q.sent_time ? (Date.now() - q.sent_time) : null
            this.log('message', data[data_key], time)
            // Play.
            q.ff(data[data_key])
            internal = true
          }
        }
        if(!internal) this.log('message-ext', data)
      } catch (err) {
        console.error(err, `WSP: Decode error. Got: ${e.data}`)
      }
      this.resetPing()
    })
  }
  private opening = false
  private connect() { // returns status if won't open or null if ok.
    return new Promise<null|number>((ff) => {
      if(this.opened||this.opening) return ff(null)
      this.opening = true
      const config = this.config
      const ws = config.socket || config.adapter(config.url, config.protocols)
      if(!ws || ws.readyState > 1) {
        this.opening = false
        this.ws = null
        this.log('error', 'ready() on closing or closed state! status 2.')
        return ff(2)
      }
      const ffo = once((s: null|number) => {this.opening=false; ff(s)})
      add_event(ws, 'error', once((e) => {
        this.ws = null
        this.log('error', 'status 3. Err: '+e.message)
        this.call('error', e)
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
      if(this.config.lazy || this.opened) ff() // FIXME: (possibly) breaking change ?? At least minor ver bump with a notice!!!
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
    if(raw) add_event(this.ws as wsc.Socket, event_name, _handler)
    else this.handlers[event_name].push(_handler)
    return _handler
  }
  public off(
    event_name: wsc.WSEvent,
    handler: (data: any) => any,
    raw = false
  ) {
    if(raw) return rm_event(this.ws as wsc.Socket, event_name, handler)
    const handlers = this.handlers[event_name]
    const i = handlers.indexOf(handler)
    if(~i) handlers.splice(i, 1)
  }
  public async close(): wsc.AsyncErrCode {
    return new Promise((ff, rj) => {
      if(this.ws === null) {
        rj('WSP: closing a non-inited socket!')
      } else {
        this.onCloseQueue.push(() => {
          this.init_flush()
          ff(null)
        })
        this.ws.close()
        this.ws = null
        this.intentionally_closed = true
      }
    })
  }
  public open() {
    if(!this.opened) {
      this.intentionally_closed = false
      return this.connect()
    }
  }
  // TODO: Сделать сэттер элементов конфигурации чтобы двигать таймауты.
  // И эвент, когда схема наша, а соответствующего элемента очереди не ма.
  // Или добавить флажок к эвенту 'message'.F
  // И событие 'line' со значением on: boolean. Критерии?
  private async prepareMessage<RequestDataType = any>(
    message_data: RequestDataType,
    opts = <wsc.SendOptions>{}
  ) {
    this.log(opts._is_ping ? 'ping' : 'send', message_data)
    const {config, queue} = this
    const {pipes, server: {data_key}} = config
    const {top, _is_ping} = opts
    const id = genid(queue)
    if(typeof top === 'object') {
      if(top[data_key]) {
        throw new Error(`Attempting to set data key/token via ${opts._is_ping ? 'ping' : 'send'}() options!`)
      }
    }
    for(const pipe of pipes) message_data = pipe(message_data)
    const [msg, err] = await Promise.all([
      config.encode(id, message_data, config),
      this.connect()
    ])
    if(err) throw new Error('ERR while opening connection #'+err)
    const cleanup = tap(() => delete this.queue[id])
    const timeout = (rj: AnyFunc) => sett(config.timeout, () => {
      if(id in queue) {
        this.call('timeout', message_data)
        rj({'Websocket timeout expired': config.timeout, 'for the message': message_data})
        cleanup()
      }
    })
    const send = () => this.opened && (
      this.ws!.send(msg),
      this.resetPing(),
      (!_is_ping && this.resetIdle())
    )
    return { id, msg, timeout, cleanup, send }
  }
  /**  .send(your_data) wraps request to server with {id: `hash`, data: `actually your data`},
    returns a Promise that will be rejected after a timeout or
    resolved if server returns the same signature: {id: `same_hash`, data: `response data`}.
  */
  public async send<RequestDataType = any, ResponseDataType = any>(
    message_data: RequestDataType,
    opts = <wsc.SendOptions>{}
  ): Promise<ResponseDataType> {
    const {id, msg, timeout, cleanup, send} = await this.prepareMessage(message_data, opts)
    const {queue, config} = this
    return new Promise<ResponseDataType>((ff, rj) => {
      const to = timeout(rj)
      queue[id] = {
        msg,
        data_type: config.data_type,
        sent_time: config.timer ? Date.now() : null,
        ff(x: any) {
          clearTO(to)
          ff(x)
        }
      }; send()
    }).finally(cleanup)
  }
  // FIXME: rejects into ff somehow.
  public async *stream<RequestDataType = any, ResponseDataType = any>(
    message_data: RequestDataType,
    opts = <wsc.SendOptions>{}
  ): AsyncGenerator<ResponseDataType, void, unknown> {
    const {id, msg, timeout, cleanup, send} = await this.prepareMessage(message_data, opts)
    const {queue, config} = this
    let done = false, fulfill: AnyFunc, to: NodeJS.Timeout|null = null
    queue[id] = {
      msg,
      ff: (msg: ResponseDataType&{done?: boolean}) => {
        if(msg?.done) { delete msg.done; done=true; setTimeout(cleanup) }
        fulfill(msg)
      },
      data_type: config.data_type,
      sent_time: config.timer ? Date.now() : null
    }; send()
    while(!done) yield await new Promise<ResponseDataType>((ff, rj) => {
      to=timeout(rj); fulfill=ff
    }).catch((e) => cleanup(e)).finally(() => {clearTO(to); to=null})
  }
  // TODO: Add .on handlers to config!
  constructor(user_config: wsc.UserConfig = {}) {
    this.config = processConfig(user_config)
    if(!this.config.lazy) this.connect()
  }
}

/* TODO: v3: @.deprecated. Use named import { WebSocketClient } instead. */
export default WebSocketClient