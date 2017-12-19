"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
/** Proof of work */
const echo = async (t) => {
    const ws = await utils_1.createNew({});
    await ws.ready();
    const msg = { echo: true, msg: 'hello!' };
    const response = await ws.send(msg);
    return utils_1.is(t)(response, msg);
};
exports.default = echo;
