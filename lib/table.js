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

// Iterates through arrays nested to an arbitrary depth, applying a function to each value
// (or sub array if opts.endDepth is less than the depth of the nesting)
function nestedIterator (opts) {
	if (!opts.depth || !opts.endDepth) {
		return opts.data.map((v, i) => {
			const localCoords = opts.coords ? opts.coords.slice() : [];
			localCoords.push(i)
			return opts.func(v, localCoords)
		});
	} else {
		return opts.data.map((r, i) => {
			const localCoords = opts.coords ? opts.coords.slice() : [];
			localCoords.push(i);
			return nestedIterator({
				data: r,
				func: opts.func,
				depth: opts.depth - 1,
				coords: localCoords,
				endDepth: opts.endDepth - 1
			});
		})
	}
}

function rowify (data) {

}


class Table {
	constructor (conf) {
		this.name = conf.name;
		this.data = conf.data;
		this.interval = conf.interval;
		this.axes = conf.axes;
		this.metric = conf.metric;
		this._table = this;
	}

	plot (coords, res) {
	  let i = coords.shift();
	  let toModify = this.data;
		while (coords.length) {
	    toModify[i] = toModify[i] || [];
			toModify = toModify[i];
			i = coords.shift();
	  }
	  toModify[i] = res;
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
		let dimension;
		this.axes.some((dim, i) => {
			if (dim.type === name) {
				dimension = i;
				return true;
			}
		});
		return dimension;
	}

	convertTime (unit, format) {
		if (this.timeHeadingsLocation > -1) {
			this.axes[this.timeHeadingsLocation].values = this.axes[this.timeHeadingsLocation].values.map(obj => utils.formatTime(obj, unit, format));
		}
	}

	concat (table) {
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
		this.convertTime(this.interval, timeFormat);
		const humanized = {};
		if (this.dimension === 0) {
			humanized.rows = [[this.metric, this.data]]
			// just send back a single cell
		} else if (this.dimension === 1) {
			humanized.headings = [this.axes[0].property, this.metric]
			humanized.rows = this.axes[0].values.map((label, i) => {
				return [label, this.data[i]];
			})
		} else {
			humanized.headings = [this.axes[0].property].concat(this.axes[1].values);
			humanized.rows = this.axes[0].values.map((label, i) => {
				return [label].concat(this.data[i]);
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

	// func expects (value, coords);
	cellIterator (func, endDepth) {
		if (this.dimension === 0) {
			this.data = func(this.data, []);
			return;
		}
		this.data = nestedIterator({
			data: this.data,
			func: func,
			depth: this.dimension - 1,
			endDepth: typeof endDepth === 'undefined' ? -1 : endDepth
		})
	}

	reduce () {
		return postProcessing.reduce.apply(this, arguments);
	}

	round (points) {
		return this.cellIterator(val => {
			return Math.round(val * Math.pow(10, points)) / Math.pow(10, points);
		})
	}

	switchDimensions (a, b, method, mutate) {
		if (a == null || b == null) {
			method = method || 'shuffle';
		} else {
			method = method || 'swap';
		}
	  if (a == null) {
	  	a = 0;
	  } else {
	  	a = this.getAxis(a);
	  }

	  if (b == null) {
	  	b = this.dimension - 1;
	  } else {
	  	b = this.getAxis(b);
	  }

	  if (a > b) {
	  	const tmp = a;
	  	a = b;
	  	b = tmp;
	  }
	  var obj = {};

	  this.cellIterator((v, coords) => {
      obj[coords.join(',')] = v;
      return v;
	  });

	  let table;

	  if (mutate) {
	  	table = this;
	  	table.data = [];
	  } else {
		  table = new Table({
				axes: this.axes.slice(),
				data: [],
				metric: this.extraction,
				interval: this.interval
			});
		}

		const tmp = table.axes[a];
		if (method === 'swap') {
	    table.axes[a] = table.axes[b];
	    table.axes[b] = tmp;
  	} else if (method === 'shuffle') {
  		table.axes.splice(a, 1, table.axes[b]);
  		table.axes.splice(b, 1, tmp);
  	}
	  Object.keys(obj).forEach(k => {
	    const coords = k.split(',');
	    if (a !== b) {
	    	const tmp = coords[a];
	    	if (method === 'swap') {
			    coords[a] = coords[b];
			    coords[b] = tmp;
	    	} else if (method === 'shuffle') {
	    		coords.splice(a, 1, coords[b]);
	    		coords.splice(b, 1, tmp);
	    	}
		  }
	    table.plot(coords, obj[k])
	  });
	  return table;
	}

	static fromKeen (kq) {
		normaliseKeen.apply(kq, kq._data);
	}

}
module.exports = Table;
