'use strict';

const __ = Symbol('Placeholder');
const countArgs = (s) => {
    let i = 0;
    for (const v of s)
        v !== __ && i++;
    return i;
};
// TODO: try to make it mutable.
// { 0: __, 1: 10 }, [ 11 ]
const addArgs = (args, _args) => {
    const len = args.length;
    const new_args = args.slice();
    const _args_len = _args.length;
    let _args_left = _args_len;
    let i = 0;
    for (; _args_left && i < len; i++) {
        if (new_args[i] === __) {
            new_args[i] = _args[_args_len - _args_left];
            _args_left--;
        }
    }
    for (i = len; _args_left; i++, _args_left--) {
        new_args[i] = _args[_args_len - _args_left];
    }
    return new_args;
};
const _curry = (fn, args, new_args) => {
    const args2add = fn.length - args.length - countArgs(new_args);
    if (args2add < 1) {
        return fn(...addArgs(args, new_args));
    }
    else {
        const curried = (...__args) => _curry(fn, addArgs(args, new_args), __args);
        curried.$args_left = args2add;
        return curried;
    }
};
const curry = (fn) => ((...args) => fn.length > countArgs(args)
    ? _curry(fn, [], args)
    : fn(...args));
const endlessph = (fn) => {
    function _endlessph(a) {
        return a === __ ? fn : fn(a);
    }
    return _endlessph;
};
const zero = 0;
function curry2(fn) {
    function curried2(a, ...args) {
        return args.length > zero
            ? a === __
                ? endlessph((a) => fn(a, args[zero]))
                : fn(a, args[zero])
            : (b) => fn(a, b);
    }
    return curried2;
}
function curry3(fn) {
    // type p0 = Parameters<Func>[0]
    // type p1 = Parameters<Func>[1]
    // type p2 = Parameters<Func>[2]
    // type ReturnT = ReturnType<Func>
    // TODO: optimize.
    // Cannot use ts-toolbelt due to this error:
    // Excessive stack depth comparing types 'GapsOf<?, L2>' and 'GapsOf<?, L2>'
    return curry(fn);
}

const length = (s) => s.length;
const is_typed_arr = (x) => ArrayBuffer.isView(x);

const unsafe_props = { '__proto__': true, 'constructor': true, 'prototype': true };
const undef = undefined;
const nul = null;
const inf$1 = Infinity;
const to = (s) => typeof s;
const isNull$1 = (s) => (s === nul);
const isUndef = (s) => (s === undef);
const isNum = (s) => (to(s) == 'number');
const isNil = (s) => (isNull$1(s) || isUndef(s));
const isSafe = (prop) => !(prop in unsafe_props);

const { isNaN } = Number;
// It's faster that toUpperCase() !
const caseMap = { u: 'U', b: 'B', n: 'N', s: 'S', f: 'F', o: 'O' };
const symbol = Symbol();
const cap_type = (t) => caseMap[t[0]] + t.slice(1);
const type = (s) => {
    const t = to(s);
    return t === 'object'
        ? isNull$1(s) ? 'Null' : (s.constructor?.name || cap_type(t))
        : t === 'number' && isNaN(s) ? 'NaN'
            : cap_type(t);
};
const typeIs = curry2((t, s) => type(s) === t);
const eq = curry2((a, b) => a === b);
const equals = curry2((a, b) => {
    if (a === b)
        return true;
    const typea = type(a);
    const ta = is_typed_arr(a);
    if (eq(typea, type(b)) && (eq(typea, 'Object') || eq(typea, 'Array') || ta)) {
        if (ta) {
            if (typea === 'Buffer')
                return a.equals(b);
            const len = length(a);
            if (len !== length(b))
                return false;
            for (let i = 0; i < len; i++)
                if (a[i] !== b[i])
                    return false;
            return true;
        }
        if (isNull$1(a) || isNull$1(b))
            return eq(a, b);
        for (const v of [a, b])
            for (const k in v)
                if (!(v === b && (k in a)) &&
                    !(v === a && (k in b) && equals(a[k], b[k])))
                    return false;
        return true;
    }
    return false;
});
const always = (s) => () => s;
const identity = (s) => s;
const z$1 = 0;
/* qflat, qflatShallow, qreduceAsync */
const qappend = curry2((s, xs) => { xs.push(s); return xs; });
const qreduce = curry3((fn, accum, arr) => arr.reduce(fn, accum));
// strategy is for arrays: 1->replace, 2->merge, 3->push.
const mergeDeep$1 = (strategy) => curry2((o1, o2) => {
    for (let k in o2) {
        if (isSafe(k))
            switch (type(o2[k])) {
                case 'Array':
                    if (strategy > 1 && type(o1[k]) === 'Array')
                        switch (strategy) {
                            case 2:
                                const o1k = o1[k], o2k = o2[k];
                                for (const i in o2k)
                                    if (o1k[i])
                                        mergeDeep$1(strategy)(o1k[i], o2k[i]);
                                    else
                                        o1k[i] = o2k[i];
                                break;
                            case 3: o1[k].push(...o2[k]);
                        }
                    else
                        o1[k] = o2[k];
                    break;
                case 'Object':
                    if (type(o1[k]) === 'Object') {
                        mergeDeep$1(strategy)(o1[k], o2[k]);
                        break;
                    }
                default:
                    o1[k] = o2[k];
                    break;
            }
    }
    return o1;
});
const qmergeDeep = mergeDeep$1(1);
/** Should be faster than .splice() 'cause does not make a new array. */
const rmel = (index, xs) => {
    const len = length(xs);
    for (let i = index; i < len; i++)
        xs[i] = xs[i + 1];
    xs.length = len - 1;
    return xs;
};
const seen = new Set();
const quniqWith = curry2((getter, xs) => {
    let size = length(xs), cur;
    for (let i = z$1; i < size; i++) {
        const x = xs[i];
        cur = getter(x);
        if (seen.has(cur)) {
            rmel(i, xs);
            size--;
            i--;
        }
        else
            seen.add(cur);
    }
    seen.clear();
    return xs;
});
quniqWith(identity);
const ifElse = curry((cond, pipeYes, pipeNo, s) => cond(s) ? pipeYes(s) : pipeNo(s));
const compose = ((...fns) => (...args) => {
    let first = true;
    let s;
    for (let i = length(fns) - 1; i > -1; i--) {
        if (first) {
            first = false;
            s = fns[i](...args);
        }
        else
            s = s === __ ? fns[i]() : fns[i](s);
    }
    return s;
});
const nth = curry2((i, data) => data[i]);
// FIXME: these types. Somewhere in curry2.
// const x = nth(0)([1,2,3])
// const y = nth(0)('123')
// const z = nth(0)(new Uint8Array([0,2,3]))
const slice = curry3((from, to, o) => o.slice(from, (isNum(to) ? to : inf$1)));
/** @returns first element of an array or a string. */
const head = nth(0);
/** @returns all elements of an array or a string after first one. */
slice(1, inf$1);
/**@param a @param b @returns a×b  */
const multiply = curry2((a, b) => a * b);
const find = curry2((fn, s) => s.find(fn));
const tap = curry2((fn, x) => { fn(x); return x; });
const T = always(true);
const F$1 = always(false);
const noop = (() => { });
/** @param cond (x, y): bool @param xs any[] @returns xs without duplicates, using cond as a comparator.  */
const uniqWith = curry2((cond, xs) => qreduce((accum, x) => find((y) => cond(x, y), accum) ? accum : qappend(x, accum), [], xs));
/** @param xs any[] @returns xs without duplicates.  */
uniqWith(equals);
const once = (fn) => {
    let done = false, cache;
    return function (...args) {
        if (done)
            return cache;
        done = true;
        return cache = fn(...args);
    };
};
const _pathOr = (_default, path, o) => length(path)
    ? isNil(o)
        ? _default
        : compose((k) => k in o ? _pathOr(_default, slice(1, inf$1, path), o[k]) : _default, head)(path)
    : o;
const pathOr = curry3(_pathOr); // it's more performant due to recursion there.
pathOr(undef);
compose(ifElse(equals(symbol), F$1, T), pathOr(symbol));

const t=Symbol("Placeholder"),r=r=>{let n=0;for(const e of r)e!==t&&n++;return n},n=(r,n)=>{const e=r.length,s=r.slice(),i=n.length;let o=i,c=0;for(;o&&c<e;c++)s[c]===t&&(s[c]=n[i-o],o--);for(c=e;o;c++,o--)s[c]=n[i-o];return s},e=(t,s,i)=>{const o=t.length-s.length-r(i);if(o<1)return t(...n(s,i));{const r=(...r)=>e(t,n(s,i),r);return r.$args_left=o,r}},s=t=>(...n)=>t.length>r(n)?e(t,[],n):t(...n);function i(r){return function(n,...e){return e.length>0?n===t?(r=>function(n){return n===t?r:r(n)})((t=>r(t,e[0]))):r(n,e[0]):t=>r(n,t)}}function o(t){return s(t)}const c=t=>t.length,l=/^(.*?)(8|16|32|64)(Clamped)?Array$/,u=void 0,a=1/0,f=t=>typeof t,h=t=>null===t,d=t=>"number"==f(t),b=t=>h(t)||(t=>t===u)(t),p={u:"U",b:"B",n:"N",s:"S",f:"F"},m=Symbol(),g=t=>{const r=f(t);return "object"===r?h(t)?"Null":t.constructor.name:p[r[0]]+r.slice(1)},A=i(((t,r)=>g(r)===t)),y=i(((t,r)=>t===r)),B=i(((t,r)=>{const n=g(t);if(y(n,g(r))&&(y(n,"Object")||y(n,"Array")||(e=n,l.test(e)))){if(h(t)||h(r))return y(t,r);if(y(t,r))return  true;for(const n of [t,r])for(const e in n)if(!(y(n,r)&&e in t||y(n,t)&&e in r&&B(t[e],r[e])))return  false;return  true}var e;return y(t,r)})),C=i(((t,r)=>(r.push(t),r))),z=o(((t,r,n)=>n.reduce(t,r))),S=s(((t,r,n,e)=>t(e)?r(e):n(e))),_=o(((t,r,n)=>S(t,r,q,n))),j=(...r)=>(...n)=>{let e,s=true;for(let i=c(r)-1;i>-1;i--)s?(s=false,e=r[i](...n)):e=e===t?r[i]():r[i](e);return e},v=i(((t,r)=>r[t])),w=o(((t,r,n)=>n.slice(t,d(r)?r:a))),N=v(0);w(1,a);const E=i(((t,r)=>r.find(t))),O=t=>()=>t,q=t=>t,x=i(((t,r)=>r.split(t))),F=O(true),I=O(false),M=i(((t,r)=>z(((r,n)=>E((r=>t(n,r)),r)?r:C(n,r)),[],r)))(B),P=(t,r,n)=>c(r)?b(n)?t:j((e=>e in n?P(t,w(1,a,r),n[e]):t),N)(r):n,U=o(P);U(u),j(S(B(m),I,F),U(m));const W=i(((t,r)=>r.map(t))),{floor:$}=Math,k="0123456789abcdefghijklmnopqrstuvwxyz",D=A("String"),G=_(D,x("")),H=j((t=>Object.fromEntries(t)),W(((t,r)=>[t,r])),G);class J{is_str;delim;abc;abclen;c2pos;standard;setABC(t,r=""){if(this.is_str=D(t),this.delim=r,!j(y(c(n=t)),c,M,G)(n))throw new Error("Not all chars are unique!");var n;this.abc=t,this.abclen=c(t),this.standard=!!this.is_str&&k.startsWith(t),this.c2pos=H(t);}zip(t){const{abc:r,abclen:n,delim:e}=this;let s="",i=true;for(;t>0;)s=r[t%n]+(i?"":e)+s,t=$(t/n),i=false;return s||"0"}unzip(t){const{standard:r,abclen:n,c2pos:e,delim:s,is_str:i}=this;if("0"===t)return 0;if(r)return parseInt(t,n);const o=i?t:t.split(s),l=c(o);let u=0;for(let t=0;t<l;t++)u+=e[o[t]]*n**(l-t-1);return u}constructor(t,r){r?this.setABC(t,r):this.setABC(t||k+"ABCDEFGHIJKLMNOPQRSTUVWXYZ");}}const K=new J;K.setABC.bind(K);K.zip.bind(K);K.unzip.bind(K);

const native_ws = (() => { try {
    return WebSocket || null;
}
catch {
    return null;
} })();
const add_event = (o, e, handler) => {
    return o.addEventListener(e, handler);
};
const rm_event = (o, e, handler) => {
    return o.removeEventListener(e, handler);
};
const sett = (a, b) => setTimeout(b, a);

const { min, random: random$1 } = Math;
const default_config = () => ({
    // Debug features.
    log: (() => null),
    timer: false,
    // Set up.
    url: '',
    timeout: 1.4,
    reconnect: {
        stop_after: 45,
        on_timeout: true,
        on_break: true,
        time_fn: ({ base, max, jitter }, attempt) => min(max, base ** (attempt + random$1() * jitter)),
        params: { base: 2, max: 20, jitter: .1 }
    },
    max_idle_time: Infinity,
    lazy: false,
    socket: null,
    adapter: ((host, protocols) => new WebSocket(host, protocols)),
    encode: (key, data, { server }) => JSON.stringify({
        [server.id_key]: key,
        [server.data_key]: data
    }),
    decode: (rawMessage) => JSON.parse(rawMessage),
    protocols: [], pipes: [],
    server: { id_key: 'id', data_key: 'data' },
    ping: { interval: 55, timeout: 30, out: 'ping', in: 'pong' }
});
const processConfig = (config) => {
    if (native_ws === null && !('adapter' in config))
        throw new Error(`
    This platform has no native WebSocket implementation.
    Please use 'ws' package as an adapter.
    See https://github.com/houd1ni/WebsocketPromisify/issues/23
  `);
    const full_config = qmergeDeep(default_config(), config);
    const url = full_config.url;
    if (url[0] == '/')
        try {
            const protocol = location.protocol.includes('s:') ? 'wss' : 'ws';
            full_config.url = `${protocol}://${location.hostname}:${location.port}${url}`;
        }
        catch (e) {
            throw new Error('WSP: URL starting with / in non-browser environment!');
        }
    return full_config;
};

const { random } = Math;
const MAX_32 = 2 ** 31 - 1;
const nil = null, inf = Infinity;
const resolved = Promise.resolve(nil);
const label_message = 'message';
const label_message_ext = 'message-ext';
const zipnum = new J();
const dnow = () => Date.now();
const now = () => dnow() / 1e3;
const ms = multiply(1e3);
const clearTO = (to) => to && clearTimeout(to);
const isNull = (x) => x === null;
const isStr = typeIs('String');
const isObj = typeIs('Object');
const timeout_rm = (q, ff, rj, timeout = .5) => {
    const timeout_ms = ms(timeout);
    const rm = setTimeout(() => {
        const i = q.indexOf(ff);
        if (~i) {
            q.splice(i);
            rj(`could not close in ${timeout_ms}ms!`);
        }
    }, timeout_ms * 1e3);
    q.push((...ps) => { clearTO(rm); ff(...ps); });
};
const genid = (q) => {
    const id = zipnum.zip((random() * (MAX_32 - 10)) | 0);
    return id in q ? genid(q) : id;
};
const call_q = (q, ...args) => {
    for (const fn of q)
        fn(...args);
    return q;
};
const clear_q = (q) => { q.splice(0); return q; };
const default_router = (d, next) => next(d);
class WebSocketClient {
    ws = nil;
    intentionally_closed = false;
    reconnect_timeout = nil;
    queue = {
        send: new Map(),
        on_ready: [],
        on_close: [],
        on_ready_fail: []
    };
    handlers = {
        open: [], close: [], message: [], [label_message_ext]: [], error: [], timeout: []
    };
    config = {};
    ping_timer = nil;
    idle_timer = nil;
    zombie_timer = nil;
    router = default_router;
    get opened() { return this.ws?.readyState === 1; } // The only opened state.
    call(event_name, ...args) {
        for (const h of this.handlers[event_name])
            h(...args);
    }
    log(event, message = nil, time = nil) {
        const { config } = this;
        setTimeout(() => {
            if (isNull(time))
                if (config.timer)
                    config.log(event, nil, message);
                else
                    config.log(event, message);
            else
                config.log(event, time, message);
        });
    }
    resetPing() {
        const { config: { ping }, ping_timer } = this;
        if (ping) {
            clearTO(ping_timer);
            this.ping_timer = sett(ms(ping.interval), async () => {
                const { ping_timer, opened } = this;
                if (opened) {
                    this.ws.send(ping.out);
                    this.resetPing();
                }
                else
                    clearTO(ping_timer);
            });
        }
    }
    resetZombieProbe() {
        const { config } = this;
        if (config.ping) {
            const z_timeout = config.ping.timeout;
            clearTO(this.zombie_timer);
            if (z_timeout !== Infinity)
                this.zombie_timer = sett(ms(z_timeout || config.timeout), () => this.close().catch(noop));
        }
    }
    // FIXME: Make some version where it could work faster (for streaming).
    resetIdle() {
        const { config: { max_idle_time: time }, idle_timer } = this;
        if (time !== Infinity) {
            clearTO(idle_timer);
            this.idle_timer = sett(ms(time), () => this.opened && this.close());
        }
    }
    _reconnecting = false;
    reconnect_start = 0;
    async reconnect(attempt = 0) {
        if (this._reconnecting && attempt === 0)
            return;
        this.log('reconnect');
        this._reconnecting = true;
        this.reconnect_start = now();
        if (!isNil(this.ws))
            this.terminate();
        const { queue } = this;
        if (attempt > 0 && isNil(await this.connect())) {
            clear_q(call_q(queue.on_ready));
            clear_q(queue.on_ready_fail);
            this._reconnecting = false;
            this.reconnect_timeout = nil;
        }
        else {
            const { stop_after, time_fn, params } = this.config.reconnect;
            if (now() - this.reconnect_start > stop_after) {
                this.terminate();
                clear_q(call_q(queue.on_ready_fail));
                clear_q(queue.on_ready);
                this._reconnecting = false;
                this.reconnect_timeout = nil;
            }
            else
                this.reconnect_timeout = sett(ms(time_fn(params, attempt)), this.reconnect.bind(this, attempt + 1));
        }
    }
    resetReconnect() {
        if (!isNull(this.reconnect_timeout)) {
            clearTO(this.reconnect_timeout);
            this.reconnect_timeout = nil;
        }
    }
    initSocket(ws) {
        const { queue, config, router } = this;
        this.ws = ws;
        clear_q(call_q(this.queue.on_ready));
        const { id_key, data_key } = config.server;
        // works also on previously opened sockets that do not fire 'open' event.
        this.call('open', ws);
        for (const { msg } of queue.send.values())
            ws.send(msg);
        this.resetReconnect();
        this.resetZombieProbe();
        this.resetPing();
        this.resetIdle();
        add_event(ws, 'close', async (...e) => {
            this.ws = nil;
            clear_q(call_q(queue.on_close));
            this.call('close', ...e);
            if (!this.intentionally_closed && config.reconnect.on_break)
                this.reconnect();
        });
        const { ping } = config;
        const handle_msg = (raw) => {
            try {
                const data = config.decode(raw);
                const { send: send_q } = this.queue;
                if (isObj(data) && id_key in data) {
                    const id = data[id_key];
                    if (send_q.has(id)) {
                        const q = send_q.get(id);
                        const d = data[data_key];
                        const time = q.sent_time ? (dnow() - q.sent_time) : nil;
                        this.log(label_message, d, time);
                        this.call(label_message, d);
                        q.ff(d);
                    }
                }
                else {
                    this.log(label_message_ext, data);
                    this.call(label_message_ext, { data });
                }
            }
            catch (err) {
                console.error(err, `WSP: Decode error. Got: ${raw}`);
            }
        };
        add_event(ws, label_message, (e) => {
            const raw = isStr(e.data) ? e.data : new Uint8Array(e.data);
            this.resetZombieProbe();
            this.resetPing();
            if (!ping || !equals(raw, ping.in))
                router(raw, handle_msg);
        });
    }
    _opening = false;
    /** returns status if won't open or null if ok. */
    connect() {
        if (this.opened || this._opening)
            return resolved;
        return this.opened || this._opening ? resolved : new Promise((ff) => {
            this._opening = true;
            const config = this.config;
            const ws = config.socket || config.adapter(config.url, config.protocols);
            if (isNil(ws) || ws.readyState > 1) {
                this._opening = false;
                this.ws = nil;
                this.log('error', 'ready() on closing or closed state! status 2.');
                return ff(2);
            }
            const ffo = once((s) => { this._opening = false; ff(s); });
            add_event(ws, 'error', once((e) => {
                this.ws = nil; // Some network error: Connection refused or so.
                this.log('error', 'status 3. Err: ' + (e.message || e));
                this.call('error', e);
                ffo(3);
            }));
            if (ws.readyState) { // Because 'open' won't be envoked on opened socket.
                this.initSocket(ws);
                ffo(nil);
            }
            else
                add_event(ws, 'open', once(() => {
                    this.log('open');
                    this.initSocket(ws);
                    ffo(nil);
                }));
        });
    }
    get socket() { return this.ws; }
    async ready(timeout = inf) {
        return new Promise((ff, rj) => {
            const { on_ready } = this.queue;
            if (this.config.lazy || this.opened)
                ff();
            else if (timeout === inf)
                on_ready.push(ff);
            else
                timeout_rm(on_ready, ff, rj);
        });
    }
    on(event_name, handler, predicate = T, raw = false) {
        const _handler = (event) => predicate(event) && handler(event);
        if (raw)
            add_event(this.ws, event_name, _handler);
        else
            this.handlers[event_name].push(_handler);
        return _handler;
    }
    off(event_name, handler, raw = false) {
        if (raw)
            return rm_event(this.ws, event_name, handler);
        const handlers = this.handlers[event_name];
        const i = handlers.indexOf(handler);
        if (~i)
            handlers.splice(i, 1);
    }
    terminate() {
        this.ws?.close();
        this.ws = nil;
        this.intentionally_closed = true;
    }
    async close(timeout = .5) {
        return new Promise((ff, rj) => {
            if (isNull(this.ws))
                ff(nil);
            else {
                timeout_rm(this.queue.on_close, ff, rj, timeout);
                this.terminate();
            }
        });
    }
    open() {
        if (!this.opened) {
            this.intentionally_closed = false;
            return this.connect();
        }
    }
    addEventListener(e, cb, opts = {}) { return this.on(e, cb, opts.predicate, opts.raw); }
    removeEventListener(e, handler, opts = {}) { return this.off(e, handler, opts.raw); }
    // TODO: Сделать сэттер элементов конфигурации чтобы двигать таймауты.
    // И эвент, когда схема наша, а соответствующего элемента очереди не ма.
    // Или добавить флажок к эвенту 'message'.F
    // И событие 'line' со значением on: boolean. Критерии?
    async prepareMessage(message_data, opts = {}) {
        this.log('send', message_data);
        const { config, queue: { send: send_q, on_ready_fail } } = this;
        const { pipes, server: { data_key } } = config;
        const { top } = opts;
        const id = genid(send_q);
        if (isObj(top) && data_key in top)
            throw new Error(`
      Attempting to set data key/token via send() options!
    `);
        for (const pipe of pipes)
            message_data = pipe(message_data);
        const [msg, err] = await Promise.all([
            config.encode(id, message_data, config),
            this.connect()
        ]);
        if (err)
            throw new Error('ERR while opening connection > ' + err);
        const timeout_time = top?.timeout || config.timeout;
        const cleanup = tap(() => send_q.delete(id));
        const timeout = (rj) => sett(ms(timeout_time), () => {
            if (send_q.has(id)) {
                this.call('timeout', message_data);
                cleanup();
                const reject = () => rj({
                    'Websocket timeout expired': timeout_time,
                    'for the message': message_data
                });
                if (config.reconnect.on_timeout) {
                    on_ready_fail.push(reject);
                    this.reconnect();
                }
                else
                    reject();
            }
        });
        const send = () => this.opened && (this.ws.send(msg),
            this.resetPing(),
            this.resetIdle());
        return { id, msg, timeout, cleanup, send };
    }
    /**  .send(your_data) wraps request to server with {id: `unique_id`, data: `actually your data`},
      returns a Promise that will be rejected after a timeout or
      resolved if server returns the same signature: {id: `same_hash`, data: `response data`}.
    */
    async send(message_data, opts = {}) {
        const { id, msg, timeout, cleanup, send } = await this.prepareMessage(message_data, opts);
        const { queue: { send: send_q }, config } = this;
        return new Promise((ff, rj) => {
            const to = timeout(rj);
            send_q.set(id, {
                msg,
                sent_time: config.timer ? dnow() : nil,
                ff(x) { clearTO(to); ff(x); }
            });
            send();
        }).finally(cleanup);
    }
    // TODO: stream timeouts in the config ?..
    async *stream(message_data, opts = {}) {
        const { id, msg, timeout, cleanup, send } = await this.prepareMessage(message_data, opts);
        const { queue: { send: send_q }, config } = this;
        let done = false, fulfill, to = nil;
        send_q.set(id, {
            msg,
            ff: (msg) => {
                if (msg?.done) {
                    delete msg.done;
                    done = true;
                    setTimeout(cleanup);
                }
                fulfill(msg);
            },
            sent_time: config.timer ? dnow() : nil
        });
        send();
        while (!done)
            yield await new Promise((ff, rj) => {
                to = timeout(rj);
                fulfill = ff;
            }).catch(cleanup).finally(() => clearTO(to));
    }
    route(handler) { this.router = handler; }
    constructor(user_config) {
        this.config = processConfig(user_config);
        if (!this.config.lazy)
            this.connect();
    }
}

exports.WebSocketClient = WebSocketClient;
