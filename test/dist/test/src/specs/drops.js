"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const timers_1 = require("timers");
/** Rejects messages by timout */
const drops = async (t) => {
    return new Promise(async (ff, rj) => {
        const ws = await utils_1.createNew({
            timeout: 500
        }, 8090);
        await utils_1.shutDown(8090);
        timers_1.setTimeout(async () => {
            const msg = { echo: true, msg: 'hello!' };
            try {
                timers_1.setTimeout(() => {
                    t.fail();
                    return ff();
                }, 600);
                await ws.send(msg);
                t.fail();
                return ff();
            }
            catch (e) {
                t.pass();
                return ff();
            }
        }, 200);
    });
};
exports.default = drops;
