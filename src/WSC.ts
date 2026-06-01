import { AnyFunc, equals, isNil, multiply, noop, once, T, tap, typeIs } from 'pepka'
import { Zipnum } from 'zipnum'
import { processConfig } from './config'
import './types'
import { add_event, rm_event, sett } from './utils'
const { random } = Math

const MAX_32 = 2**31 - 1
const nil = null, inf = Infinity
const resolved = Promise.resolve(nil)
const label_message = 'message'
const label_message_ext = 'message-ext'
const label_error = 'error'
const zipnum = new Zipnum()
const dnow = () => Date.now()
const now = () => dnow()/1e3
const ms = multiply(1e3)
const clearTO = (to: NodeJS.Timeout|null) => to && clearTimeout(to)
const isNull = (x: any) => x===null
const isStr = typeIs('String')
const isObj = typeIs('Object')

type EventHandler<T extends keyof WebSocketEventMap> = AnyFunc<any, [WebSocketEventMap[T]]>
type RouteHandler<T> = AnyFunc<any, [data: T, next: AnyFunc]>
type EventHandlers = {
  open: EventHandler<'open'>[]
  close: EventHandler<'close'>[]
  error: EventHandler<'error'>[]
  message: AnyFunc<any, [WebSocketEventMap['message'] & {data: any}]>[]
  [label_message_ext]: AnyFunc<any, [WebSocketEventMap['message'] & {data: any}]>[]
  timeout: AnyFunc<any, [data: any]>[]
}
const timeout_rm = (q: AnyFunc[], ff: AnyFunc, rj: AnyFunc, timeout=.5) => {
  const timeout_ms = ms(timeout)
  const rm = setTimeout(() => {
    const i = q.indexOf(ff)
    if(~i) { q.splice(i); rj(`could not close in ${timeout_ms}ms!`) }
  }, timeout_ms*1e3)
  q.push((...ps) => {clearTO(rm); ff(...ps)})
}
const genid = (q: Map<string, wsc.Message>): string => {
  const id = zipnum.zip((random()*(MAX_32-10))|0)
  return q.has(id) ? genid(q) : id
}
const call_q = (q: AnyFunc[], ...args: any[]) => {
  for(const fn of q) fn(...args)
  return q
}
const clear_q = (q: AnyFunc[]) => { q.splice(0); return q }
const default_router = (d: any, next: AnyFunc) => next(d)

export class WebSocketClient<T extends Uint8Array|string=string> {
  private ws: wsc.Socket|null = nil
  private intentionally_closed = false
  private reconnect_timeout: NodeJS.Timeout|null = nil
  private queue = {
    send:          new Map<string, wsc.Message>(),
    on_ready:      <AnyFunc[]>[],
    on_close:      <AnyFunc[]>[],
    on_ready_fail: <AnyFunc[]>[]
  }
  private handlers: EventHandlers = {
    open: [], close: [], message: [], [label_message_ext]: [], error: [], timeout: []
  }
  private config = <wsc.Config>{}
  private ping_timer:   NodeJS.Timeout|null = nil
  private idle_timer:   NodeJS.Timeout|null = nil
  private zombie_timer: NodeJS.Timeout|null = nil
  private router = default_router
  private get opened() { return this.ws?.readyState===1 }  // The only opened state.
  private call(event_name: keyof EventHandlers, ...args: any[]) {
    for(const h of this.handlers[event_name]) h(...args)
  }
  private log(event: wsc.WSEvent, message: any = nil, time: number|null = nil): void {
    const {config} = this
    setTimeout(() => {
      if(isNull(time))
        if(config.timer) config.log(event, nil, message)
        else config.log(event, message)
      else
        config.log(event, time, message)
    })
  }
  private resetPing() {
    const {config: {ping}, ping_timer} = this
    if(ping) {
      clearTO(ping_timer as NodeJS.Timeout)
      this.ping_timer = sett(ms(ping.interval), async () => {
        const {ping_timer, opened} = this
        if(opened) {
          this.ws!.send(ping.out)
          this.resetPing()
        } else clearTO(ping_timer)
      })
    }
  }
  private resetZombieProbe() {
    const {config} = this
    if(config.ping) {
      const z_timeout = config.ping.timeout
      clearTO(this.zombie_timer)
      if(z_timeout!==Infinity) this.zombie_timer = sett(
        ms(z_timeout||config.timeout),
        () => this.close().catch(noop)
      )
    }
  }
  // FIXME: Make some version where it could work faster (for streaming).
  private resetIdle() {
    const {config: {max_idle_time: time}, idle_timer} = this
    if(time!==Infinity) {
      clearTO(idle_timer)
      this.idle_timer = sett(ms(time), () => this.opened && this.close())
    }
  }
  private _reconnecting = false
  private reconnect_start = 0
  private async reconnect(attempt = 0) {
    if(this._reconnecting&&attempt===0) return;
    const {reconnect} = this.config
    if(!reconnect) throw new Error('WSC: reconnecting is disabled, but reconned h.b. called!')
    this.log('reconnect')
    this._reconnecting = true
    this.reconnect_start = now()
    if(!isNil(this.ws)) this.terminate()
    const {queue} = this
    if(attempt>0 && isNil(await this.connect())) {   // connected.
      clear_q(call_q(queue.on_ready))
      clear_q(queue.on_ready_fail)
      this._reconnecting = false
      this.reconnect_timeout = nil
    } else {
      const {stop_after, time_fn, params} = reconnect
      if(now()-this.reconnect_start>stop_after) {    // give up.
        this.terminate()
        clear_q(call_q(queue.on_ready_fail))
        clear_q(queue.on_ready)
        this._reconnecting = false
        this.reconnect_timeout = nil
      } else this.reconnect_timeout = sett(          // try more.
        ms(time_fn(params, attempt)),
        this.reconnect.bind(this, attempt+1)
      )
    }
  }
  private resetReconnect() {
    if(!isNull(this.reconnect_timeout)) {
      clearTO(this.reconnect_timeout)
      this.reconnect_timeout = nil
    }
  }
  private initSocket(ws: wsc.Socket) {
    const {queue, config, router} = this
    const {reconnect} = config
    this.ws = ws
    clear_q(call_q(this.queue.on_ready))
    const {id_key, data_key, on_collision} = config.server
    // works also on previously opened sockets that do not fire 'open' event.
    this.call('open', ws)
    for(const {msg} of queue.send.values()) ws.send(msg)
    this.resetReconnect(); this.resetZombieProbe(); this.resetPing(); this.resetIdle()
    add_event(ws, 'close', async (...e) => {
      this.ws = nil
      clear_q(call_q(queue.on_close))
      this.call('close', ...e)
      if(!this.intentionally_closed && reconnect && reconnect.on_break) this.reconnect()
    })
    const {ping} = config
    const handle_msg = (raw: T) => {
      try {
        const data = config.decode(raw)
        const {send: send_q} = this.queue
        if(isObj(data) && id_key in data) {
          const id = data[id_key]
          if(send_q.has(id)) {
            const q = send_q.get(id)!
            const d = data[data_key]
            const time = q.sent_time ? (dnow() - q.sent_time) : nil
            this.log(label_message, d, time)
            this.call(label_message, d)
            q.ff(d)
          } else switch(on_collision) {
            case 'error':
              const err = {
                data,
                message: `WSP: id_key exists in the incoming message, but does not exist in the queue!`
              }
              this.log(label_error, err)
              this.call(label_error, err)
            case 'ignore': return;
            case 'pass': break
          }
        }
        this.log(label_message_ext, data)
        this.call(label_message_ext, {data})
      } catch (err) {
        console.error(err, `WSP: Decode error. Got: ${raw}`)
      }
    }
    add_event(ws, label_message, (e) => {
      const raw = isStr(e.data) ? e.data : new Uint8Array(e.data)
      this.resetZombieProbe(); this.resetPing()
      if(!ping || !equals(raw, ping.in)) router(raw, handle_msg)
    })
  }
  private _opening = false
  /** returns status if won't open or null if ok. */
  private connect() {
    if(this.opened||this._opening) return resolved
    return this.opened||this._opening ? resolved : new Promise<null|number>((ff) => {
      this._opening = true
      const config = this.config
      const ws = config.socket || config.adapter(config.url, config.protocols)
      if(isNil(ws) || ws.readyState > 1) {
        this._opening = false
        this.ws = nil
        this.log('error', 'ready() on closing or closed state! status 2.')
        return ff(2)
      }
      const ffo = once((s: null|number) => {this._opening=false; ff(s)})
      add_event(ws, 'error', once((e) => {
        this.ws = nil // Some network error: Connection refused or so.
        this.log('error', 'status 3. Err: '+(e.message||e))
        this.call('error', e)
        ffo(3)
      }))
      if(ws.readyState) { // Because 'open' won't be envoked on opened socket.
        this.initSocket(ws)
        ffo(nil)
      } else add_event(ws, 'open', once(() => {
        this.log('open')
        this.initSocket(ws)
        ffo(nil)
      }))
    })
  }
  public get socket() { return this.ws }
  public async ready(timeout = inf) {
    return new Promise<void>((ff, rj) => {
      const {on_ready} = this.queue
      if(this.config.lazy || this.opened) ff()
      else if(timeout===inf) on_ready.push(ff)
      else timeout_rm(on_ready, ff, rj)
    })
  }
  public on(
    event_name: keyof EventHandlers,
    handler: wsc.EventHandler,
    predicate: wsc.Predicate = T,
    raw = false
  ) {
    const _handler: wsc.EventHandler = (event) =>
      predicate(event) && handler(event)
    if(raw) add_event(this.ws as wsc.Socket, event_name, _handler)
    else this.handlers[event_name].push(_handler)
    return _handler
  }
  public off(
    event_name: keyof EventHandlers,
    handler: wsc.EventHandler,
    raw = false
  ) {
    if(raw) return rm_event(this.ws as wsc.Socket, event_name, handler)
    const handlers = this.handlers[event_name]
    const i = handlers.indexOf(handler)
    if(~i) handlers.splice(i, 1)
  }
  private terminate() {
    this.ws?.close()
    this.ws = nil
    this.intentionally_closed = true
  }
  public close(timeout = .5): wsc.AsyncErrCode {
    return new Promise((ff, rj) => {
      if(isNull(this.ws)) ff(nil)
      else {
        timeout_rm(this.queue.on_close, ff, rj, timeout)
        this.terminate()
      }
    })
  }
  public open() {
    if(!this.opened) {
      this.intentionally_closed = false
      return this.connect()
    }
  }
  public addEventListener(
    e: keyof EventHandlers, cb: wsc.EventHandler,
    opts: {predicate?: wsc.Predicate, raw?: boolean} = {}
  ) { return this.on(e, cb, opts.predicate, opts.raw) }
  public removeEventListener(
    e: keyof EventHandlers,
    handler: wsc.EventHandler,
    opts: {predicate?: wsc.Predicate, raw?: boolean} = {}
  ) { return this.off(e, handler, opts.raw) }
  // TODO: Сделать сэттер элементов конфигурации чтобы двигать таймауты.
  // И эвент, когда схема наша, а соответствующего элемента очереди не ма.
  // Или добавить флажок к эвенту 'message'.F
  // И событие 'line' со значением on: boolean. Критерии?
  private async prepareMessage<RequestDataType = any>(
    message_data: RequestDataType,
    opts = <wsc.SendOptions>{}
  ) {
    this.log('send', message_data)
    const {config, queue: {send: send_q, on_ready_fail}} = this
    const {pipes, server: {data_key}} = config
    const {reconnect} = config
    const {top} = opts
    const id = genid(send_q)
    if(isObj(top) && data_key in top) throw new Error(`
      Attempting to set data key/token via send() options!
    `)
    for(const pipe of pipes) message_data = pipe(message_data)
    const [msg, err] = await Promise.all([
      config.encode(id, message_data, config),
      this.connect()
    ])
    if(err) throw new Error('ERR while opening connection > '+err)
    const timeout_time = top?.timeout || config.timeout
    const cleanup = tap(() => send_q.delete(id))
    const timeout = (rj: AnyFunc) => sett(ms(timeout_time), () => {
      if(send_q.has(id)) {
        this.call('timeout', message_data)
        const reject = () => {
          cleanup()
          rj({
            'Websocket timeout expired': timeout_time,
            'for the message': message_data
          })
        }
        if(reconnect && reconnect.on_timeout) {
          on_ready_fail.push(reject)
          this.reconnect()
        } else reject()
      }
    })
    const send = () => this.opened && (
      this.ws!.send(msg),
      this.resetPing(),
      this.resetIdle()
    )
    return { id, msg, timeout, cleanup, send }
  }
  /**  .send(your_data) wraps request to server with {id: `unique_id`, data: `actually your data`},
    returns a Promise that will be rejected after a timeout or
    resolved if server returns the same signature: {id: `same_hash`, data: `response data`}.
  */
  public async send<RequestDataType = any, ResponseDataType = any>(
    message_data: RequestDataType,
    opts = <wsc.SendOptions>{}
  ): Promise<ResponseDataType> {
    const {id, msg, timeout, cleanup, send} = await this.prepareMessage(message_data, opts)
    const {queue: {send: send_q}, config} = this
    return new Promise<ResponseDataType>((ff, rj) => {
      const to = timeout(rj)
      send_q.set(id, {
        msg,
        sent_time: config.timer ? dnow() : nil,
        ff(x: any) { clearTO(to); ff(x) }
      }); send()
    }).finally(cleanup)
  }
  // TODO: stream timeouts in the config ?..
  public async *stream<RequestDataType = any, ResponseDataType = any>(
    message_data: RequestDataType,
    opts = <wsc.SendOptions>{}
  ): AsyncGenerator<ResponseDataType, void, unknown> {
    const {id, msg, timeout, cleanup, send} = await this.prepareMessage(message_data, opts)
    const {queue: {send: send_q}, config} = this
    let done = false, fulfill: AnyFunc, to: NodeJS.Timeout|null = nil
    send_q.set(id, {
      msg,
      ff: (msg: ResponseDataType&{done?: boolean}) => {
        if(msg?.done) { delete msg.done; done=true; setTimeout(cleanup) }
        fulfill(msg)
      },
      sent_time: config.timer ? dnow() : nil
    }); send()
    while(!done) yield await new Promise<ResponseDataType>((ff, rj) => {
      to=timeout(rj); fulfill=ff
    }).catch(cleanup as any).finally(() => clearTO(to))
  }
  public route(handler: RouteHandler<T>) { this.router = handler }
  constructor(user_config: wsc.UserConfig) {
    this.config = processConfig(user_config)
    if(!this.config.lazy) this.connect()
  }
}