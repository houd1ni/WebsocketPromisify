import './specs/close'
import './specs/drops'
import './specs/echo'
import './specs/existing_socket'
import './specs/lazy'
import './specs/ready'
import './specs/reconnect'
import './specs/lazySendBeforeOpen'
import './specs/socket'
import './specs/no-native-throws'
import mockServer from './mock/server'
import {test} from './suite'

const {shutDown} = await mockServer()
test.after(() => {
  setTimeout(async () => {
    await shutDown()
    process.exit()
  }, 100)
})
test.run()