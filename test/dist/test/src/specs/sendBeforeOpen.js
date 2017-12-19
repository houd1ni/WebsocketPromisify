"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
/** Sends massages if they were .send() before connection is estabilished. */
const sendBeforeOpen = async (t) => {
    return new Promise(async (ff, rj) => {
        const ws = await utils_1.createNew({
            lazy: true
        });
        const msg = { echo: true, msg: 'hello!' };
        const response = await ws.send(msg);
        utils_1.is(t)(response, msg);
        ff();
    });
};
exports.default = sendBeforeOpen;
