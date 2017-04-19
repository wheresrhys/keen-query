const KeenQuery = require('../lib');
KeenQuery.setConfig({
	KEEN_PROJECT_ID: 'test_proj',
	KEEN_READ_KEY: 'test_key'
});
const expect = require('chai').expect;

// Numerical values always match coordinates e.g. the value in [1,0,3] will be 103
// for this reason avoid creating structures bigger than 10 in any direction (shouldn't be necessary anyway)
// opts takes
// size: [2, 3] - size of dimensions
// gapsAt: [[1,1],[2,2]] - location of any gaps in the table. Note
// props (optional) list of propnames. defaults to prop0, prop1 etc
// can also pass in some numbers as arguments, which will be converted to {opts.size: [number, number, ...]}
module.exports.mockKeenData = function (opts) {
	if (typeof opts === 'number') {
		opts = {
			size: [].slice.call(arguments)
		}
	}
	const bucketeers = opts.size.map(n => Array(n+1).join('.').split(''));
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

module.exports.multiply = function (n, result) {
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
	console.log(JSON.stringify(data).replace('null', 'Infinity')) //eslint-disable-line
	return data;
}

module.exports.testQuery = function (kq, expected) {
	const promise = KeenQuery.build(kq).print('matrix')
	if (!expected) {
		promise.then(log)
	}

	return promise
		.then(data => expect(data).to.deep.equal(expected))

}
