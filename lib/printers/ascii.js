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
			rows = utils.getTimePoints(curr, this.intervalUnit);

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
		}
	}
	return table.toString();
}

function crossTable (name, data) {

	const table = new AsciiTable(name);
	const rows = utils.getTimePoints(data, this.intervalUnit);
	const cols = Object.keys(data.result.reduce((map, res) => {
		res.value.forEach(val => {
			map[val[this.query.group_by]] = true;
		})
		return map;
	}, {}));
	table.setHeading.apply(table, [''].concat(cols));
	rows.forEach((k, i) => {
		const row = [k];
		const values = data.result[i].value;
		cols.forEach(name => {
			console.log(values, name)
			const val = values.find(v => v[this.query.group_by] === name);
			row.push(val ? val.result : 0);
		})

		table.addRow.apply(table, row);
	})
	return table.toString();
}

module.exports = function (curr, prev) {
	if (this.query.interval && this.query.group_by) {
		const dataSets = [['Current', curr]];
		if (prev) {
			dataSets.push(['Previous', prev]);
		}
		return [this.getQuery('string')].concat(dataSets.map(data => crossTable.apply(this, data))).join('\n\n');
	} else {
		return simpleTable.call(this, curr, prev);
	}
}
