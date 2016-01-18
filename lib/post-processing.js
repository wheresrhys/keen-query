'use strict';

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
	}
};

// 	reduce (strategy, axisName, opts) {
// 		if (this.dimension === 0) {
// 			throw 'Makes no sense to reduce a table which only has one cell';
// 		}
// 		let dimension = getAxis(name);
// 		nestedIterator({
// 			data: this.data,
// 			func: func,
// 			depth: this.dimension - 1,
// 			endDepth: dimension
// 		})

// 	}


function pluck (matrix, column) {
	return matrix.map(r => r[column]);
}

// function reduce (query, options, printer) {
// 	const data = query.ctx.tabulate(query.data, options.timeFormat);

// 	if (data.tableType === 'single') {
// 		throw 'Cannot reduce table which only contains one value, silly';
// 	}
// 	data.rows = options.strategies.map(strategy => {
// 		return data.rows[0].map((r, i) => {
// 			if (i === 0) {
// 				return strategy;
// 			}
// 			return strategiesMap[strategy](pluck(data.rows, i))
// 		})
// 	});

// 	return printer(data);
// }


module.exports.reduce = function (strategy, dimension) {
	console.log(arguments);
	dimension = typeof dimension === 'undefined' ? this.dimension - 1 : this.getAxis(dimension);
	if (dimension !== this.dimension - 1) {
		throw 'TODO: reducing along a choice of axis';
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

	// console.log(dimension, strategies)
}
