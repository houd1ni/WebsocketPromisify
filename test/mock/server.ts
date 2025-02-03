
import { WebSocketServer } from 'ws'
import { createServer, killServer } from './WS.js'

let port: number,
    server: WebSocketServer|null

export default async (new_port?: number) => {
  if(!server) {
    port = new_port || 8000 + Math.ceil(Math.random()*500)
    server = await createServer(port)
  }
  return {
    server, port,
    shutDown: async () => { await killServer(); server=null }
  }
}