"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const WS_1 = require("./WS");
exports.default = async () => {
    const app = express();
    const getPort = (req) => +req.originalUrl.split('/')[2] || 8080;
    app.get(/\/on\/.*/, async (req, res) => {
        const port = getPort(req);
        await WS_1.createServer(port);
        res.send('on');
    });
    app.get(/\/off\/.*/, async (req, res) => {
        const port = getPort(req);
        await WS_1.killServer(port);
        res.send('off');
    });
    app.listen(8085);
    return true;
};
