'use strict';

const KeenQuery = require('../lib');
const expect = require('chai').expect;
const fetchMock = require('fetch-mock');


// Numerical values always match coordinates e.g. the value in [1,0,3] will be 103
// for this reason avoid creating structures bigger than 10 in any direction (shouldn't be necessary anyway)
// opts takes
// size: [2, 3] - size of dimensions
// gapsAt: [[1,1],[2,2]] - location of any gaps in the table. Note
function mockKeenData (opts) {
	const bucketeers = opts.size.map((n, i) => Array(n+1).join('.').split(''));
	let buckets = [{}];

	bucketeers.forEach((axis, propIndex) => {
		const newBuckets = [];
		buckets.forEach(bucket => {
			axis.forEach((nonVal, i) => {
				const newPropObj = {};
				newPropObj[`prop${propIndex}`] = `${i}`;
				newBuckets.push(Object.assign({}, bucket, newPropObj))
			})
		});
		buckets = newBuckets;
	});

	if (opts.gapsAt) {
		buckets = buckets.filter(bucket => {
			return !opts.gapsAt.some(gapCoords => {
				return gapCoords.every((val, i) => {
					return bucket[`prop${i}`] === String(val);
				})
			})
		})
	}

	buckets.forEach(bucket => {
		let result = '';
		opts.size.forEach((length, i) => {
			result += bucket[`prop${i}`];
		});
		bucket.result = Number(result);
	});
	return buckets;
}

// console.log(mockKeenData({
// 	size: [3, 4],
// 	gapsAt: [[1, 2], [2, 3]]
// }));

// describe('Data manipulation', () => {
// 	describe('ratio aggregator', () => {
// 		ratio of two numbers
// 		ratio of column with number
// 		ratio of table with number
// 		ratio of column with column
// 		ratio of table with column
// 		ratio of table with table
// 	});
// });

// test-ratio:
// 	node ./bin/keen-query.js '@ratio(cta:click->count(),cta:click->count(user.uuid))->relTime(3)'
// 	node ./bin/keen-query.js '@ratio(cta:click->count(),cta:click->count(user.uuid))->interval(d)->relTime(3)'
// 	node ./bin/keen-query.js '@ratio(cta:click->count(),cta:click->count(user.uuid))->interval(d)->group(page.location.type)->relTime(3)'
// 	node ./bin/keen-query.js '@ratio(cta:click->count(),cta:click->count(user.uuid))->group(page.location.type,user.isStaff)->relTime(3)'
// 	node ./bin/keen-query.js '@ratio(cta:click->count()->group(page.location.type,user.isStaff),cta:click->count(user.uuid)->group(page.location.type))->relTime(3)'

// test-concat:
// 	node ./bin/keen-query.js '@concat(cta:click->count(),cta:click->count(user.uuid),page:view->count(user.uuid))->relTime(3)'
// 	node ./bin/keen-query.js '@concat(cta:click->count()->group(page.location.type),cta:click->count(user.uuid),page:view->count(user.uuid))->relTime(3)'
// 	node ./bin/keen-query.js '@concat(cta:click->count(),cta:click->count(user.uuid),page:view->count(user.uuid))->group(page.location.type)->relTime(3)'
// 	node ./bin/keen-query.js '@concat(cta:click->count()->group(user.isStaff),cta:click->count(user.uuid),page:view->count(user.uuid))->group(page.location.type)->relTime(3)'
// 	node ./bin/keen-query.js '@concat(cta:click->count(),cta:click->count(user.uuid))->interval(d)->relTime(3)'
// 	node ./bin/keen-query.js '@concat(cta:click->count()->group(page.location.type),cta:click->count(user.uuid))->interval(d)->relTime(3)'
// 	node ./bin/keen-query.js '@concat(@pct(site:optout->count(user.uuid),page:view->count(user.uuid)), @pct(site:optin->count(user.uuid)->filter(context.optedVia!=__anon-opt-in)->filter(context.optedVia!=__m-dot-opt-in),page:view->count(user.uuid)))->interval(d)'
// 	# node ./bin/keen-query.js '@concat(page:view->count(user.uuid)->interval(day)->relTime(this_3_days),page:view->count(user.uuid)->filter(user.myft.isMyFtUser=true)->interval(day)->relTime(this_3_days))';
// 	# node ./bin/keen-query.js '@concat(cta:click->count(),cta:click->count(user.uuid))->interval(d)->relTime(3)'
// 	# node ./bin/keen-query.js '@concat(cta:click->count(),cta:click->count(user.uuid))->interval(d)->group(page.location.type)->relTime(3)'
// 	# node ./bin/keen-query.js '@concat(cta:click->count(),cta:click->count(user.uuid))->group(page.location.type,user.isStaff)->relTime(3)'

// test-reduce:
// 	node ./bin/keen-query.js 'cta:click->count()->interval(d)->relTime(3)->reduce(avg)'
// 	node ./bin/keen-query.js 'cta:click->count()->interval(d)->group(page.location.type)->relTime(3)'
// 	node ./bin/keen-query.js 'cta:click->count(user.uuid)->interval(d)->group(page.location.type)->relTime(3)->reduce(all)'
// 	node ./bin/keen-query.js '@ratio(cta:click->count(),cta:click->count(user.uuid))->interval(d)->group(page.location.type)->relTime(3)'
// 	node ./bin/keen-query.js '@ratio(cta:click->count(),cta:click->count(user.uuid))->interval(d)->group(page.location.type)->relTime(3)->reduce(avg)'

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
