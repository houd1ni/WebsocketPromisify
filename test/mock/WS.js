
import { WebSocketServer  } from 'ws'

let mockServer = {}

const createServer = (port = 40510) => {
  return new Promise((ff) => {
    if(mockServer[port] === undefined) {
      mockServer[port] = new WebSocketServer({ port }, () => {
        mockServer[port].on('connection', (socket) => {
          socket.on('message', (rawMessage) => {
            const {id, data} = JSON.parse(rawMessage)
            let response = ''
            if(data.shut) {
              socket.terminate()
              socket.isAlive = false
              socket.ping('', false, true)
              return null
            } else if(data.echo) {
              response = data
            }
            socket.send(JSON.stringify({
              id,
              data: response
            }))
            return null
          })
          return true
        })
        return ff(true)
      })
    } else {
      return ff(false)
    }
  })
}

const killServer = async (port = 40510) => {
  return new Promise((ff) => {
    if(mockServer[port]) {
      mockServer[port].close(() => {
        delete mockServer[port]
        ff()
      })
    } else {
      ff()
    }
  })
}

export { createServer, killServer }