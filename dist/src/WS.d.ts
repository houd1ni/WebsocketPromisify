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
    private handlers;
    private config;
    private init_flush;
    private log;
    private connect;
    get socket(): any;
    ready(): Promise<void>;
    on(event_name: wsc.WSEvent, handler: (data: any) => any, predicate?: (data: any) => boolean, raw?: boolean): number | void;
    close(): wsc.AsyncErrCode;
    send<RequestDataType = any, ResponseDataType = any>(message_data: RequestDataType, opts?: wsc.SendOptions): Promise<ResponseDataType>;
    constructor(user_config?: wsc.UserConfig);
}
export default WebSocketClient;
