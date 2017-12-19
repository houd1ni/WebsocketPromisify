"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const WS = require("ws");
/** If an existing socket connection is provided via config. */
const existing_socket = async (t) => {
    let done = false;
    const existing_addr = 'ws://localhost:8080';
    return new Promise(async (ff, rj) => {
        setTimeout(() => {
            if (!done) {
                ff(t.fail());
            }
        }, 3e3);
        // This one CANNOT connect as fast as we send to it,
        // So readyState is 0.
        const ws1 = await utils_1.createNew({
            socket: new WS(existing_addr)
        });
        utils_1.is(t)(ws1.socket.readyState, 0);
        const msg1 = { echo: true, msg: 'existing_socket!' };
        const response1 = await ws1.send(msg1);
        utils_1.is(t)(ws1.socket.readyState, 1);
        utils_1.is(t)(response1, msg1);
        await ws1.close();
        // This one DO CAN connect as fast as we send to it,
        // So readyState should be 1.
        const ws2_0 = new WS(existing_addr);
        ws2_0.addEventListener('open', async () => {
            const ws2 = await utils_1.createNew({
                socket: ws2_0
            });
            utils_1.is(t)(ws2.socket.readyState, 1);
            const msg2 = { echo: true, msg: 'existing_socket!' };
            const response2 = await ws2.send(msg2);
            utils_1.is(t)(ws2.socket.readyState, 1);
            utils_1.is(t)(response2, msg2);
            await ws2.close();
            ff();
            done = true;
        });
    });
};
exports.default = existing_socket;
