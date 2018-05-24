'use strict';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */













function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

// SHA1 has been taken from https://github.com/jbt/js-crypto
// Thank you, James, for this tiny implementation!

var SHA1 = (str1) => {
  for (
    var blockstart = 0,
      i = 0,
      W = [],
      A, B, C, D, F, G,
      H = [A=0x67452301, B=0xEFCDAB89, ~A, ~B, 0xC3D2E1F0],
      word_array = [],
      temp2,
      s = unescape(encodeURI(str1)),
      str_len = s.length;

    i <= str_len;
  ){
    word_array[i >> 2] |= (s.charCodeAt(i)||128) << (8 * (3 - i++ % 4));
  }
  word_array[temp2 = ((str_len + 8) >> 2) | 15] = str_len << 3;

  for (; blockstart <= temp2; blockstart += 16) {
    A = H; i = 0;

    for (; i < 80;
      A = [[
        (G = ((s = A[0]) << 5 | s >>> 27) + A[4] + (W[i] = (i<16) ? ~~word_array[blockstart + i] : G << 1 | G >>> 31) + 1518500249) + ((B = A[1]) & (C = A[2]) | ~B & (D = A[3])),
        F = G + (B ^ C ^ D) + 341275144,
        G + (B & C | B & D | C & D) + 882459459,
        F + 1535694389
      ][0|((i++) / 20)] | 0, s, B << 30 | B >>> 2, C, D]
    ) {
      G = W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16];
    }

    for(i = 5; i; ) H[--i] = H[i] + A[i] | 0;
  }

  for(str1 = ''; i < 40; )str1 += (H[i >> 3] >> (7 - i++ % 8) * 4 & 15).toString(16);
  return str1;
};

const add_event = (o, e, handler) => {
    return o.addEventListener(e, handler);
};
const once = (fn) => {
    let has_been_cached = false;
    let cached = null;
    return (...args) => {
        if (has_been_cached) {
            return cached;
        }
        else {
            has_been_cached = true;
            return cached = fn(...args);
        }
    };
};

const init = function (ws) {
    const config = this.config;
    this.open = true;
    this.onReadyQueue.forEach((fn) => fn());
    this.onReadyQueue = [];
    const { id_key, data_key } = config.server;
    // Send all pending messages.
    this.messages.forEach((message) => message.send());
    // It's reconnecting.
    if (this.reconnect_timeout !== null) {
        clearInterval(this.reconnect_timeout);
        this.reconnect_timeout = null;
    }
    add_event(ws, 'close', (e) => __awaiter(this, void 0, void 0, function* () {
        this.log('Closed.');
        this.open = false;
        this.onCloseQueue.forEach((fn) => fn());
        this.onCloseQueue = [];
        // Auto reconnect.
        const reconnect = config.reconnect;
        if (typeof reconnect === 'number' &&
            !isNaN(reconnect) &&
            !this.forcibly_closed) {
            const reconnectFunc = () => __awaiter(this, void 0, void 0, function* () {
                this.log('Trying to reconnect...');
                if (this.ws !== null) {
                    this.ws.close();
                    this.ws = null;
                }
                // If some error occured, try again.
                const status = yield this.connect();
                if (status !== null) {
                    this.reconnect_timeout = setTimeout(reconnectFunc, reconnect * 1000);
                }
            });
            // No need for await.
            reconnectFunc();
        }
        else {
            this.ws = null;
            this.open = null;
        }
        // reset the flag to reuse.
        this.forcibly_closed = false;
    }));
    add_event(ws, 'message', (e) => {
        try {
            const data = JSON.parse(e.data);
            if (data[id_key]) {
                const q = this.queue[data[id_key]];
                if (q) {
                    // Debug, Log.
                    const time = q.sent_time ? (Date.now() - q.sent_time) : null;
                    this.log('Message.', data[data_key], time);
                    // Play.
                    q.ff(data[data_key]);
                    clearTimeout(q.timeout);
                    delete this.queue[data[id_key]];
                }
            }
        }
        catch (err) {
            console.error(err, `JSON.parse error. Got: ${e.data}`);
        }
    });
};
// ---------------------------------------------------------------------------
const connectLib = function (ff) {
    if (this.open === true) {
        return ff(1);
    }
    const config = this.config;
    const ws = config.socket || config.adapter(`ws://${config.url}`, config.protocols);
    this.ws = ws;
    add_event(ws, 'error', once((e) => {
        this.ws = null;
        this.log('Error status 3.');
        // Some network error: Connection refused or so.
        return ff(3);
    }));
    // Because 'open' won't be envoked on opened socket.
    if (config.socket && ws.readyState === 1) {
        init.call(this, ws);
        ff(null);
    }
    else {
        add_event(ws, 'open', once((e) => {
            this.log('Opened.');
            init.call(this, ws);
            return ff(null);
        }));
    }
};

/*  .send(your_data) wraps request to server with {id: `hash`, data: `actually your data`},
    returns a Promise, that will be rejected after a timeout or
    resolved if server returns the same signature: {id: `same_hash`, data: `response data`}
*/
const sett = (a, b) => setTimeout(b, a);
const default_config = {
    data_type: 'json',
    // Debug features.
    log: ((event = '', time = 0, message = '') => null),
    timer: false,
    // Set up.
    url: 'localhost',
    timeout: 1400,
    reconnect: 2,
    lazy: false,
    socket: null,
    adapter: ((host, protocols) => new WebSocket(host, protocols)),
    protocols: [],
    pipes: [],
    server: {
        id_key: 'id',
        data_key: 'data'
    }
};
class WebSocketClient {
    constructor(user_config = {}) {
        this.open = null;
        this.ws = null;
        this.forcibly_closed = false;
        this.reconnect_timeout = null;
        this.queue = {};
        this.messages = [];
        this.onReadyQueue = [];
        this.onCloseQueue = [];
        this.config = {};
        // Config.
        const config = {};
        Object.assign(config, default_config);
        Object.assign(config, user_config);
        this.config = config;
        // Init.
        this.init_flush();
        // Flags.
        this.open = false;
        this.reconnect_timeout = null;
        this.forcibly_closed = false;
        if (!config.lazy) {
            this.connect();
        }
    }
    init_flush() {
        this.queue = {}; // data queuse
        this.messages = []; // send() queue
    }
    log(event, message = null, time = null) {
        const config = this.config;
        event = `WSP: ${event}`;
        if (time !== null) {
            config.log(event, time, message);
        }
        else {
            if (config.timer) {
                config.log(event, null, message);
            }
            else {
                config.log(event, message);
            }
        }
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((ff, rj) => {
                connectLib.call(this, ff);
            });
        });
    }
    get socket() {
        return this.ws;
    }
    ready() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((ff, rj) => {
                if (this.open) {
                    return true;
                }
                else {
                    this.onReadyQueue.push(ff);
                }
            });
        });
    }
    on(event_name, handler, predicate) {
        return add_event(this.ws, event_name, event => {
            if (!predicate || predicate(event)) {
                handler(event);
            }
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((ff, rj) => {
                if (this.ws === null) {
                    rj('WSP: closing a non-inited socket!');
                }
                else {
                    this.open = null;
                    this.onCloseQueue.push(() => {
                        this.init_flush();
                        this.ws = null;
                        this.forcibly_closed = true;
                        ff();
                    });
                    this.ws.close();
                }
            });
        });
    }
    send(user_message, opts = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log('Send.', user_message);
            const config = this.config;
            const message = {};
            const id_key = config.server.id_key;
            const data_key = config.server.data_key;
            const first_time_lazy = config.lazy && !this.open;
            // const data_type  = opts.data_type || config.data_type
            message[data_key] = user_message; // is_json ? JSON.stringify(user_message
            message[id_key] = SHA1('' + ((Math.random() * 1e5) | 0)).slice(0, 20);
            if (typeof opts.top === 'object') {
                if (opts.top[data_key]) {
                    throw new Error('Attempting to set data key/token via send() options!');
                }
                Object.assign(message, opts.top);
            }
            config.pipes.forEach((pipe) => message[data_key] = pipe(message[data_key]));
            if (this.open === true) {
                this.ws.send(JSON.stringify(message));
            }
            else if (this.open === false || first_time_lazy) {
                this.messages.push({
                    send: () => this.ws.send(JSON.stringify(message))
                });
                if (first_time_lazy) {
                    this.connect();
                }
            }
            else if (this.open === null) {
                throw new Error('Attempting to send via closed WebSocket connection!');
            }
            return new Promise((ff, rj) => {
                this.queue[message[id_key]] = {
                    ff,
                    data_type: config.data_type,
                    sent_time: config.timer ? Date.now() : null,
                    timeout: sett(config.timeout, () => {
                        if (this.queue[message[id_key]]) {
                            rj({
                                'Websocket timeout expired: ': config.timeout,
                                'for the message': message
                            });
                            delete this.queue[message[id_key]];
                        }
                    })
                };
            });
        });
    }
}

module.exports = WebSocketClient;
//# sourceMappingURL=ws.js.map
