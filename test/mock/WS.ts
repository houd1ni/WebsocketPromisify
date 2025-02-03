
import WebSocket, { WebSocketServer } from 'ws'
import {noop} from 'pepka'

let server: WebSocketServer|null = null

const createServer = (port = 40510) => new Promise<WebSocketServer>((ff, rj) => {
  if(server) return rj('The server is already running!')
  server = new WebSocketServer({ port }, () => {
    server!.on('connection', (socket: WebSocket&{isAlive: boolean}) => {
      socket.on('message', (rawMessage: string) => {
        const {id, data} = JSON.parse(rawMessage)
        let response = ''
        if(data.shut) {
          socket.terminate()
          socket.isAlive = false
          socket.ping('', false, noop)
          return null
        } else if(data.echo) {
          response = data
        }
        socket.send(JSON.stringify({ id, data: response }))
        return null
      })
      return true
    })
    return ff(server!)
  })
  server.on('', console.log)
})

const killServer = async () => new Promise<void>((ff, rj) => {
  if(server) {
    for(const socket of server.clients) socket.terminate()
    server.close(() => {
      server = null
      ff()
    })
  } else
    rj('The server is already down!')
  })

export { createServer, killServer }