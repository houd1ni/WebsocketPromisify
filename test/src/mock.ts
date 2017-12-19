
import mockServer from './mock/index'

(async () => {

	await mockServer()

	return console.log('Mock Server launched.')

})()

export default null