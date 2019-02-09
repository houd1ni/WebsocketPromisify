/// <reference types="node" />
import './types';
declare const add_event: (o: wsc.Socket, e: string, handler: wsc.EventHandler) => void;
declare const once: (fn: Function) => (...args: any) => any;
declare const sett: (a: number, b: {
    (): void;
    (...args: any[]): void;
}) => NodeJS.Timeout;
export { add_event, once, sett };
