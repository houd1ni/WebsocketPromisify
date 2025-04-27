declare namespace wsc {

  interface DataObject {
    [key: string]: any
  }

  export type WSEvent = 'open' | 'message' | 'close' | 'error' | 'timeout'

  /** Minimal socket-like interface. */
  interface Socket {
    readyState: number
    send(...any: any[]): void
    close(): void
    addEventListener(event: string, handler: ((event: any) => any), ...any: any[]): void
  }

  export type AsyncErrCode = Promise<number | null | {}>
  
  export type EventHandler = (e: any) => void

  export type DataPipe = (message: any) => any

  export type DataType = 'json' | 'string'

  export interface Config {
    data_type: DataType
    log (event: string, time?: number|null, message?: any): void
    log (event: string, message?: any): void
    timer: boolean
    url: string
    timeout: number
    reconnect: number
    lazy: boolean
    socket: Socket | null
    adapter: (host: string, protocols?: string[]) => Socket
    encode: (key: string, message: any, config: Config) => any
    decode: (rawMessage: any) => {
      [id_or_data_key: string]: string
    }
    protocols: string[]
    pipes: DataPipe[]
    server: {
      id_key: string
      data_key: string
    },
    ping: {
      interval: number
      content: any
    }
  }

  export type UserConfig = Partial<Config>

  export interface SendOptions {
    top: any
    data_type: DataType
  }

  export interface Message {
    msg: any, ff(x: any): any,
    data_type: DataType,
    sent_time: number | null,
    timeout: NodeJS.Timeout
  }
}