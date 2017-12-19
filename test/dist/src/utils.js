"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const add_event = (o, e, handler) => {
    return o.addEventListener(e, handler);
};
exports.add_event = add_event;
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
exports.once = once;
