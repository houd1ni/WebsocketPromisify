"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
/** Lazy connect */
const lazy = async (t) => {
    return new Promise(async (ff, rj) => {
        const ws = await utils_1.createNew({
            lazy: true
        });
        setTimeout(async () => {
            if (ws.socket !== null) {
                t.fail();
                ff();
            }
            else {
                const msg = { echo: true, msg: 'hello!' };
                const response = await ws.send(msg);
                utils_1.is(t)(response, msg);
                ff();
            }
        }, 500);
    });
};
exports.default = lazy;
