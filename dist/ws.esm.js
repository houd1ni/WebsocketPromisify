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

const init = (ws) => {
    const config = undefined.config;
    undefined.open = true;
    undefined.onReadyQueue.forEach((fn) => fn());
    undefined.onReadyQueue = [];
    const { id_key, data_key } = config.server;
    // Send all pending messages.
    undefined.messages.forEach((message) => message.send());
    // It's reconnecting.
    if (undefined.reconnect_timeout !== null) {
        clearInterval(undefined.reconnect_timeout);
        undefined.reconnect_timeout = null;
    }
    add_event(ws, 'close', (e) => __awaiter(undefined, void 0, void 0, function* () {
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
                const q = undefined.queue[data[id_key]];
                if (q) {
                    // Debug, Log.
                    const time = q.sent_time ? (Date.now() - q.sent_time) : null;
                    undefined.log('Message.', data[data_key], time);
                    // Play.
                    q.ff(data[data_key]);
                    clearTimeout(q.timeout);
                    delete undefined.queue[data[id_key]];
                }
            }
        }
        catch (err) {
            console.error(err, `JSON.parse error. Got: ${e.data}`);
        }
    });
};
const connectLib = function (add_event$$1, ff) {
    if (this.open === true) {
        return ff(1);
    }
    const config = this.config;
    const ws = config.socket || config.adapter(`ws://${config.url}`, config.protocols);
    this.ws = ws;
    add_event$$1(ws, 'error', once((e) => {
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
    add_event$$1(ws, 'open', once((e) => {
        this.log('Opened.');
        init.call(this, add_event$$1, ws);
        return ff(null);
    }));
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29ubmVjdExpYi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNyYy9jb25uZWN0TGliLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFHQSxPQUFPLEVBQ0wsSUFBSSxFQUNKLFNBQVMsRUFDVixNQUFNLE9BQU8sQ0FBQTtBQUVkLE1BQU0sSUFBSSxHQUFHLENBQUMsRUFBZ0IsRUFBRSxFQUFFO0lBQ2hDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUE7SUFDMUIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUE7SUFDaEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFDdkMsSUFBSSxDQUFDLFlBQVksR0FBRyxFQUFFLENBQUE7SUFDdEIsTUFBTSxFQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFBO0lBQ3hDLDZCQUE2QjtJQUM3QixJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUE7SUFDbEQscUJBQXFCO0lBQ3JCLEVBQUUsQ0FBQSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ25DLGFBQWEsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQTtRQUNyQyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFBO0lBQy9CLENBQUM7SUFFRCxTQUFTLENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBRSxDQUFPLENBQUMsRUFBRSxFQUFFO1FBQ2pDLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUE7UUFDbkIsSUFBSSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUE7UUFDakIsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxF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

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
                this.open = null;
                this.onCloseQueue.push(() => {
                    this.init_flush();
                    this.ws = null;
                    this.forcibly_closed = true;
                    ff();
                });
                this.ws.close();
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
            if (this.open === true) {
                this.ws.send(JSON.stringify(message));
            }
            else if (this.open === false || first_time_lazy) {
                this.messages.push({ send: () => this.ws.send(JSON.stringify(message)) });
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiV1MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzcmMvV1MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUNBLE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQTtBQUU1QixPQUFPLFVBQVUsTUFBTSxjQUFjLENBQUE7QUFDckMsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLE9BQU8sQ0FBQTtBQUVqQzs7O0VBR0U7QUFHRixNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7QUFFdkMsTUFBTSxjQUFjLEdBQWlCO0lBQ25DLFNBQVMsRUFBRSxNQUFNO0lBQ2pCLGtCQUFrQjtJQUNsQixHQUFHLEVBQUUsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFLEVBQUUsSUFBSSxHQUFHLENBQUMsRUFBRSxPQUFPLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUM7SUFDbkQsS0FBSyxFQUFFLEtBQUs7SUFDWixVQUFVO0lBQ1YsR0FBRyxFQUFFLFdBQVc7SUFDaEIsT0FBTyxFQUFFLElBQUk7SUFDYixTQUFTLEVBQUUsQ0FBQztJQUNaLElBQUksRUFBRSxLQUFLO0lBQ1gsTUFBTSxFQUFFLElBQUk7SUFDWixPQUFPLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsRUFBRSxDQUFDLElBQUksU0FBUyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztJQUM5RCxTQUFTLEVBQUUsRUFBRTtJQUNiLE1BQU0sRUFBRTtRQUNOLE1BQU0sRUFBRSxJQUFJO1FBQ1osUUFBUSxFQUFFLE1BQU07S0FDakI7Q0FDRixDQUFBO0FBR0Q7SUF3SEUsWUFBWSxXQUFXLEdBQUcsRUFBRTtRQXRIcEIsU0FBSSxHQUFHLElBQUksQ0FBQTtRQUNYLE9BQUUsR0FBRyxJQUFJLENBQUE7UUFDVCxvQkFBZSxHQUFHLEtBQUssQ0FBQTtRQUN2QixzQkFBaUIs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

export default WebSocketClient;
//# sourceMappingURL=ws.esm.js.map
