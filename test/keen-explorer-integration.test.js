const KeenQuery = require('../lib');
KeenQuery.setConfig({
	KEEN_PROJECT_ID: 'test_proj',
	KEEN_READ_KEY: 'test_key'
});
const expect = require('chai').expect

describe.skip('converting explorer urls into keen queries', () => {

});

describe.skip('converting keen api urls into keen queries', () => {

});

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
