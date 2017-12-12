

export = WebSocketClient


declare namespace WebSocketClient {
  
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
    adapter: ((host: string, protocols?: string[]) => any),
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
}


declare class WebSocketClient {
  on(
    event_name: string,
    handler: (event: string) => void,
    predicate?: (event: string) => boolean
  )
  send(user_message, opts: WebSocketClient.SendOptions): Promise<number | null>
  constructor(user_config: WebSocketClient.UserConfig)
}