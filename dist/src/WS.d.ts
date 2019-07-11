import './types';
declare class WebSocketClient {
    private open;
    private ws;
    private forcibly_closed;
    private reconnect_timeout;
    private queue;
    private messages;
    private onReadyQueue;
    private onCloseQueue;
    private config;
    private init_flush;
    private log;
    private connect;
    readonly socket: any;
    ready(): Promise<unknown>;
    on(event_name: string, handler: (data: any) => any, predicate?: (data: any) => boolean): void;
    close(): wsc.AsyncErrCode;
    send(message_data: any, opts?: wsc.SendOptions): wsc.AsyncErrCode;
    constructor(user_config?: wsc.UserConfig);
}
export default WebSocketClient;
