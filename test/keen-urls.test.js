'use strict'

const KeenQuery = require('../lib/index.js')
const expect = require('chai').expect

/* Keen API */
describe('generating URLS for keen-query: API', () => {

	it('should have api-compatible urls for basic queries', () => {
		const kq = KeenQuery.build('page:view->count()')
		return kq.print('url')
			.then(res => {
				expect(res).to.contain('event_collection=page%3Aview')
			})
	})

	it('should have api-compatible urls for timeframed queries', () => {
		const kq = KeenQuery.build('page:view->count()')
			.relTime('this_1_years')

		return kq.print('url')
			.then(res => {
				expect(res).to.contain('timeframe=this_1_years')
			})
	})

	it('should have api-compatible urls for intervalled queries', () => {
		const kq = KeenQuery.build('page:view->count()')
			.interval('month')

		return kq.print('url')
			.then(res => {
				expect(res).to.contain('interval=monthly')
			})
	})

	it('should have api-compatible urls for filtered queries', () => {
		const kq = KeenQuery.build('page:view->count()')
			.filter('user.uuid')

		return kq.print('url')
			.then(res => {
				expect(res).to.contain('filters=%5B%7B%22property_name%22%3A%22user.uuid%22%2C%22operator%22%3A%22exists%22%2C%22property_value%22%3Atrue%7D%5D')
			})
	})

	it('should have api-compatible urls for grouped queries', () => {
		const kq = KeenQuery.build('page:view->count()')
			.group('user.geo.continent')

		return kq.print('url')
			.then(res => {
				expect(res).to.contain('group_by=user.geo.continent')
			})
	})

	it('should have api-compatible urls for unique_count queries', () => {
		const kq = KeenQuery.build('page:view->count(user.uuid)')
		return kq.print('url')
			.then(res => {
				expect(res).to.contain('/queries/count_unique')
				expect(res).to.contain('event_collection=page%3Aview&target_property=user.uuid')
			})
	})
})


/* Keen explorer */
describe('generating URLS for keen-query: Explorer', () => {

	it('should have explorer-compatible urls for basic queries', () => {
		const kq = KeenQuery.build('page:view->count()')
		expect(kq.generateKeenUrl('/testing?','explorer')).to.contain('query[analysis_type]=count&query[event_collection]=page%3Aview')
	})

	it('should have explorer-compatible urls for timeframed queries', () => {
		const kq = KeenQuery.build('page:view->count()')
			.relTime('this_1_years')

		expect(kq.generateKeenUrl('/testing?','explorer')).to.contain('query[timeframe]=this_1_years')
	})

	it('should have explorer-compatible urls for intervalled queries', () => {
		const kq = KeenQuery.build('page:view->count()')
			.interval('month')

		expect(kq.generateKeenUrl('/testing?','explorer')).to.contain('query[interval]=monthly')
	})

	it('should have explorer-compatible urls for filtered queries', () => {
		const kq = KeenQuery.build('page:view->count()')
			.filter('user.uuid')

		expect(kq.generateKeenUrl('/testing?','explorer')).to.contain('query[filters][0][property_name]=user.uuid&query[filters][0][operator]=exists&query[filters][0][property_value]=true')
	})

	it('should have explorer-compatible urls for grouped queries', () => {
		const kq = KeenQuery.build('page:view->count()')
			.group('user.geo.continent')

		expect(kq.generateKeenUrl('/testing?','explorer')).to.contain('query[group_by]=user.geo.continent')
	})

	it('should have explorer-compatible urls for unique_count queries', () => {
		const kq = KeenQuery.build('page:view->count(user.uuid)')
		expect(kq.generateKeenUrl('/testing?','explorer')).to.contain('query[analysis_type]=count_unique&query[target_property]=user.uuid')
	})
})
