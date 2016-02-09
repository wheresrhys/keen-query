'use strict';

const utils = require('./utils');
const postProcessing = require('./post-processing');




// utility used to plot a value in a nested array
function plotInMatrix (matrix, coords, val, endDepth) {
	let i = coords.shift();
  let toModify = matrix;
	while (coords.length - endDepth) {
    toModify[i] = toModify[i] || [];
		toModify = toModify[i];
		i = coords.shift();
  }
	toModify[i] = val;
}


// converts flat data structure e.g. { '0,2,3': 'value'} into a matrix of nested arrays
// positive endDepth means it will leave the lower levels of the matrix flattened once n levels have been nested
function toNested (data, endDepth) {
	const matrix = [];
	Object.keys(data).forEach(coords => {
		plotInMatrix(matrix, coords.split(','), data[coords], endDepth || 0);
	});
	return matrix;
}


// converts flat data structure e.g. { '0,2,3': 'value'} into a matrix of nested arrays
// similar to the above, but starts from the leaves rather than the root of the matrix
// the above function, when endLevel is defined, will return nested arrays which contain flat data structures as their leaves
// this function, on the other hand, will return a flat data structure with nested arrays as the leaves
function nestLowerLevels (flatData, endLevel) {
	const obj = {};
	Object.keys(flatData).forEach(k => {
		const coords = k.split(',');
		const bucketCoord = coords.slice(0, endLevel);
		obj[bucketCoord] = obj[bucketCoord] || {};
		obj[bucketCoord][coords.slice(endLevel)] = flatData[k];
	})
	Object.keys(obj).forEach(k => {
		obj[k] = toNested(obj[k]);
	})
	return obj
}

class Table {
	constructor (conf) {
		this.name = conf.name;
		this.data = conf.data;
		this.interval = conf.interval;
		this.axes = conf.axes;
		this.valueLabel = conf.valueLabel;
	}

	get dimension () {
		return this.axes.length;
	}

	get size () {
		return this.axes.map(a => a.values.length)
	}

	get timeHeadingsLocation () {
		return this.getAxis('timeframe');
	}

	getAxis (name) {
		if (typeof name === 'number') {
			return name;
		}
		// easier to type
		if (name === 'time') {
			name = 'timeframe';
		}
		let dimension = -1;
		this.axes.some((dim, i) => {
			if (dim.property === name) {
				dimension = i;
				return true;
			}
		});
		return dimension;
	}

	convertTime (format) {
		if (this.timeHeadingsLocation === -1) {
			return this;
		}
		const axes = this.axes.slice();
		axes[this.timeHeadingsLocation] = {
			property: 'timeframe',
			values: axes[this.timeHeadingsLocation].values.map(obj => {
				return utils.formatTime(obj, this.interval, format)
			})
		};

		return this.clone({
			axes: axes
		});
	}

	// converts a table to a the sort of data structure graphing libraries typically require
	// i.e. a header row, then a number of rows with a heading in the first cell of each
	humanize (timeFormat) {
		if (this.dimension > 2) {
			throw new Error('can\'t humanize tables of greater than 2 dimensions');
		}
		const table = this.convertTime(timeFormat);
		const humanized = {};
		if (this.dimension === 0) {
			// just send back a single cell
			humanized.rows = [[table.valueLabel, table.data]]
			return humanized;
		} else if (table.dimension === 1) {
			humanized.headings = [table.axes[0].property, table.valueLabel]
			humanized.rows = table.axes[0].values.map((label, i) => {
				return [label, table.data[i]]; // this works because [i] notation works on an object or an array :-)
			})
		} else {
			const data = table.toNested();

			humanized.headings = [table.axes[0].property].concat(table.axes[1].values);
			humanized.rows = table.axes[0].values.map((label, i) => {
				return [label].concat(data[i]);
			})
		}
		const cols = humanized.headings.length;
		humanized.rows.forEach(r => {
			for(let i = 0; i<cols;i++) {
				// transform empty values to 0 or empty strings for consumption by google charts
				r[i] = r[i] || (i > 0 ? 0 : '');
			}
		})
		return humanized;
	}

	// returns a nested 'matrix' of the data
	toNested (levels, startPoint) {
		if (startPoint === 'bottom') {
			return nestLowerLevels(this.data, this.dimension - (levels || 0));
		} else {
			return toNested(this.data, levels || 0);
		}
	}

	// iterates over every value in the flattened data stucture, calling func on each value
	// func expects (value, coordsString);
	cellIterator (func) {
		if (this.dimension === 0) {
			return func(this.data);
		}
		return Object.keys(this.data).reduce((obj, k) => {
			obj[k] = func(this.data[k], k);
			return obj;
		}, {});
	}

	reduce () {
		return postProcessing.reduce.apply(this, arguments);
	}

	// returns a new table with values rounded to n decimal points
	round (points) {
		points = points || 0;
		return this.clone({
			data: this.cellIterator(val => {
				return Math.round(val * Math.pow(10, points)) / Math.pow(10, points);
			})
		});
	}

	multiply (number) {
		return this.clone({
			data: this.cellIterator(val => {
				return val * number;
			})
		});
	}

	clone (overrides) {
		return new Table(Object.assign({}, this, overrides || {}));
	}

	// swaps two dimensions of the table
	// e.g. can convert a time x deviceType table to a deviceType x time table
	// a - index or name of the first dimension to move (if null, picks the first dimension available)
	// b - index or name of the second dimension to move (if null, picks the last dimension available)
	// method - shuffle or swap.
	// - swap does a straight swap of the dimensions, leaving all others unchanged
	// - shuffle (generally only applied when moving a dimension to be the first or last) shuffles all other dimensions along to make room
	switchDimensions (a, b, method) {
		if (this.dimensions < 2) {
			throw new Error('Cannot switch dimensions - This is not a multidimensional table!');
		}
		method = method || ((a == null || b == null) ? 'shuffle' : 'swap');

	  a = a == null ? 0 : this.getAxis(a);
	  b = b == null ? this.dimension - 1 : this.getAxis(b);

	  if (a > this.dimensions || b > this.dimensions) {
			throw new Error(`This table does not have a ${Math.max(a, b)} dimension`);
		}

	  if (a === b) {
	  	return this;
	  }

	  if (a > b) {
	  	const tmp = a;
	  	a = b;
	  	b = tmp;
	  }

	  const axes = this.axes.slice();
	  const tmp = axes[a];

		if (method === 'swap') {
	    axes[a] = axes[b];
	    axes[b] = tmp;
  	} else if (method === 'shuffle') {
  		axes.splice(a, 1, axes[b]);
  		axes.splice(b, 1, tmp);
  	}

	  return this.clone({
			axes: axes,
			data: Object.keys(this.data).reduce((map, k) => {
		    const coords = k.split(',');
	    	const tmp = coords[a];
	    	if (method === 'swap') {
			    coords[a] = coords[b];
			    coords[b] = tmp;
	    	} else if (method === 'shuffle') {
	    		coords.splice(a, 1, coords[b]);
	    		coords.splice(b, 1, tmp);
	    	}

			  map[coords.join(',')] = this.data[k];
			  return map;
		  }, {})
		});
	}
}

module.exports = Table;

module.exports.mixin = function (wrapperPrototype) {
	['reduce', 'round', 'multiply'].forEach(method => {
		wrapperPrototype[method] = function () {
			const target = this.clone(true);
			target._table = target.getTable()[method].apply(target.getTable(), [].slice.call(arguments))
			return target;
		}
	});
}
