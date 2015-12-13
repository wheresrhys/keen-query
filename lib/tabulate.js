'use strict';
const utils = require('./utils');

function simpleTable (curr, prev) {
	const table = {};
	table.headings = ['', 'Current'];
	if (prev) {
		table.headings.push('Previous');
	}

	if (utils.isSingleNumber(curr)) {
		tables.rows = [['Value', curr.result]];
		if (prev) {
			table.rows[0].push(prev.result);
		}
	} else {

		let rows;
		if (this.query.interval && !this.query.group_by) {
			rows = utils.getTimePoints(curr, this.intervalUnit);

			table.rows = rows.map((k, i) => {
				const row = [k, curr.result[i].value];
				if (prev) {
					row.push(prev.result[i].value);
				}
				return row;
			})

		} else if (!this.query.interval && this.query.group_by) {
			const results = prev ? curr.result.concat(prev.result) : curr.result;
			rows = Object.keys(results.reduce((map, res) => {
				map[res[this.query.group_by]] = true;
				return map;
			}, {}))
			table.rows = rows.map(k => {
				let currRes = curr.result.find(r => r[this.query.group_by] === k);
				row = [k, currRes && currRes.result];
				if (prev) {
					let prevRes = prev.result.find(r => r[this.query.group_by] === k);
					row.push(prevRes && prevRes.result);
				}
				return row;
			})
		}
	}
	return table;
}

function crossTable (name, data) {

	const table = {
		name: name
	}
	const rows = utils.getTimePoints(data, this.intervalUnit);
	const cols = Object.keys(data.result.reduce((map, res) => {
		res.value.forEach(val => {
			map[val[this.query.group_by]] = true;
		})
		return map;
	}, {}));

	table.headings = [''].concat(cols);
	table.rows = rows.map((k, i) => {
		const row = [k];
		const values = data.result[i].value;

		cols.forEach(name => {
			const val = values.find(v => v[this.query.group_by] === name);
			row.push(val ? val.result : 0);
		})

		return row;
	})
	return table
}

module.exports = function (curr, prev) {
	if (this.query.interval && this.query.group_by) {
		const results = [crossTable.call(this, 'Current', curr)];
		if (prev) {
			results.push(crossTable.call(this, 'Previous', prev));
		}
		return results;
	} else {
		return [simpleTable.call(this, curr, prev)];
	}
}
