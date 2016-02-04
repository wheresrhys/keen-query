'use strict'

const KeenQuery = require('../lib/index.js')
const expect = require('chai').expect

/* Keen explorer */
describe('generating URLS for keen-query: API', () => {

	it('should have api-compatible urls for basic queries', () => {
		const kq = KeenQuery.build('page:view->count()')
		return kq.print('url')
			.then(res => {
				expect(res).to.contain('&event_collection=page%3Aview')
			})
	})

// 	it('should have api-compatible urls for timeframed queries', () => {
// 		const kq = KeenQuery.build('page:view->count()')
// 			.relTime('this_1_years')

// 		return kq.print('url')
// 			.then(res => {
// 				expect(res).to.contain('&timeframe=this_1_years')
// 			})
// 	})

// 	it('should have api-compatible urls for intervalled queries', () => {
// 		const kq = KeenQuery.build('page:view->count()')
// 			.interval('month')

// 		return kq.print('url')
// 			.then(res => {
// 				expect(res).to.contain('&interval=monthly')
// 			})
// 	})

// 	it('should have api-compatible urls for filtered queries', () => {
// 		const kq = KeenQuery.build('page:view->count()')
// 			.filter('user.uuid')

// 		return kq.print('url')
// 			.then(res => {
// 				expect(res).to.contain('&filters=%5B%7B%22property_name%22%3A%22user.uuid%22%2C%22operator%22%3A%22exists%22%2C%22property_value%22%3Atrue%7D%5D')
// 			})
// 	})

// 	it('should have api-compatible urls for grouped queries', () => {
// 		const kq = KeenQuery.build('page:view->count()')
// 			.group('user.geo.continent')

// 		return kq.print('url')
// 			.then(res => {
// 				expect(res).to.contain('&group_by=user.geo.continent')
// 			})
// 	})
})

/* Keen explorer */
// describe('generating URLS for keen-query: Explorer', () => {

// 	it('should have explorer-compatible urls for basic queries', () => {
// 		const kq = KeenQuery.build('page:view->count()')
// 		return kq.print('explorer-url')
// 			.then(res => {
// 				expect(res).to.contain('query[analysis_type]=count&query[event_collection]=page%3Aview')
// 			})
// 	})

// 	it('should have explorer-compatible urls for timeframed queries', () => {
// 		const kq = KeenQuery.build('page:view->count()')
// 			.relTime('this_1_years')

// 		return kq.print('explorer-url')
// 			.then(res => {
// 				expect(res).to.contain('&query[timeframe]=this_1_years')
// 			})
// 	})

// 	it('should have explorer-compatible urls for intervalled queries', () => {
// 		const kq = KeenQuery.build('page:view->count()')
// 			.interval('month')

// 		return kq.print('explorer-url')
// 			.then(res => {
// 				expect(res).to.contain('&query[interval]=monthly')
// 			})
// 	})

// 	it('should have explorer-compatible urls for filtered queries', () => {
// 		const kq = KeenQuery.build('page:view->count()')
// 			.filter('user.uuid')

// 		return kq.print('explorer-url')
// 			.then(res => {
// 				expect(res).to.contain('&query[filters][0]=user.uuid&query[filters][0]=exists&query[filters][0]=true')
// 			})
// 	})

// 	it('should have explorer-compatible urls for grouped queries', () => {
// 		const kq = KeenQuery.build('page:view->count()')
// 			.group('user.geo.continent')

// 		return kq.print('explorer-url')
// 			.then(res => {
// 				expect(res).to.contain('&query[group_by]=user.geo.continent')
// 			})
// 	})
// })
