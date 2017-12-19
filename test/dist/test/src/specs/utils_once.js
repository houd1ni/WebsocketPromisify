"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
/** Utils::once should cache a result and call a func just once. */
const once = async (t) => {
    return new Promise(async (ff, rj) => {
        const fn = (a) => a * 2;
        const cached = utils_1.once(fn);
        t.is(cached(5), cached(10));
        t.is(cached(25), 10);
        return ff();
    });
};
exports.default = once;
