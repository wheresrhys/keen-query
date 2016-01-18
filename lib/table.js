'use strict';

const utils = require('./utils');
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

function nestedIterator(arr, func, dimensions, coords) {
	if (!dimensions) {
		return arr.map((v, i) => {
			const localCoords = coords ? coords.slice() : [];
			localCoords.push(i)
			return func(v, localCoords)
		});
	} else {
		return arr.map((r, i) => {
			const localCoords = coords ? coords.slice() : [];
			localCoords.push(i);
			return nestedIterator(r, func, dimensions - 1, localCoords)
		})
	}
}

const reduceStrategies = {
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

function rowify (data) {

}


class Table {
	constructor (conf) {
		this.name = conf.name;
		this.data = conf.data
		this.axes = conf.axes;
		this.metric = conf.metric;
		this._table = this;
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

	reduce (strategy, axisName, opts) {

	}

	humanize (timeFormat) {
		if (this.dimension > 2) {
			throw 'can\'t humanize tables of greater than 2 dimensions'
		}
		this.convertTime(null, timeFormat);
		const table = {};
		if (this.dimension === 0) {
			table.rows = [[this.metric, this.data]]
			// just send back a single cell
		} else if (this.dimension === 1) {
			table.headings = [this.axes[0].property, this.metric]
			table.rows = this.axes[0].values.map((label, i) => {
				return [label, this.data[i]];
			})
		} else {
			table.headings = [this.axes[0].property].concat(this.axes[1].values);
			table.rows = this.axes[0].values.map((label, i) => {
				return [label].concat(this.data[i]);
			})
		}
		return table;
	}

	// func expects (value, coords);
	cellIterator (func) {
		if (this.dimension === 0) {
			this.data = func(this.data, []);
			return;
		}
		this.data = nestedIterator(this.data, func, this.dimension - 1)
	}

	static fromKeen (kq) {
		normaliseKeen.apply(kq, kq._data);
	}

}
module.exports = Table;
