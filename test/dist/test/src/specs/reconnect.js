"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const timers_1 = require("timers");
/** Reconnects if connection is broken. */
const reconnect = async (t) => {
    const port = 8082;
    return new Promise(async (ff, rj) => {
        const ws = await utils_1.createNew({
            reconnect: 1
        }, port);
        timers_1.setTimeout(async () => {
            await utils_1.shutDown(port);
            timers_1.setTimeout(async () => {
                await utils_1.turnOn(port);
                timers_1.setTimeout(async () => {
                    const msg = { echo: true, msg: 'hello!' };
                    const response = await ws.send(msg);
                    utils_1.is(t)(response, msg);
                    ff();
                }, 1500);
            }, 1100);
        }, 500);
    });
};
exports.default = reconnect;
