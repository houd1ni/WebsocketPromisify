
import WSP from '../../src/WS'
import axios from 'axios'
import * as WS from 'ws'


const turnOn = async (port: number) => {
  await axios.get('http://localhost:8085/on/' + port)
  return true
}

const shutDown = async (port: number) => {
  await axios.get('http://localhost:8085/off/' + port)
  return true
}

const createNew = async (config, port = 6666): Promise<WSP> => {
  await turnOn(port)
  const ws = new WSP(Object.assign({
    url: 'localhost:' + port,
    adapter: (host, protocols) => new (WS as any)(host, protocols)
  }, config))

  return ws
}


const is = t => (a, b) => t.is(JSON.stringify(a), JSON.stringify(b))



export {
  createNew,
  turnOn,
  shutDown,
  is
}