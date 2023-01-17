
import express from 'express'
import { createServer, killServer } from './WS.js'
import net from 'net';

var portInUse = (port) => new Promise((ff) => {
  var server = net.createServer(function(socket) {
    socket.write('Echo server\r\n');
    socket.pipe(socket);
  });

  server.on('error', function (e) {
    ff(true);
  });
  server.on('listening', function (e) {
    server.close();
    ff(false);
  });

  server.listen(port, '127.0.0.1');
});

const ports = {}

export default async () => {
  const app = express()
  const getPort = (req) => +req.originalUrl.split('/')[2] || 8095

  app.get(/\/on\/.*/, async (req, res) => {
    const port = getPort(req)
    if(!ports[port]) {
      await createServer(getPort(req))
      ports[port] = true
    } else {
    }
    res.send('on')
  })

  app.get(/\/off\/.*/, async (req, res) => {
    const port = getPort(req)
    if(ports[port]) {
      await killServer(port)
      delete ports[port]
    } else {
    }
    res.send('off')
  })

  const port = 8000 + Math.ceil(Math.random()*500)
  app.listen(port, () => {});
  return port
}