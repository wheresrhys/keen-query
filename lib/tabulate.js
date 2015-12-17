'use strict';
const utils = require('./utils');

function prepDoubleGroupedData (data, groups) {
	const obj = {};

	data.result.forEach(d => {
		obj[d[groups[0]]] = obj[d[groups[0]]] || {};
		obj[d[groups[0]]][d[groups[1]]] = d.result
	});

	const rows = Object.keys(obj);

	const cols = Object.keys(rows.reduce((map, rowName) => {
		Object.keys(obj[rowName]).forEach(colName => {
			map[colName] = true;
		});
		return map
	}, {}))

	return {
		rows: rows,
		cols: cols,
		data: obj
	}
}

function prepIntervalGroupedData (data, interval, group) {
	const rows = utils.getTimePoints(data, interval);
	const cols = Object.keys(data.result.reduce((map, res) => {
		res.value.forEach(val => {
			map[val[group]] = true;
		})
		return map;
	}, {}));

	const map = rows.reduce((map, row, i) => {
		map[row] = data.result[i].value.reduce((map, row) => {
			map[row[group]] = row.result;
			return map;
		}, {})
		return map;
	}, {})

	return {
		rows: rows,
		cols: cols,
		data: map
	}
}

function simpleTable (curr, prev) {

	const table = {};
	const group = this.groupedby && this.groupedBy[0];
	table.headings = ['', 'Current'];
	if (prev) {
		table.headings.push('Previous');
	}

	if (utils.isSingleNumber(curr)) {

		table.rows = [['Value', curr.result]];
		if (prev) {
			table.rows[0].push(prev.result);
		}
	// select unique
	} else if (Array.isArray(curr.result) && typeof curr.result[0] !== 'object')  {

		table.rows = utils.arrayN(Math.max(curr.result.length, prev ? prev.result.length : 0))
			.map((v, i) => {
				return ['', curr.result[i] || '', prev && prev.result[i] || ''];
			})
	} else {

		let rows;
		if (this.query.interval && !group) {
			rows = utils.getTimePoints(curr, this.intervalUnit);

			table.rows = rows.map((k, i) => {
				const row = [k, curr.result[i].value];
				if (prev) {
					row.push(prev.result[i].value);
				}
				return row;
			})

		} else if (!this.query.interval && group) {
			const results = prev ? curr.result.concat(prev.result) : curr.result;
			rows = Object.keys(results.reduce((map, res) => {
				map[res[group]] = true;
				return map;
			}, {}))
			table.rows = rows.map(k => {

				let currRes = curr.result.find(r => r[group] === k);
				const row = [k, currRes && currRes.result];

				if (prev) {
					let prevRes = prev.result.find(r => r[group] === k);
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

	table.headings = [this.groupedBy[1] ? this.groupedBy[0] : ''].concat(data.cols);

	table.rows = data.rows.map((k, i) => {
		const row = [k];
		data.cols.forEach(name => {
			row.push(data.data[k][name] || 0);
		})

		return row;
	})
	return table
}

module.exports = function (curr, prev) {
	if (this.groupedBy) {
		if (this.groupedBy.length > 1 ) {
			if (this.groupedBy.length > 2 || this.query.interval) {
				throw 'Too many dimensions to build a table';
			}	else {
				const results = [crossTable.call(this, 'Current ' + this.groupedBy[1], prepDoubleGroupedData(curr, this.groupedBy))];
				if (prev) {
					results.push(crossTable.call(this, 'Previous ' + this.groupedBy[1], prepDoubleGroupedData(prev, this.groupedBy)));
				}
				return results;
			}
		}
		if (this.query.interval) {
			const results = [crossTable.call(this, 'Current', prepIntervalGroupedData(curr, this.intervalUnit, this.groupedBy[0]))];
			if (prev) {
				results.push(crossTable.call(this, 'Previous', prepIntervalGroupedData(prev, this.intervalUnit, this.groupedBy[0])));
			}
			return results;
		}
	} else {
		return [simpleTable.call(this, curr, prev)];
	}
}
