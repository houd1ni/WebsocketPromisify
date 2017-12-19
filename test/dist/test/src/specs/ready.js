"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
/** Ready method. */
const ready = async (t) => {
    const ws = await utils_1.createNew({});
    await ws.ready();
    if (ws.socket) {
        t.pass();
    }
    else {
        t.fail();
    }
};
exports.default = ready;
