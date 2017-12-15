
import * as WS from 'ws'


let mockServer: {[port: string]: any} = {}


const createServer = async (port = 6666) => {
  if(mockServer[port] === undefined) {
    mockServer[port] = new (WS as any).Server({ port })
    mockServer[port].on('connection', (socket) => {
      socket.on('message', (rawMessage: string): null => {
        const {id, data} = JSON.parse(rawMessage)
        // console.log(rawMessage)
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
    })
    return true
  } else {
    return false
  }
}

const killServer = async (port = 6666) => {
  return new Promise((ff, rj) => {
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

export {
  createServer,
  killServer
}