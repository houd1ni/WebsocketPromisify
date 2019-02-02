import "./types";
declare const add_event: (o: wsc.Socket, e: string, handler: wsc.EventHandler) => void;
declare const once: (fn: Function) => (...args: any) => any;
export { add_event, once, };
