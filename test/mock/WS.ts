
import WebSocket, { WebSocketServer } from 'ws'
import {noop} from 'pepka'

let server: WebSocketServer|null = null

const createServer = (port = 40510) => new Promise<WebSocketServer>((ff, rj) => {
  if(server) return rj('The server is already running!')
  server = new WebSocketServer({ port }, () => {
    server!.on('connection', (socket: WebSocket&{isAlive: boolean}) => {
      socket.on('message', (rawMessage: string) => {
        // console.log({rawMessage: rawMessage.toString()})
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
          // Handle streaming responses
          const chunks = data.chunks || [1, 2, 3] // Default to 3 chunks
          const delay = data.delay || 100 // Default delay between chunks

          if(data.multi) {
            // Multi-chunk streaming
            chunks.forEach((chunk: any, index: number) => {
              setTimeout(() => {
                socket.send(JSON.stringify({
                  id,
                  data: {
                    ...data,
                    chunk: chunk,
                    done: index === chunks.length - 1 // Last chunk gets done: true
                  }
                }))
              }, index * delay)
            })
          } else {
            // Single response
            socket.send(JSON.stringify({
              id,
              data: {
                ...data,
                chunk: chunks[0],
                done: true
              }
            }))
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