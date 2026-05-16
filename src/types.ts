

declare namespace wsc {

  interface DataObject {
    [key: string]: any
  }

  export type WSEvent = 'open' | 'message' | 'message-ext' | 'close' | 'error' | 'timeout' | 'reconnect' | 'send' | 'ping'

  /** Minimal socket-like interface. */
  interface Socket {
    readyState: number
    send(...any: any[]): void
    close(): void
    addEventListener: WebSocket["addEventListener"]
    removeEventListener: WebSocket["removeEventListener"]
  }

  export type AsyncErrCode = Promise<number | null | {}>

  export type EventHandler = (e: any) => void
  export type Predicate = (data: any) => boolean

  export type DataPipe = (message: any) => any

  export interface TimeFnParams { base: number, max: number, jitter: number }

  export interface Config {
    log (event: string, time?: number|null, message?: any): void
    log (event: string, message?: any): void
    timer: boolean
    url: string
    timeout: number
    reconnect: {
      stop_after: number
      on_timeout: boolean
      on_break: boolean
      time_fn: import('pepka').AnyFunc<number, [params: wsc.TimeFnParams, attempt: number]>
      params: { base: number, max: number, jitter: number }
    } | false
    max_idle_time: number
    lazy: boolean
    socket: Socket | null
    adapter: (host: string, protocols?: string[]) => Socket
    encode: (key: string, message: any, config: Config) => any
    decode: (rawMessage: any) => { [id_or_data_key: string]: string }
    protocols: string[]
    pipes: DataPipe[]
    server: {
      id_key: string
      data_key: string
    },
    ping: {
      interval: number
      timeout?: number
      in:  string|Uint8Array
      out: string|Uint8Array
    } | false
  }

  export type UserConfig =
    import('type-fest').PartialDeep<Config> &
    ( {socket: Config['socket']} | Pick<Config, 'url'> )
    

  export type SendOptions = Partial<{
    top: any
  }>

  export interface Message {
    msg: any, ff(x: any): any,
    sent_time: number | null
  }
}