'use strict';

function linearRegression(arr){
	var n = arr.length;
	var sum_x = 0;
	var sum_y = 0;
	var sum_xy = 0;
	var sum_xx = 0;
	var sum_yy = 0;

	for (var i = 0; i < arr.length; i++) {

		sum_x += i;
		sum_y += arr[i];
		sum_xy += (i*arr[i]);
		sum_xx += (i*i);
		sum_yy += (arr[i]*arr[i]);
	}

	return (n * sum_xy - sum_x * sum_y) / (n*sum_xx - sum_x * sum_x);
}

const strategiesMap = {
	avg: vals => {
		return vals.reduce((tot, val) => tot + val, 0) / vals.length;
	},
	min: vals => {
		return vals.reduce((min, val) => Math.min(val, min), vals[0]);
	},
	max: vals => {
		return vals.reduce((max, val) => Math.max(val, max), vals[0]);
	},
	median: vals => {
		vals = vals.sort();
		if (vals.length % 2 === 0) {
			const middle = vals.length / 2
			return (vals[middle] + vals[middle - 1]) / 2;
		} else {
			return vals[(vals.length - 1) / 2];
		}
	},
	trend: vals => {
		return linearRegression(vals);
	},
	'%change': vals => {
		if (vals.length < 1) {
			throw new Error('Cannot calculate percentage change - not enough values');
		}
		return (100 * vals[vals.length -1]/vals[vals.length -2]) - 100;
	}
};

module.exports.reduce = function (strategy, dimension) {
	dimension = typeof dimension === 'undefined' ? this.dimension - 1 : this.getAxis(dimension);
	let table = this;
	if (dimension !== this.dimension - 1) {
		table = this.switchDimensions(dimension, null, 'shuffle');
	}
	let buckets = table.toNested(1, 'bottom');
	const axes = table.axes.slice();

	if (strategy === 'all') {

		buckets = Object.keys(buckets).reduce((newBucket, k) => {
			Object.keys(strategiesMap)
				.map(strategy => strategiesMap[strategy](buckets[k]))
				.forEach((val, i) => {
					newBucket[k ? `${k},${i}` : i] = val;
				});
				return newBucket;
		}, {});

		axes.pop();
		axes.push({
			name: 'reduced by ...',
			values: Object.keys(strategiesMap)
		})
	} else {
		if (buckets['']) {
			buckets = strategiesMap[strategy](buckets[''])
		} else {
			Object.keys(buckets).forEach(k => {
				buckets[k] = strategiesMap[strategy](buckets[k])
			});
		}
		axes.pop();
	}
	return table.clone({
		axes,
		data: buckets
	})
}

module.exports.reduceStrategies = strategiesMap;
