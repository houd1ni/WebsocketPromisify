import test from 'ava'
import * as specs from './specs'
// import mockServer from './mock/index'
import mock from './mock'
import * as _ from 'ramda'



;(async () => {

	// await mockServer()

	// console.log('Mock Server launched.')
	
	_.forEachObjIndexed((spec, name) => {
		test(name, spec)
	})(specs)

})()