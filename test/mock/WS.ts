
import { noop, range, wait } from 'pepka'
import WebSocket, { WebSocketServer } from 'ws'

let server: WebSocketServer|null = null

const createServer = (port = 40510) => new Promise<WebSocketServer>((ff, rj) => {
  if(server) return rj('The server is already running!')
  server = new WebSocketServer({ port }, () => {
    server!.on('connection', (socket: WebSocket&{isAlive: boolean}) => {
      socket.on('message', async (rawMessage: string) => {
        const {id, data} = JSON.parse(rawMessage)
        let response = ''
        if(data.shut) {
          socket.terminate()
          socket.isAlive = false
          socket.ping('', false, noop)
          return null
        } else if(data.echo) {
          response = data
        } else if(data.stream) {
          const delay = data.delay || 150
          const len = 20
          for(const chunk of range(0, len)) {
            const is_last = !data.multi || chunk===len-1
            socket.send(JSON.stringify({ id,
              data: {
                name: data.name, chunk,
                [is_last ? 'done' : Symbol()]: is_last}
            }))
            await wait(delay)
            if(!data.multi) break
          }
          return null
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

