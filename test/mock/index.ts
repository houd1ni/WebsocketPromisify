
import * as express from 'express'
import {
  createServer,
  killServer
} from './WS'

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

  try {
    app.listen(8085);
  } catch(e) {

  }

  return true
}