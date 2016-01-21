'use strict';

function linearRegression(arr){
	var lr = {};
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
		const obj = {};
		vals.forEach(v => {
			obj[v] = (obj[v] || 0) + 1;
		})
		let maxCount = 1;
		return Object.keys(obj).reduce((median, v) => {
			if (obj[v] > maxCount) {
				median = v;
				maxCount = obj[v];
			}
			return median;
		}, null) || 'none'
	},
	trend: vals => {
		return linearRegression(vals);
	},
	'%change': vals => {
		if (vals.length < 1) {
			throw 'Cannot calculate percentage change - not enough values';
		}
		return (100 * vals[vals.length -1]/vals[vals.length -2]) - 100;
	}
};

module.exports.reduce = function (strategy, dimension) {
	dimension = typeof dimension === 'undefined' ? this.dimension - 1 : this.getAxis(dimension);
	if (dimension !== this.dimension - 1) {
		this.switchDimensions(dimension, null, 'shuffle', true);
	}
	if (strategy === 'all') {
		this.cellIterator((value, coords) => {
			return Object.keys(strategiesMap).map(strategy => strategiesMap[strategy](value));
		}, dimension - 1);
		this.axes.pop();
		this.axes.push({
			name: 'reduced by ...',
			values: Object.keys(strategiesMap)
		})
	} else {
		this.cellIterator((value, coords) => {
			return strategiesMap[strategy](value);
		}, dimension - 1);
		this.axes.pop();
	}
}

module.exports.reduceStrategies = strategiesMap;
