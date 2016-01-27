'use strict';

const utils = require('./utils');
const postProcessing = require('./post-processing');

function getDataType (datum) {
	if (typeof datum === 'object') {
		// really loose duck-typing, but it'll probably work 99% of the time
		return 'date';
	} else if (!isNaN(Number(datum))) {
		return 'number';
	} else {
		return 'string';
	}
}

// // Iterates through arrays nested to an arbitrary depth, applying a function to each value
// // (or sub array if opts.endDepth is less than the depth of the nesting)
// function nestedIterator (opts) {
// 	if (!opts.depth || !opts.endDepth) {
// 		return opts.data.map((v, i) => {
// 			const localCoords = opts.coords ? opts.coords.slice() : [];
// 			localCoords.push(i)
// 			return opts.func(v, localCoords)
// 		});
// 	} else {
// 		return opts.data.map((r, i) => {
// 			const localCoords = opts.coords ? opts.coords.slice() : [];
// 			localCoords.push(i);
// 			return nestedIterator({
// 				data: r,
// 				func: opts.func,
// 				depth: opts.depth - 1,
// 				coords: localCoords,
// 				endDepth: opts.endDepth - 1
// 			});
// 		})
// 	}
// }

function plot (matrix, coords, val, endDepth) {
	let i = coords.shift();
  let toModify = matrix;
	while (coords.length - endDepth) {
    toModify[i] = toModify[i] || [];
		toModify = toModify[i];
		i = coords.shift();
  }
  if (endDepth) {
  	toModify[i] = toModify[i] || {};
  	toModify[i][coords.join(',')] = val;
  } else {
	  toModify[i] = val;
	}
}

function toNested (data, endDepth) {
	const matrix = [];
	Object.keys(data).forEach(coords => {
		plot(matrix, coords.split(','), data[coords], endDepth || 0);
	});
	return matrix;
}

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
		this.metric = conf.metric;
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
			if (dim.type === name) {
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
			name: 'timeframe',
			values: axes[this.timeHeadingsLocation].values.map(obj => {
				return utils.formatTime(obj, this.interval, format)
			})
		};

		return new Table(Object.assign({}, this, {
			axes: axes
		}));
	}

	concat (table) {
		// TODO
		if (this.dimension !== table.dimension || this.timeHeadingsLocation !== table.timeHeadingsLocation) {
			throw 'tables have incompatible data structure';
		}
		if (typeof this.timeHeadingsLocation !== 'undefined' && this.axes[this.timeHeadingsLocation].length !== table.axes[table.timeHeadingsLocation].length) {
			throw 'tables have incompatible date ranges';
		}
	}


	humanize (timeFormat) {
		if (this.dimension > 2) {
			throw 'can\'t humanize tables of greater than 2 dimensions'
		}
		const table = this.convertTime(timeFormat);
		const humanized = {};
		if (this.dimension === 0) {
			// just send back a single cell
			humanized.rows = [[table.metric, table.data]]
			return humanized;
		} else if (table.dimension === 1) {

			humanized.headings = [table.axes[0].property, table.metric]
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
				r[i] = r[i] || 0;
			}
		})
		return humanized;
	}

	toNested (levels, startPoint) {
		if (startPoint === 'bottom' ) {
			return nestLowerLevels(this.data, this.dimension - (levels || 0));
		} else {
			return toNested(this.data, levels || 0);
		}
	}

	// func expects (value, coords);
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

	round (points) {
		return new Table(Object.assign({}, this, {
			data: this.cellIterator(val => {
				return Math.round(val * Math.pow(10, points)) / Math.pow(10, points);
			})
		}));
	}

	switchDimensions (a, b, method) {
		if (this.dimensions < 2) {
			throw 'This is not a multidimensional table!';
		}
		method = method || ((a == null || b == null) ? 'shuffle' : 'swap');

	  a = a == null ? 0 : this.getAxis(a);
	  b = b == null ? this.dimension - 1 : this.getAxis(b);

	  if (a > this.dimensions || b > this.dimensions) {
			throw `This table doe snot have a ${Math.max(a, b)} dimension`;
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

	  return new Table(Object.assign({}, this, {
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
		}));
	}
}
module.exports = Table;
