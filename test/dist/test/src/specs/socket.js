"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
/** Socket property check. */
const sockets = async (t) => {
    const ws = await utils_1.createNew({});
    await ws.ready();
    if (ws.socket && !isNaN(ws.socket.readyState)) {
        t.pass();
    }
    else {
        t.fail();
    }
};
exports.default = sockets;
