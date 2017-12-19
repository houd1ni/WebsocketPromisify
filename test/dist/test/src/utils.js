"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WS_1 = require("../../src/WS");
const axios_1 = require("axios");
const WS = require("ws");
const turnOn = async (port) => {
    await axios_1.default.get('http://127.0.0.1:8085/on/' + port);
    return true;
};
exports.turnOn = turnOn;
const shutDown = async (port) => {
    await axios_1.default.get('http://127.0.0.1:8085/off/' + port);
    return true;
};
exports.shutDown = shutDown;
const createNew = async (config, port = 8080) => {
    await turnOn(port);
    const ws = new WS_1.default(Object.assign({
        url: '127.0.0.1:' + port,
        adapter: (host, protocols) => new WS(host, protocols)
    }, config));
    return ws;
};
exports.createNew = createNew;
const is = t => (a, b) => t.is(JSON.stringify(a), JSON.stringify(b));
exports.is = is;
