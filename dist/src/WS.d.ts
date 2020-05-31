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
    get socket(): any;
    ready(): Promise<unknown>;
    on(event_name: string, handler: (data: any) => any, predicate?: (data: any) => boolean): void;
    close(): wsc.AsyncErrCode;
    send<RequestDataType = any, ResponseDataType = any>(message_data: RequestDataType, opts?: wsc.SendOptions): Promise<ResponseDataType>;
    constructor(user_config?: wsc.UserConfig);
}
export default WebSocketClient;
