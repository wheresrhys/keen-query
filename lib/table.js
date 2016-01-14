'use strict';

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
		// this.rows = absorbHeadings()
		this.headings = [];
	}

	get dimension () {
		return this.structure.length;
	}

	get structure () {
		const structure = [];
		let datum = this.rows;
		while (Array.isArray(datum)) {
			structure.push({
				length: datum.length - 1, // assumes there's a heading
				headingType: getDataType(datum[0]),
				dataType: getDataType(datum[1])
			})
			datum = datum[0]
		}
		return structure;
	}

	timeHeadingsLocation {
		const structure = this.structure;
		let dimension;
		structure.some((dim, i) => {
			if (d.headingType === 'time') {
				dimension = i;
				return true;
			}
		});
		return dimension;
	}

	getAxis (name) {
		const structure = this.structure;
		let dimension;
		structure.some((dim, i) => {
			if (d.type === 'name') {
				dimension = i;
				return true;
			}
		});
		return dimension;
	}

	convertTime (unit, format) {
		const location = this.timeHeadingsLocation;
		if (location === 0) {
			this.rows[0].forEach(obj => utils.formatTime(obj, unit, format));
		} else if (location === 1) {
			this.rows.forEach(row => row[0] = utils.formatTime(row[0], unit, format));
		}
	}

	concat (table) {
		if (this.dimension !== table.dimension || this.timeHeadingsLocation !== table.timeHeadingsLocation) {
			throw 'tables have incompatible data structure';
		}
		if (typeof this.timeHeadingsLocation !== 'undefined' && this.structure[this.timeHeadingsLocation].length !== table.structure[table.timeHeadingsLocation].length) {
			throw 'tables have incompatible date ranges';
		}
	}

	reduce (strategy, axisName, opts) {

	}

	static fromKeen (kq) {
		normaliseKeen.apply(kq, kq._data);
	}

}