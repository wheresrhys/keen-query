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

class Table {
	constructor (conf) {
		this.name = conf.name;
		this.data = conf.data
		this.axes = conf.axes;
		this.metric = conf.metric;
	}

	get dimension () {
		return this.axes.length;
	}

	get timeHeadingsLocation () {
		const structure = this.axes;
		let dimension = -1;
		this.axes.some((dim, i) => {
			if (dim.type === 'timeframe') {
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

	static fromKeen (kq) {
		normaliseKeen.apply(kq, kq._data);
	}

}
module.exports = Table;
