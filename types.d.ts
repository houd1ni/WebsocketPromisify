

export = wsc


declare namespace wsc {

  /** Stuff that in use by this lib. */
  interface Socket {
    readyState: number
    send(...any: any[])
    close()
    addEventListener(event: string, handler: ((event: any) => any), ...any: any[])
  }

  export type AsyncErrCode = Promise<number | null | {}>
  
  export type EventHandler = (e: any) => void

  export type DataType = 'json' | 'string'

  export interface Config {
    data_type: DataType,
    log (event: string, time?: number, message?: any): void
    log (event: string, message?: any): void
    timer: boolean,
    url: string,
    timeout: number,
    reconnect: number,       // Reconnect timeout in seconds or null.
    lazy: boolean,
    socket: Socket,
    adapter: ((host: string, protocols?: string[]) => Socket),
    protocols: string[],
    server: {
      id_key: string,
      data_key: string
    }
  }

  export type UserConfig = Partial<Config>

  export interface SendOptions {
    top: any,
    data_type: DataType
  }

  export class WebSocketClient {
    on(
      event_name: string,
      handler: (event: string) => void,
      predicate?: (event: string) => boolean
    )
    close(): Promise<void | {}>
    send(user_message: any, opts: wsc.SendOptions): AsyncErrCode
    constructor(user_config: wsc.UserConfig)
  }
}