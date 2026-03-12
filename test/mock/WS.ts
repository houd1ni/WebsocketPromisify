
import WebSocket, { WebSocketServer } from 'ws'
import {add, compose, genBy, identity, noop, wait} from 'pepka'

let server: WebSocketServer|null = null

const createServer = (port = 40510) => new Promise<WebSocketServer>((ff, rj) => {
  if(server) return rj('The server is already running!')
  server = new WebSocketServer({ port }, () => {
    server!.on('connection', (socket: WebSocket&{isAlive: boolean}) => {
      socket.on('message', async (rawMessage: string) => {
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
          const chunks = genBy(compose(add(1), identity), 20) // Generate 20 chunks
          // console.log(chunks)
          const delay = 2 // 20ms delay between chunks for reliable delivery

          if(data.multi) {
            // Multi-chunk streaming
            for(const i in chunks) {
              const chunk = chunks[i]
              socket.send(JSON.stringify({
                id,
                data: {
                  ...data, chunk,
                  done: +i === chunks.length - 1 // Last chunk gets done: true
                }
              }))
              await wait(delay)
            }
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