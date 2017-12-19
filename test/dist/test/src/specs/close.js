"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
/** Closes the connenction. */
const close = async (t) => {
    return new Promise(async (ff, rj) => {
        const ws = await utils_1.createNew({});
        setTimeout(async () => {
            await ws.close();
            if (ws.socket === null) {
                t.pass();
            }
            else {
                t.fail();
            }
            return ff();
        }, 500);
    });
};
exports.default = close;
