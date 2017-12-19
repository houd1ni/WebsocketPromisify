
import * as express from 'express'
import {
  createServer,
  killServer
} from './WS'


export default async () => {
  
  const app = express()

  const getPort = (req) => +req.originalUrl.split('/')[2] || 40510

  app.get(/\/on\/.*/, async (req, res) => {
    const port = getPort(req)
    await createServer(port)
    res.send('on')
  })

  app.get(/\/off\/.*/, async (req, res) => {
    const port = getPort(req)
    await killServer(port)
    res.send('off')
  })

  app.listen(8085);

  return true
}