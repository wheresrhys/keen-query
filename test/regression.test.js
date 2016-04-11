const KeenQuery = require('../lib');
const Aggregator = require('../lib/aggregator');
const expect = require('chai').expect;
const fetchMock = require('fetch-mock');
const mockKeenData = require('./helpers').mockKeenData;
const sinon = require('sinon');
// const multiply = require('./helpers').multiply;
const testQuery = require('./helpers').testQuery;

describe('regression tests', () => {
	it('should clone kq objects successfully', () => {

		fetchMock
			.mock(/potato/, mockKeenData(2, 3));

		const kq = KeenQuery.build('potato->count()->group(prop0,prop1)');

		return kq
			.print('json')
			.then(data1 => {
				return kq.clone(true)
					.print()
					.then(data2 => {
						expect(data1).to.deep.equal(data2);
						expect(data1).to.not.equal(data2);
					})
					.then(fetchMock.restore);
			})
	})

	it('should clone aggregator objects successfully', () => {

		fetchMock
			.mock(/potato/, mockKeenData(2, 3));

		const kq = KeenQuery.build('@ratio(potato->count()->group(prop0,prop1),potato->count()->group(prop0,prop1))');

		return kq
			.print('json')
			.then(data1 => {
				return kq.clone(true)
					.print()
					.then(data2 => {
						expect(data1).to.deep.equal(data2);
						expect(data1).to.not.equal(data2);
					})
					.then(fetchMock.restore);
			})
	})

	it('should not print immediately when building simple query from string', () => {
		sinon.stub(KeenQuery.prototype, 'print');
		const kq = KeenQuery.build('potato->count()->group(prop0,prop1)->print(ascii)');
		expect(KeenQuery.prototype.print.called).to.be.false;
		expect(kq._printer).to.equal('ascii');
		KeenQuery.prototype.print.restore();
	})

	it('should not print immediately when building aggregate query from string', () => {
		fetchMock
			.mock(/potato/, mockKeenData(2, 3));
		sinon.spy(Aggregator.prototype, 'print');
		const kq = KeenQuery.build('@ratio(potato->count()->group(prop0,prop1),potato->count()->group(prop0,prop1))->print(ascii)');
		expect(Aggregator.prototype.print.called).to.be.false;
		kq.print();
		expect(kq._printer).to.equal('ascii');
		Aggregator.prototype.print.restore();
		fetchMock.restore();
	})

	it('should nest aggregator objects successfully when sharing methods', () => {

		fetchMock
			.mock(/potato/, mockKeenData({size: [3], props: ['timeframe']}));

		return testQuery('@concat(@ratio(potato->count(),potato->count()),@pct(potato->count(),potato->count()))->interval(d)->relabel(CONCATENATION_RESULT,Home,World)',
			{"headings":["timeframe","Home","World"],"rows":[["timeframe-0",0,0],["timeframe-1",0,0],["timeframe-2",0,0]]})
			.then(fetchMock.restore);
	});

	it('should allow filter-esque characters in filter strings', () => {

		fetchMock
			.mock(/potato/, {result: 2});

		return testQuery('potato->count()->filter(egg=anegg=)', {"rows":[["count potato",2]]})
			.then(fetchMock.restore);
	});

});
