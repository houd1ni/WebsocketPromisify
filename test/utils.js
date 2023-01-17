
import WSP from '../dist/bundle.mjs'
import axios from 'axios'
import WS from 'ws'

const turnOn = async (port = 8095) => {
  await axios.get('http://127.0.0.1:8085/on/' + port)
  return true
}

const shutDown = async (port = 8095) => {
  await axios.get('http://127.0.0.1:8085/off/' + port)
  return true
}

const createNew = async (config = {}, port = 8095) => {
  await turnOn(port)
  const ws = new WSP(Object.assign({
    url: '127.0.0.1:' + port,
    // log: (...a) => console.log(...a),
    adapter: (host, protocols) => new WS(host, protocols)
  }, config))

  return ws
}

export { createNew, turnOn, shutDown }