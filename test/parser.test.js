const expect = require('chai').expect;
const parser = require('../lib/parser');

describe('Parsing keen queries', function () {
	describe('simple queries', function () {
		it('identifies collection name', function () {
			expect(parser('coll->count(user)').event).to.equal('coll');
			expect(parser('CO-LL:it->count(user)').event).to.equal('CO-LL:it');
		});

		it('expects collection name', function () {
			expect(() => parser('->count(user)')).to.throw;
		});

		it('expects extraction', function () {
			expect(() => parser('coll')).to.throw;
			expect(() => parser('coll->filter(red)')).to.throw;
		});

		it('allows with extraction', function () {
			expect(parser('coll->with(user)').functions[0]).to.deep.equal({
				func: 'with',
				params: ['user']
			})
		})
		it('allows min extraction', function () {
			expect(parser('coll->min(user)').functions[0]).to.deep.equal({
				func: 'min',
				params: ['user']
			})
		})
		it('allows max extraction', function () {
			expect(parser('coll->max(user)').functions[0]).to.deep.equal({
				func: 'max',
				params: ['user']
			})
		})
		it('allows sum extraction', function () {
			expect(parser('coll->sum(user)').functions[0]).to.deep.equal({
				func: 'sum',
				params: ['user']
			})
		})
		it('allows avg extraction', function () {
			expect(parser('coll->avg(user)').functions[0]).to.deep.equal({
				func: 'avg',
				params: ['user']
			})
		})
		it('allows count extraction', function () {
			expect(parser('coll->count()').functions[0]).to.deep.equal({
				func: 'count',
				params: []
			})
		})

		it('allows count unique extraction', function () {
			expect(parser('coll->count(user)').functions[0]).to.deep.equal({
				func: 'count',
				params: ['user']
			})
		})
		it('allows select extraction', function () {
			expect(parser('coll->select(user)').functions[0]).to.deep.equal({
				func: 'select',
				params: ['user']
			})
		})
		it('allows median extraction', function () {
			expect(parser('coll->median(user)').functions[0]).to.deep.equal({
				func: 'median',
				params: ['user']
			})
		})
		it.skip('allows percentile extraction', function () {
			expect(parser('coll->percentile(user, 12)').functions[0]).to.deep.equal({
				func: 'percentile',
				params: ['user', 12]
			})
		})

		it('allows filters', function () {
			expect(parser('coll->count()->filter(condition)').functions[1]).to.deep.equal({
				func: 'filter',
				params: ['condition']
			})
		})

		it('allows grouping', function () {
			expect(parser('coll->count()->group(prop)').functions[1]).to.deep.equal({
				func: 'group',
				params: ['prop']
			})
		})

		it('allows multiple grouping', function () {
			expect(parser('coll->count()->group(prop1,prop2)').functions[1]).to.deep.equal({
				func: 'group',
				params: ['prop1', 'prop2']
			})
		})
	})

	describe('aggregators', function () {
		it('can do ratios', function () {
			expect(parser('@ratio(coll->count(),coll->count(user))')).to.deep.equal({
				"type": 'AggregateQuery',
				'functions': [],
				"aggregator": "ratio",
				"body": [
					{
						"type": 'KeenQuery',
						"event": "coll",
						"functions": [
							{
								"func": "count",
								"params": []
							}
						]
					},
					{
						"type": 'KeenQuery',
						"event": "coll",
						"functions": [
							{
								"func": "count",
								"params": [
									"user"
								]
							}
						]
					}
				]
			});
		});

		it('can do pct', function () {
			expect(parser('@pct(coll->count(),coll->count(user))')).to.deep.equal({
				"type": 'AggregateQuery',
				'functions': [],
				"aggregator": "pct",
				"body": [
					{
						"type": 'KeenQuery',
						"event": "coll",
						"functions": [
							{
								"func": "count",
								"params": []
							}
						]
					},
					{
						"type": 'KeenQuery',
						"event": "coll",
						"functions": [
							{
								"func": "count",
								"params": [
									"user"
								]
							}
						]
					}
				]
			});
		});

		it('can do sums', function () {
			expect(parser('@sum(coll->count(),coll->count(user))')).to.deep.equal({
				"type": 'AggregateQuery',
				'functions': [],
				"aggregator": "sum",
				"body": [
					{
						"type": 'KeenQuery',
						"event": "coll",
						"functions": [
							{
								"func": "count",
								"params": []
							}
						]
					},
					{
						"type": 'KeenQuery',
						"event": "coll",
						"functions": [
							{
								"func": "count",
								"params": [
									"user"
								]
							}
						]
					}
				]
			});
		});

		it('can do concatenation', function () {
			expect(parser('@concat(coll->count(),coll->count(user),collTwo->avg(thing))')).to.deep.equal({
				"type": 'AggregateQuery',
				'functions': [],
				"aggregator": "concat",
				"body": [
					{
						"type": 'KeenQuery',
						"event": "coll",
						"functions": [
							{
								"func": "count",
								"params": []
							}
						]
					},
					{
						"type": 'KeenQuery',
						"event": "coll",
						"functions": [
							{
								"func": "count",
								"params": [
									"user"
								]
							}
						]
					},
					{
						"type": 'KeenQuery',
						"event": "collTwo",
						"functions": [
							{
								"func": "avg",
								"params": [
									"thing"
								]
							}
						]
					}
				]
			});
		});

		it('can do funnels', function () {
			expect(parser('@funnel(coll->count(),coll->count(user),collTwo->avg(thing))')).to.deep.equal({
				"type": 'AggregateQuery',
				'functions': [],
				"aggregator": "funnel",
				"body": [
					{
						"type": 'KeenQuery',
						"event": "coll",
						"functions": [
							{
								"func": "count",
								"params": []
							}
						]
					},
					{
						"type": 'KeenQuery',
						"event": "coll",
						"functions": [
							{
								"func": "count",
								"params": [
									"user"
								]
							}
						]
					},
					{
						"type": 'KeenQuery',
						"event": "collTwo",
						"functions": [
							{
								"func": "avg",
								"params": [
									"thing"
								]
							}
						]
					}
				]
			});
		});

	});
	it.skip('nested aggregators', () => {});
	it.skip('whitespace', () => {});
	it.skip('the whole shebang', () => {});
	it.skip('post processing - test the effect on a kq object', () => {});
	it.skip('filter parsing', () => {});

// test-query:
// 	node ./bin/keen-query.js 'cta:click->count(user.uuid)->relTime(3)'
// 	node ./bin/keen-query.js 'cta:click->count()->filter(user.uuid)->relTime(3)'
// 	node ./bin/keen-query.js 'cta:click->count()->filter(user.uuid!?12,11,14)->interval(2_d)->relTime(6)';
// 	node ./bin/keen-query.js 'cta:click->count()->filter(user.uuid)->interval(d)->group(page.location.type)->relTime(3)';
// 	node ./bin/keen-query.js 'cta:click->count()->filter(user.uuid)->interval(day)->group(page.location.type)->relTime(3)';
// 	node ./bin/keen-query.js 'cta:click->count()->filter(user.uuid)->group(page.location.type,user.isStaff)->relTime(3)';
// 	node ./bin/keen-query.js 'cta:click->count()->filter(user.uuid)->group(page.location.type,user.isStaff)->relTime(3)->round()';
// 	node ./bin/keen-query.js 'cta:click->count()->filter(user.uuid)->interval(2_d)->relTime(6)';
// 	node ./bin/keen-query.js 'cta:click->count(user.uuid)->relTime(3)->filter(user.uuid!~f0bb6f11)'

// test-trim:
// 	node ./bin/keen-query.js 'cta:click->count(user.uuid)->relTime(3)'
// 	node ./bin/keen-query.js 'cta:click -> count (user.uuid) -> relTime(3)'
// 	node ./bin/keen-query.js ' @ratio ( cta:click -> count (user.uuid) -> relTime(3) , cta:click -> count (user.uuid) -> relTime(3) ) ->interval(d)'



});
