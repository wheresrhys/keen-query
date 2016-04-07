'use strict';

const KeenQuery = require('../lib');
const expect = require('chai').expect;
const fetchMock = require('fetch-mock');


// Numerical values always match coordinates e.g. the value in [1,0,3] will be 103
// for this reason avoid creating structures bigger than 10 in any direction (shouldn't be necessary anyway)
// opts takes
// size: [2, 3] - size of dimensions
// gapsAt: [[1,1],[2,2]] - location of any gaps in the table. Note
// can also pass in some numbers as arguments, which will be converted to {opts.size: [number, number, ...]}
function mockKeenData (opts) {
	if (typeof opts === 'number') {
		opts = {
			size: [].slice.call(arguments)
		}
	}
	const bucketeers = opts.size.map((n, i) => Array(n+1).join('.').split(''));
	let buckets = [{}];

	const props = opts.props || bucketeers.map((val, i) => `prop${i}`);

	bucketeers.forEach((axis, propIndex) => {
		const newBuckets = [];
		buckets.forEach(bucket => {
			axis.forEach((nonVal, i) => {
				const newPropObj = {};
				newPropObj[props[propIndex]] = `${i}`;
				newBuckets.push(Object.assign({}, bucket, newPropObj))
			})
		});
		buckets = newBuckets;
	});

	if (opts.gapsAt) {
		buckets = buckets.filter(bucket => {
			return !opts.gapsAt.some(gapCoords => {
				return gapCoords.every((val, i) => {
					return bucket[props[i]] === String(val);
				})
			})
		})
	}

	buckets.forEach(bucket => {
		let result = '';
		opts.size.forEach((length, i) => {
			result += bucket[props[i]];
			bucket[props[i]] = `${props[i]}-${bucket[props[i]]}`;
		});
		bucket.result = Number(result);
	});
	return {result: buckets};
}

function multiply (n, result) {
	result.result.forEach(bucket => {
		bucket.result = bucket.result * n;
	});
	return result;
}

// console.log(mockKeenData({
// 	size: [3, 4],
// 	gapsAt: [[1, 2], [2, 3]]
// }));
// console.log(mockKeenData(2))
function log (data) {
	console.log(JSON.stringify(data).replace('null', 'Infinity'))
	return data;
}

function testQuery (kq, expected) {
	const promise = KeenQuery.build(kq).print('json')
	if (!expected) {
		promise.then(log)
	}

	return promise
		.then(data => expect(data).to.deep.equal(expected))

}

describe('Data manipulation', () => {

	afterEach(() => fetchMock.restore());

	describe('aggregators', () => {
		describe('@ratio aggregator', () => {
			it('should calculate ratio of two numbers', () => {
				fetchMock
					.mock(/potato/, {result: 1})
					.mock(/tomato/, {result: 2});
				return testQuery('@ratio(potato->count(),tomato->count())',
					{"rows":[["count potato / count tomato",0.5]]})
			});

			it('should calculate ratio of column with number', () => {
				fetchMock
					.mock(/potato/, mockKeenData(3))
					.mock(/tomato/, {result: 2});

				return testQuery('@ratio(potato->count()->group(prop0),tomato->count())',
					{"headings":["prop0","count potato / count tomato"],"rows":[["prop0-0",0],["prop0-1",0.5],["prop0-2",1]]});
			});

			it('should calculate ratio of table with number', () => {
				fetchMock
					.mock(/potato/, mockKeenData(3, 2))
					.mock(/tomato/, {result: 2});
				return testQuery('@ratio(potato->count()->group(prop0,prop1),tomato->count())',
					{"headings":["prop0","prop1-0","prop1-1"],"rows":[["prop0-0",0,0.5],["prop0-1",5,5.5],["prop0-2",10,10.5]]});
			});

			it('should calculate ratio of column with column', () => {
				fetchMock
					.mock(/potato/, multiply(2, mockKeenData(3)))
					.mock(/tomato/, mockKeenData(3));
				return testQuery('@ratio(potato->count()->group(prop0),tomato->count()->group(prop0))',
					{"headings":["prop0","count potato / count tomato"],"rows":[["prop0-0",0],["prop0-1",2],["prop0-2",2]]});
			});

			it('should calculate ratio of table with column', () => {
				fetchMock
					.mock(/potato/, mockKeenData(3, 2))
					.mock(/tomato/, mockKeenData(3));
				return testQuery('@ratio(potato->count()->group(prop0,prop1),tomato->count()->group(prop0))',
					{"headings":["prop0","prop1-0","prop1-1"],"rows":[["prop0-0",0,Infinity],["prop0-1",10,11],["prop0-2",10,10.5]]});
			});

			it('should calculate ratio of table with second column', () => {
				fetchMock
					.mock(/potato/, mockKeenData(2, 3))
					.mock(/tomato/, mockKeenData({size: [3], props: ['prop1']}));
				return testQuery('@ratio(potato->count()->group(prop0,prop1),tomato->count()->group(prop1))',
					{"headings":["prop0","prop1-0","prop1-1","prop1-2"],"rows":[["prop0-0",0,1,1],["prop0-1",Infinity,11,6]]});

			});

			it('should calculate ratio of table with table', () => {
				fetchMock
					.mock(/potato/, mockKeenData(3, 2))
					.mock(/tomato/, multiply(2, mockKeenData(3, 2)));
				return testQuery('@ratio(potato->count()->group(prop0,prop1),tomato->count()->group(prop0,prop1))',
					{"headings":["prop0","prop1-0","prop1-1"],"rows":[["prop0-0",0,0.5],["prop0-1",0.5,0.5],["prop0-2",0.5,0.5]]});
			});

			it('should cope with gaps in results', () => {
				fetchMock
					.mock(/potato/, mockKeenData({size: [3, 3], gapsAt: [[2,2]]}))
					.mock(/tomato/, multiply(2, mockKeenData({size: [3, 3], gapsAt: [[1,1]]})));
				return testQuery('@ratio(potato->count()->group(prop0,prop1),tomato->count()->group(prop0,prop1))',
					{"headings":["prop0","prop1-0","prop1-1","prop1-2"],"rows":[["prop0-0",0,0.5,0.5],["prop0-1",0.5,0,0.5],["prop0-2",0.5,0.5,0]]})
			});

			describe('percent variant', () => {
				it('should return result as percentage', () => {
					fetchMock
						.mock(/potato/, multiply(0.2, mockKeenData(2, 3)))
						.mock(/tomato/, mockKeenData({size: [3], props: ['prop1']}));
					return testQuery('@pct(potato->count()->group(prop0,prop1),tomato->count()->group(prop1))',
						{"headings":["prop0","prop1-0","prop1-1","prop1-2"],"rows":[["prop0-0",0,20,20],["prop0-1",Infinity,220,120]]});
				});
			});

			describe.skip('error handling', () => {
				it('should throw sensibly when dividing number by column', () => {

				});

				it('should throw sensibly when dividing number by table', () => {

				});

				it('should throw sensibly when dividing column by table', () => {

				});

				it('should throw sensibly when dividing things grouped on different properties', () => {

				});
			})

		});

		describe('@concat aggregator', () => {

			it('should concatenate single results together', () => {
				fetchMock
					.mock(/potato/, {result: 1})
					.mock(/tomato/, {result: 2})
					.mock(/apple/, {result: 3});
				return testQuery('@concat(potato->count(),tomato->count(),apple->count())',
					{"headings":["CONCATENATION_RESULT",undefined],"rows":[["count potato",1],["count tomato",2],["count apple",3]]})
			});


			it('should concatenate single results on to column', () => {
				fetchMock
					.mock(/potato/, mockKeenData(3))
					.mock(/tomato/, {result: 2})
					.mock(/apple/, {result: 3});
				return testQuery('@concat(potato->count()->group(prop0),tomato->count(),apple->count())',
					{"headings":["prop0","count potato"],"rows":[["prop0-0",0],["prop0-1",1],["prop0-2",2],["count tomato",2],["count apple",3]]})
			});

			it('should concatenate columns together', () => {
				fetchMock
					.mock(/potato/, mockKeenData(3))
					.mock(/tomato/, multiply(10, mockKeenData(3)))
					.mock(/apple/, multiply(100, mockKeenData(3)));
				return testQuery('@concat(potato->count()->group(prop0),tomato->count()->group(prop0),apple->count()->group(prop0))',
					{"headings":["prop0","count potato","count tomato","count apple"],"rows":[["prop0-0",0,0,0],["prop0-1",1,10,100],["prop0-2",2,20,200]]})
			});

			it('should concatenate columns on to table', () => {
				fetchMock
					.mock(/potato/, mockKeenData(3, 2))
					.mock(/tomato/, multiply(10, mockKeenData(3)))
					.mock(/apple/, multiply(100, mockKeenData(3)));
				return testQuery('@concat(potato->count()->group(prop0,prop1),tomato->count()->group(prop0),apple->count()->group(prop0))',
					{"headings":["prop0","prop1-0","prop1-1","count tomato","count apple"],"rows":[["prop0-0",0,1,0,0],["prop0-1",10,11,10,100],["prop0-2",20,21,20,200]]})
			});

			it('should cope with missing values column + column', () => {
				fetchMock
					.mock(/potato/, mockKeenData({size: [4], gapsAt: [[2]]}))
					.mock(/tomato/, multiply(2, mockKeenData({size: [4], gapsAt: [[1]]})));
				return testQuery('@concat(potato->count()->group(prop0),tomato->count()->group(prop0))',
					{"headings":["prop0","count potato","count tomato"],"rows":[["prop0-0",0,0],["prop0-1",1,0],["prop0-3",3,6]]});
			});

			it('should cope with missing values table + column', () => {
				fetchMock
					.mock(/potato/, mockKeenData({size: [4, 3], gapsAt: [[2,0],[2,1],[2,2]]}))
					.mock(/tomato/, multiply(2, mockKeenData({size: [4], gapsAt: [[1]]})));
				return testQuery('@concat(potato->count()->group(prop0,prop1),tomato->count()->group(prop0))',
					{"headings":["prop0","prop1-0","prop1-1","prop1-2","count tomato"],"rows":[["prop0-0",0,1,2,0],["prop0-1",10,11,12,4],["prop0-3",30,31,32,6]]});
			});

			describe.skip('error handling', () => {
				// should bail if columns grouped on different property
				// shoudl bail if concatenating column on to number
				// shoudl bail if concatenating number on to table
				// shoudl bail if concatenating table on to anything

			})

		});

		describe.skip('@sum aggregator', () => {

		});

		describe.skip('@subtract aggregator', () => {

		});
	});

	describe('post-processing', () => {
		describe('reduce', () => {
			it.skip('will error when trying to reduce a number', () => {
				fetchMock
					.mock(/potato/, {result: 1});
				// return testQuery('potato->count()->reduce(max)',
			});

			it('will reduce a column', () => {
				fetchMock
					.mock(/potato/, mockKeenData(3));
				return testQuery('potato->count()->group(prop0)->reduce(sum,prop0)',
					{"rows":[["count potato (sum: prop0)",3]]})
			});


			it('will reduce a table by first dimension', () => {
				fetchMock
					.mock(/potato/, mockKeenData(3, 3));
				return testQuery('potato->count()->group(prop0,prop1)->reduce(sum,prop0)',
					{"headings":["prop1","count potato (sum: prop0)"],"rows":[["prop1-0",30],["prop1-1",33],["prop1-2",36]]});
			});

			it('will reduce a table by second dimension', () => {
				fetchMock
					.mock(/potato/, mockKeenData(3, 3));
				return testQuery('potato->count()->group(prop0,prop1)->reduce(sum,prop1)',
					{"headings":["prop0","count potato (sum: prop1)"],"rows":[["prop0-0",3],["prop0-1",33],["prop0-2",63]]});
			});

			it('will reduce a higher order table by choice of dimension', () => {
				fetchMock
					.mock(/potato/, mockKeenData(3, 3, 4));
				return testQuery('potato->count()->group(prop0,prop1,prop2)->reduce(sum,prop1)',
					{"headings":["prop0","prop2-0","prop2-1","prop2-2","prop2-3"],"rows":[["prop0-0",30,33,36,39],["prop0-1",330,333,336,339],["prop0-2",630,633,636,639]]});
			});

			it('will average', () => {
				fetchMock
					.mock(/potato/, mockKeenData(8));
				return testQuery('potato->count()->group(prop0)->reduce(avg,prop0)',
					{"rows":[["count potato (avg: prop0)",3.5]]})
			});

			it('will sum', () => {
				fetchMock
					.mock(/potato/, mockKeenData(8));
				return testQuery('potato->count()->group(prop0)->reduce(sum,prop0)',
					{"rows":[["count potato (sum: prop0)",28]]})
			});

			it('will find minimum', () => {
				fetchMock
					.mock(/potato/, mockKeenData(8));
				return testQuery('potato->count()->group(prop0)->reduce(min,prop0)',
					{"rows":[["count potato (min: prop0)",0]]})
			});

			it('will find maximum', () => {
				fetchMock
					.mock(/potato/, mockKeenData(8));
				return testQuery('potato->count()->group(prop0)->reduce(max,prop0)',
					{"rows":[["count potato (max: prop0)",7]]})
			});

			it('will find median', () => {
				fetchMock
					.mock(/potato/, mockKeenData(7));
				return testQuery('potato->count()->group(prop0)->reduce(median,prop0)',
					{"rows":[["count potato (median: prop0)",3]]})
			});

			it.skip('will find nth percentile', () => {
				fetchMock
					.mock(/potato/, mockKeenData(8));
				return testQuery('potato->count()->group(prop0)->reduce(pct,25,prop0)',
					{"rows":[["count potato (sum: prop0)",2]]})
			});

			it('will calculate % change between last two values', () => {
				fetchMock
					.mock(/potato/, mockKeenData(6));
				return testQuery('potato->count()->group(prop0)->reduce(%change,prop0)',
					{"rows":[["count potato (%change: prop0)",25]]})
			});

			it('will calculate trend', () => {
				fetchMock
					.mock(/potato/, multiply(5, mockKeenData(8)));
				return testQuery('potato->count()->group(prop0)->reduce(trend,prop0)',
					{"rows":[["count potato (trend: prop0)", 5]]})
			});

			describe('reduce all', () => {

				it('will calculate all trivial reductions on a column', () => {
					fetchMock
						.mock(/potato/, mockKeenData(3));
					return testQuery('potato->count()->group(prop0)->reduce(all,prop0)',
						{"headings":[undefined,"count potato"],"rows":[["avg",1],["min",0],["max",2],["median",1],["sum",3],["trend",1],["%change",100]]})
				})

				it('will calculate all trivial reductions on a table', () => {
					fetchMock
						.mock(/potato/, mockKeenData(3, 3));
					return testQuery('potato->count()->group(prop0,prop1)->reduce(all,prop0)',
						{"headings":["prop1","avg","min","max","median","sum","trend","%change"],"rows":[["prop1-0",10,0,20,10,30,10,100],["prop1-1",11,1,21,11,33,10,90.9090909090909],["prop1-2",12,2,22,2,36,5,1000]]});
				})
			})

			it('will append result to existing table if requested', () => {
				fetchMock
					.mock(/potato/, mockKeenData(3));
				return testQuery('potato->count()->group(prop0)->reduce(sum,prop0,true)',
					{"headings":["prop0","count potato"],"rows":[["prop0-0",0],["prop0-1",1],["prop0-2",2],["count potato (sum: prop0)",3]]})
			});
		})

		describe('round()', () => {

			it('will round to zero places by default', () => {
				fetchMock
						.mock(/potato/, multiply(16/3, mockKeenData(3,3)));
					return testQuery('potato->count()->group(prop0,prop1)->round()',
						{"headings":["prop0","prop1-0","prop1-1","prop1-2"],"rows":[["prop0-0",0,5,11],["prop0-1",53,59,64],["prop0-2",107,112,117]]})
			});

			it('will round to positive number of places', () => {
				fetchMock
						.mock(/potato/, multiply(16/3, mockKeenData(3,3)));
					return testQuery('potato->count()->group(prop0,prop1)->round(2)',
						{"headings":["prop0","prop1-0","prop1-1","prop1-2"],"rows":[["prop0-0",0,5.33,10.67],["prop0-1",53.33,58.67,64],["prop0-2",106.67,112,117.33]]})
			});

			it('will round to zero places', () => {
				fetchMock
						.mock(/potato/, multiply(16/3, mockKeenData(3,3)));
					return testQuery('potato->count()->group(prop0,prop1)->round(0)',
						{"headings":["prop0","prop1-0","prop1-1","prop1-2"],"rows":[["prop0-0",0,5,11],["prop0-1",53,59,64],["prop0-2",107,112,117]]})
			});

			it('will round to nearest 10, 100 etc', () => {
				fetchMock
						.mock(/potato/, multiply(163457/3, mockKeenData(3,3)));
					return testQuery('potato->count()->group(prop0,prop1)->round(-2)',
						{"headings":["prop0","prop1-0","prop1-1","prop1-2"],"rows":[["prop0-0",0,54500,109000],["prop0-1",544900,599300,653800],["prop0-2",1089700,1144200,1198700]]})
			});

		});

		describe('multiply and divide', () => {
			it('will multiply all results by some value', () => {
				fetchMock
						.mock(/potato/, mockKeenData(3,3));
					return testQuery('potato->count()->group(prop0,prop1)->multiply(3.7)',
						{"headings":["prop0","prop1-0","prop1-1","prop1-2"],"rows":[["prop0-0",0,3.7,7.4],["prop0-1",37,40.7,44.400000000000006],["prop0-2",74,77.7,81.4]]})
			});

			it('will divide all results by some value', () => {
				fetchMock
						.mock(/potato/, mockKeenData(3,3));
					return testQuery('potato->count()->group(prop0,prop1)->divide(1000)',
						{"headings":["prop0","prop1-0","prop1-1","prop1-2"],"rows":[["prop0-0",0,0.001,0.002],["prop0-1",0.01,0.011,0.012],["prop0-2",0.02,0.021,0.022]]})
			});
		});

		describe('presentational stuff', () => {

			it('should be possible to reorder a column', () => {
				fetchMock
						.mock(/potato/, mockKeenData(5));
					return testQuery('potato->count()->group(prop0)->sortProp(prop0,prop0-4,prop0-2)',
						{"headings":["prop0","count potato"],"rows":[["prop0-4",4],["prop0-2",2],["prop0-0",0],["prop0-1",1],["prop0-3",3]]});
			});

			it('should be possible to reorder a table', () => {
				fetchMock
						.mock(/potato/, mockKeenData(5,4));
					return testQuery('potato->count()->group(prop0,prop1)->sortProp(prop1,prop1-3,prop1-2)->sortProp(prop0,prop0-4,prop0-2)',
						{"headings":["prop0","prop1-3","prop1-2","prop1-0","prop1-1"],"rows":[["prop0-4",43,42,40,41],["prop0-2",23,22,20,21],["prop0-0",3,2,0,1],["prop0-1",13,12,10,11],["prop0-3",33,32,30,31]]});
			});

			it('should be possible to relabel a column', () => {
				fetchMock
						.mock(/potato/, mockKeenData(5));
					return testQuery('potato->count()->group(prop0)->relabel(prop0,cat,dog,mouse)',
						{"headings":["prop0","count potato"],"rows":[["cat",0],["dog",1],["mouse",2],["prop0-3",3],["prop0-4",4]]});
			});

			it('should be possible to relabel a table', () => {
				fetchMock
						.mock(/potato/, mockKeenData(5,4));
					return testQuery('potato->count()->group(prop0,prop1)->relabel(prop1,cat,dog,mouse)',
						{"headings":["prop0","cat","dog","mouse","prop1-3"],"rows":[["prop0-0",0,1,2,3],["prop0-1",10,11,12,13],["prop0-2",20,21,22,23],["prop0-3",30,31,32,33],["prop0-4",40,41,42,43]]});
			});

			it('should be possible to plot a threshold', () => {
				fetchMock
						.mock(/potato/, mockKeenData({size: [5], props: ['timeframe']}));
					return testQuery('potato->count()->group(prop0)->interval(d)->plotThreshold(180,limit)',
						{"headings":["timeframe","undefined","limit"],"rows":[["timeframe-0",0,180],["timeframe-1",0,180],["timeframe-2",0,180],["timeframe-3",0,180],["timeframe-4",0,180]]});
			});
		});
// - `sort(dimension, value)` **TODO (please request)**
// - `sortAsc([reduction,dimension])`
// - `sortDesc([reduction,dimension])`
// -cutoff
// - `sortProp(property,value1,value2,...)` Sorts rows in the result according to values in the `property` axis, in the order given


// test-threshold:
// 	node ./bin/keen-query.js 'cta:click->count()->group(page.location.type)->interval(d)->relTime(3)->threshold(5000,minimumlevel)'
// test-sort:
// 	node ./bin/keen-query.js 'page:view->count()->group(page.location.type,device.oGridLayout)->relTime(3)->sortDesc(min,device.oGridLayout)'
// 	node ./bin/keen-query.js 'page:view->count(user.uuid)->group(device.oGridLayout)->sortProp(device.oGridLayout,default,XS,S,M,L,XL,XXL)'
// 	node ./bin/keen-query.js 'page:view->count(user.uuid)->group(device.oGridLayout)->interval(d)->sortProp(device.oGridLayout,default,XS,S,M,L,XL,XXL)'
// 	node ./bin/keen-query.js 'page:view->count(user.uuid)->group(device.oGridLayout)->group(page.location.type)->sortProp(device.oGridLayout,default,XS,S,M,L,XL,XXL)'
// 	# node ./bin/keen-query.js 'cta:click->count()->group(page.location.type)->relTime(3)->sortAsc()'
// 	# node ./bin/keen-query.js 'cta:click->count(user.uuid)->interval(d)->group(page.location.type)->relTime(3)->reduce(all)'
// 	# node ./bin/keen-query.js '@ratio(cta:click->count(),cta:click->count(user.uuid))->interval(d)->group(page.location.type)->relTime(3)'
// 	# node ./bin/keen-query.js '@ratio(cta:click->count(),cta:click->count(user.uuid))->interval(d)->group(page.location.type)->relTime(3)->reduce(avg)'


// test-cutoff:
// 	node ./bin/keen-query.js 'cta:click->count()->filter(user.uuid)->group(page.location.type)->relTime(3)->top(2)'
// 	node ./bin/keen-query.js 'cta:click->count()->filter(user.uuid)->group(page.location.type)->relTime(3)->top(20,percent)'
// 	node ./bin/keen-query.js 'cta:click->count()->filter(user.uuid)->group(page.location.type)->relTime(3)->bottom(2)'
// 	node ./bin/keen-query.js 'cta:click->count()->filter(user.uuid)->group(page.location.type)->relTime(3)->bottom(20,percent)'
// 	node ./bin/keen-query.js 'cta:click->count()->filter(user.uuid)->group(page.location.type)->relTime(3)->cutoff(10000)'

// test-err:
// 	node ./bin/keen-query.js '@pct(site:optout->count(user.uuid)->group(device.oGridLayout),page:view->count(user.uuid)->group(device.oGridLayout)->filter(device.oGridLayout?L,M))->round()->interval(d)'

	});
});
