import './specs/close'
import './specs/drops'
import './specs/echo'
import './specs/existing-socket'
import './specs/lazy'
import './specs/ready'
import './specs/reconnect'
import './specs/lazy-send-before-open'
import './specs/socket'
import './specs/no-native-throws'
import mockServer from './mock/server'
import {test} from './suite'

const {shutDown, isRunning} = await mockServer()
test.after(() => {
  setTimeout(async () => {
    if(isRunning()) await shutDown()
    process.exit()
  }, 100)
})
test.run()