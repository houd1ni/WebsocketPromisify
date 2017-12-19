"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WS = require("ws");
let mockServer = {};
const createServer = async (port = 8089) => {
    return new Promise((ff, rj) => {
        if (mockServer[port] === undefined) {
            mockServer[port] = new WS.Server({ port }, (result, code, name) => {
                console.log({ result, code, name });
                console.log('!!!! makeServer!');
                mockServer[port].on('error', (err) => console.log('!!! ERROR: ', err));
                mockServer[port].on('close', () => console.log('!!! CLOSED!: '));
                mockServer[port].on('connection', (socket) => {
                    console.log('!!!! connection!');
                    socket.on('message', (rawMessage) => {
                        const { id, data } = JSON.parse(rawMessage);
                        // console.log(rawMessage)
                        let response = '';
                        if (data.shut) {
                            socket.terminate();
                            socket.isAlive = false;
                            socket.ping('', false, true);
                            return null;
                        }
                        else if (data.echo) {
                            response = data;
                        }
                        socket.send(JSON.stringify({
                            id,
                            data: response
                        }));
                        return null;
                    });
                    return true;
                });
                return ff(true);
            });
        }
        else {
            return ff(false);
        }
    });
};
exports.createServer = createServer;
const killServer = async (port = 8089) => {
    return new Promise((ff, rj) => {
        if (mockServer[port]) {
            mockServer[port].close(() => {
                delete mockServer[port];
                ff();
            });
        }
        else {
            ff();
        }
    });
};
exports.killServer = killServer;
