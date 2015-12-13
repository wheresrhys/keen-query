'use strict';
const AsciiTable = require('ascii-table');
const utils = require('../utils');

function simpleTable (curr, prev) {
	const table = new AsciiTable(this.getQuery('string'))
	if (prev) {
		table.setHeading('', 'Current', 'Previous')
	} else {
		table.setHeading('', 'Current')
	}
	if (utils.isSingleNumber(curr)) {
		if (prev) {
			table.addRow('Value', curr.result, prev.result)
		} else {
			table.addRow('Value', curr.result)
		}
	} else {

		let rows;
		if (this.query.interval && !this.query.group_by) {
			rows = arrayN(curr.result.length).map((v, i) => {
				return `${this.intervalUnit} ${i + 1}`;
			})
			rows.forEach((k, i) => {
				if (prev) {
					table.addRow(k, curr.result[i].value, prev.result[i].value)
				} else {
					table.addRow(k, curr.result[i].value)
				}
			})

		} else if (!this.query.interval && this.query.group_by) {
			const results = prev ? curr.result.concat(prev.result) : curr.result;
			rows = Object.keys(results.reduce((map, res) => {
				map[res[this.query.group_by]] = true;
				return map;
			}, {}))
			rows.forEach(k => {
				let currRes = curr.result.find(r => r[this.query.group_by] === k);
				if (prev) {
					let prevRes = prev.result.find(r => r[this.query.group_by] === k);
					table.addRow(k, currRes && currRes.result, prevRes && prevRes.result);
				} else {
					table.addRow(k, currRes && currRes.result);
				}
			})
		} else {
			throw new Error ('Ascii tables not supported when interval and group by both specified')
		}
	}
	return table.toString();
}

module.exports = function (curr, prev) {
	if (this.query.interval && this.query.group_by) {
		return crossTable.call(this, curr, prev);
	} else {
		return simpleTable.call(this, curr, prev);
	}
}
