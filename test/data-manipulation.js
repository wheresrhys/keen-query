'use strict';

const KeenQuery = require('../lib');
KeenQuery.setConfig({
	KEEN_PROJECT_ID: 'test_proj',
	KEEN_READ_KEY: 'test_key'
});
// const expect = require('chai').expect;
const fetchMock = require('fetch-mock');
const mockKeenData = require('./helpers').mockKeenData;
const multiply = require('./helpers').multiply;
const testQuery = require('./helpers').testQuery;

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
					{"headings":["_headings",undefined],"rows":[["count potato",1],["count tomato",2],["count apple",3]]})
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
				return testQuery('potato->count()->group(prop0)->reorder(prop0,prop0-4,prop0-2)',
					{"headings":["prop0","count potato"],"rows":[["prop0-4",4],["prop0-2",2],["prop0-0",0],["prop0-1",1],["prop0-3",3]]});
			});

			it('should be possible to reorder a table', () => {
				fetchMock
					.mock(/potato/, mockKeenData(5,4));
				return testQuery('potato->count()->group(prop0,prop1)->reorder(prop1,prop1-3,prop1-2)->reorder(prop0,prop0-4,prop0-2)',
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

		describe('sorting', () => {
			it('should sort a column descending', () => {
				fetchMock
					.mock(/potato/, mockKeenData(5));
				return testQuery('potato->count()->group(prop0)->sortDesc()',
					{"headings":["prop0","count potato"],"rows":[["prop0-4",4],["prop0-3",3],["prop0-2",2],["prop0-1",1],["prop0-0",0]]});
			});

			it('should sort a column ascending', () => {
				fetchMock
					.mock(/potato/, {result:[
						{ prop0: 'prop0-0', result: 4 },
						{ prop0: 'prop0-1', result: 3 },
						{ prop0: 'prop0-2', result: 2 },
						{ prop0: 'prop0-3', result: 1 },
						{ prop0: 'prop0-4', result: 0 }
					]});
				return testQuery('potato->count()->group(prop0)->sortAsc()',
					{"headings":["prop0","count potato"],"rows":[["prop0-4",0],["prop0-3",1],["prop0-2",2],["prop0-1",3],["prop0-0",4]]});
			});

			it.skip('Should sort a table based on avg by default', function () {

			})

			it.skip('Should sort a table based on a custom reduction', function () {

			})
		});

		describe('cutoff', () => {
			it('should discard values smaller than a value', () => {
				fetchMock
					.mock(/potato/, mockKeenData(5));
				return testQuery('potato->count()->group(prop0)->cutoff(2)',
					{"headings":["prop0","count potato"],"rows":[["prop0-4",4],["prop0-3",3],["prop0-2",2]]});
			});

			it('should discard values smaller than a percentage of the total', () => {
				fetchMock
					.mock(/potato/, mockKeenData(8));
				return testQuery('potato->count()->group(prop0)->cutoff(10%)',
					{"headings":["prop0","count potato"],"rows":[["prop0-7",7],["prop0-6",6],["prop0-5",5],["prop0-4",4],["prop0-3",3]]})
			});

			it.skip('should figure out how to do cutoff for tables', () => {});

		});

		describe('top and bottom', () => {
			it('should show top n values', () => {
				fetchMock
					.mock(/potato/, mockKeenData(5));
				return testQuery('potato->count()->group(prop0)->top(2)',
					{"headings":["prop0","count potato"],"rows":[["prop0-4",4],["prop0-3",3]]});
			});

			it('should show top n percent of values', () => {
				fetchMock
					.mock(/potato/, mockKeenData(8));
				return testQuery('potato->count()->group(prop0)->top(40%)',
					{"headings":["prop0","count potato"],"rows":[["prop0-7",7],["prop0-6",6],["prop0-5",5]]});
			});

			it('should show bottom n values', () => {
				fetchMock
					.mock(/potato/, mockKeenData(5));
				return testQuery('potato->count()->group(prop0)->bottom(2)',
					{"headings":["prop0","count potato"],"rows":[["prop0-0",0],["prop0-1",1]]});
			});

			it('should show bottom n percent of values', () => {
				fetchMock
					.mock(/potato/, mockKeenData(8));
				return testQuery('potato->count()->group(prop0)->bottom(40%)',
					{"headings":["prop0","count potato"],"rows":[["prop0-0",0],["prop0-1",1],["prop0-2",2]]});
			});

			it.skip('should figure out how to do top and bottom for tables', () => {});
		});
	});

	const dateData = require('./fixtures/date');
	const dateDeviceData = require('./fixtures/date,device');
	const dateDeviceLayoutData = require('./fixtures/date,device,layout');

	describe('coping with timeframes', () => {

		it('can do complex stuff with data grouped by date', () => {
			fetchMock
				.mock(/page%3Aview/, dateData);
			return testQuery('page:view->count()->interval(d)->bottom(40%)',
				{"headings":["timeframe","count page:view"],"rows":[[{"start":"2016-03-26T00:00:00.000Z","end":"2016-03-27T00:00:00.000Z"},14114],[{"start":"2016-04-03T00:00:00.000Z","end":"2016-04-04T00:00:00.000Z"},14813],[{"start":"2016-04-02T00:00:00.000Z","end":"2016-04-03T00:00:00.000Z"},14916],[{"start":"2016-03-27T00:00:00.000Z","end":"2016-03-28T00:00:00.000Z"},14919],[{"start":"2016-03-25T00:00:00.000Z","end":"2016-03-26T00:00:00.000Z"},24718]]});
		});

		it('can do complex stuff with data grouped by date and another property', () => {
			fetchMock
				.mock(/page%3Aview.*group/, dateDeviceData)
				.mock(/page%3Aview/, dateData);
			return testQuery('@ratio(page:view->count()->group(device.primaryHardwareType), page:view->count())->interval(d)',
				{"headings":["timeframe","Desktop","Mobile Phone","Tablet"],"rows":[[{"start":"2016-03-26T00:00:00.000Z","end":"2016-03-27T00:00:00.000Z"},8.77235369137027,8.755703556752161,8.72644183080629],[{"start":"2016-03-27T00:00:00.000Z","end":"2016-03-28T00:00:00.000Z"},8.309203029693679,8.284670554326697,8.254038474428581],[{"start":"2016-03-28T00:00:00.000Z","end":"2016-03-29T00:00:00.000Z"},49.644446235692406,4.98617604384975,4.966749959696921],[{"start":"2016-03-29T00:00:00.000Z","end":"2016-03-30T00:00:00.000Z"},35.316627527349794,3.539864826164156,3.5276934532332893],[{"start":"2016-03-30T00:00:00.000Z","end":"2016-03-31T00:00:00.000Z"},36.014876516147886,3.614116615519509,3.5982756101125237],[{"start":"2016-03-31T00:00:00.000Z","end":"2016-04-01T00:00:00.000Z"},36.215702989505864,3.6339398571386576,3.6207119550839235],[{"start":"2016-04-01T00:00:00.000Z","end":"2016-04-02T00:00:00.000Z"},36.01712899359855,3.6136622723685363,3.5983455613691504],[{"start":"2016-04-02T00:00:00.000Z","end":"2016-04-03T00:00:00.000Z"},8.306717618664521,8.274403325288281,8.257240547063557],[{"start":"2016-04-03T00:00:00.000Z","end":"2016-04-04T00:00:00.000Z"},83.10571795044893,8.342739485586984,8.316883818267737],[{"start":"2016-04-04T00:00:00.000Z","end":"2016-04-05T00:00:00.000Z"},27.47109775105767,2.759318637274549,2.7445557782231127],[{"start":"2016-04-05T00:00:00.000Z","end":"2016-04-06T00:00:00.000Z"},28.025194811095712,2.8095962923415954,2.8001226798736853],[{"start":"2016-04-06T00:00:00.000Z","end":"2016-04-07T00:00:00.000Z"},27.968669946271906,2.8066015279635463,2.793384869987078],[{"start":"2016-04-07T00:00:00.000Z","end":"2016-04-08T00:00:00.000Z"},35.95086696779834,3.6051580941279324,3.592423138569139],[{"start":"2016-04-08T00:00:00.000Z","end":"2016-04-09T00:00:00.000Z"},0,0,0]]});
		});

		it('can concat data grouped by date to data grouped by date and another property', () => {
			fetchMock
				.mock(/page%3Aview.*group/, dateDeviceData)
				.mock(/page%3Aview/, dateData);
			return testQuery('@concat(page:view->count()->group(device.primaryHardwareType), page:view->count())->interval(d)->reorder(device.primaryHardwareType,count page:view)->relabel(device.primaryHardwareType,total)',
				{"headings":["timeframe","total","Desktop","Mobile Phone","Tablet"],"rows":[[{"start":"2016-03-26T00:00:00.000Z","end":"2016-03-27T00:00:00.000Z"},24718,123813,123578,123165],[{"start":"2016-03-27T00:00:00.000Z","end":"2016-03-28T00:00:00.000Z"},14114,123965,123599,123142],[{"start":"2016-03-28T00:00:00.000Z","end":"2016-03-29T00:00:00.000Z"},14919,1231778,123717,123235],[{"start":"2016-03-29T00:00:00.000Z","end":"2016-03-30T00:00:00.000Z"},24812,1233186,123605,123180],[{"start":"2016-03-30T00:00:00.000Z","end":"2016-03-31T00:00:00.000Z"},34918,1232249,123657,123115],[{"start":"2016-03-31T00:00:00.000Z","end":"2016-04-01T00:00:00.000Z"},34215,1232022,123623,123173],[{"start":"2016-04-01T00:00:00.000Z","end":"2016-04-02T00:00:00.000Z"},34019,1232182,123627,123103],[{"start":"2016-04-02T00:00:00.000Z","end":"2016-04-03T00:00:00.000Z"},34211,123903,123421,123165],[{"start":"2016-04-03T00:00:00.000Z","end":"2016-04-04T00:00:00.000Z"},14916,1231045,123581,123198],[{"start":"2016-04-04T00:00:00.000Z","end":"2016-04-05T00:00:00.000Z"},14813,1233727,123921,123258],[{"start":"2016-04-05T00:00:00.000Z","end":"2016-04-06T00:00:00.000Z"},44910,1233585,123670,123253],[{"start":"2016-04-06T00:00:00.000Z","end":"2016-04-07T00:00:00.000Z"},44017,1233726,123802,123219],[{"start":"2016-04-07T00:00:00.000Z","end":"2016-04-08T00:00:00.000Z"},44111,1233654,123711,123274],[{"start":"2016-04-08T00:00:00.000Z","end":"2016-04-09T00:00:00.000Z"},34315,1231140,123221,12360]]});
		});

		it.skip('can concat data grouped by property to data grouped by date and property', () => {
			fetchMock
				.mock(/page%3Aview.*group/, dateDeviceData);
			return testQuery('@concat(page:view->count()->group(device.primaryHardwareType), page:view->count()->group(device.primaryHardwareType)->reduce(max,timeframe))->interval(d)');
		});

		it('can do complex stuff with data grouped by date and other properties', () => {
			fetchMock
				.mock(/page%3Aview/, dateDeviceLayoutData)
			return testQuery('page:view->count()->group(device.primaryHardwareType,device.oGridLayout)->interval(d)->reduce(avg,device.oGridLayout)->reduce(max,timeframe)',
				{"headings":["device.primaryHardwareType","count page:view (avg: device.oGridLayout) (max: timeframe)"],"rows":[["Desktop",845967.5555555555],["Mobile Phone",82384.55555555556],["Tablet",88403.11111111111]]});

		});
	})
});
