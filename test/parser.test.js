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
				params: [{
					"operator": "exists",
					"property_name": "condition",
					"property_value": true
				}]
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
				"aggregator": "@ratio",
				"body": [
					{
						"event": "coll",
						"functions": [
							{
								"func": "count",
								"params": []
							}
						],
						"postProcessing": [],
						"print": undefined
					},
					{
						"event": "coll",
						"functions": [
							{
								"func": "count",
								"params": [
									"user"
								]
							}
						],
						"postProcessing": [],
						"print": undefined
					}
				],
				"postProcessing": undefined,
				"print": undefined
			});
		});

		it('can do pct', function () {
			expect(parser('@pct(coll->count(),coll->count(user))')).to.deep.equal({
				"aggregator": "@pct",
				"body": [
					{
						"event": "coll",
						"functions": [
							{
								"func": "count",
								"params": []
							}
						],
						"postProcessing": [],
						"print": undefined
					},
					{
						"event": "coll",
						"functions": [
							{
								"func": "count",
								"params": [
									"user"
								]
							}
						],
						"postProcessing": [],
						"print": undefined
					}
				],
				"postProcessing": undefined,
				"print": undefined
			});
		});

		it('can do sums', function () {
			expect(parser('@sum(coll->count(),coll->count(user))')).to.deep.equal({
				"aggregator": "@sum",
				"body": [
					{
						"event": "coll",
						"functions": [
							{
								"func": "count",
								"params": []
							}
						],
						"postProcessing": [],
						"print": undefined
					},
					{
						"event": "coll",
						"functions": [
							{
								"func": "count",
								"params": [
									"user"
								]
							}
						],
						"postProcessing": [],
						"print": undefined
					}
				],
				"postProcessing": undefined,
				"print": undefined
			});
		});

		it('can do concatenation', function () {
			expect(parser('@concat(coll->count(),coll->count(user),coll2->avg(thing))')).to.deep.equal({
				"aggregator": "@concat",
				"body": [
					{
						"event": "coll",
						"functions": [
							{
								"func": "count",
								"params": []
							}
						],
						"postProcessing": [],
						"print": undefined
					},
					{
						"event": "coll",
						"functions": [
							{
								"func": "count",
								"params": [
									"user"
								]
							}
						],
						"postProcessing": [],
						"print": undefined
					},
					{
						"event": "coll2",
						"functions": [
							{
								"func": "avg",
								"params": [
									"thing"
								]
							}
						],
						"postProcessing": [],
						"print": undefined
					}
				],
				"postProcessing": undefined,
				"print": undefined
			});
		});

		it('can do funnels', function () {
			expect(parser('@funnel(coll->count(),coll->count(user),coll2->avg(thing))')).to.deep.equal({
				"aggregator": "@funnel",
				"body": [
					{
						"event": "coll",
						"functions": [
							{
								"func": "count",
								"params": []
							}
						],
						"postProcessing": [],
						"print": undefined
					},
					{
						"event": "coll",
						"functions": [
							{
								"func": "count",
								"params": [
									"user"
								]
							}
						],
						"postProcessing": [],
						"print": undefined
					},
					{
						"event": "coll2",
						"functions": [
							{
								"func": "avg",
								"params": [
									"thing"
								]
							}
						],
						"postProcessing": [],
						"print": undefined
					}
				],
				"postProcessing": undefined,
				"print": undefined
			});
		});

	});
	// nested aggregators
	// whitespace
	// the whole shebang
	// post processing - test the effect on a kq object
});
