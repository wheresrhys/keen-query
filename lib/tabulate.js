'use strict';
const utils = require('./utils');

function flip (data) {
	const headings = data.headings;
	const newRows = utils.arrayN(data.rows[0].length).map((v, i) => {
		const newRow = [headings[i]];
		data.rows.forEach(r => {
			newRow.push(r[i]);
		})
		return newRow;
	});
	data.headings = newRows.shift();
	data.rows = newRows;
	return data;
}

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

function prepIntervalGroupedData (data, interval, group, timeFormat) {
	const rows = utils.getTimePoints(data, interval, timeFormat);
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

function simpleTable (data, timeFormat) {

	const table = {
		tableType: 'simple'
	};
	const group = this.groupedBy && this.groupedBy[0];

	if (group) {
		table.headings = [group, 'values'];
	} else if (this.query.interval) {
		table.headings = ['timeframe', 'values'];
	} else {
		table.headings = ['value'];
	}

	if (utils.isSingleNumber(data)) {
		table.tableType = 'single';
		table.rows = [[data.result]];
	// select unique
	} else if (Array.isArray(data.result) && typeof data.result[0] !== 'object')  {
		table.rows = utils.arrayN(data.result.length)
			.map((v, i) => {
				return ['', data.result[i] || ''];
			})
	} else {

		let rows;
		if (this.query.interval) {
			rows = utils.getTimePoints(data, this.intervalUnit, timeFormat);

			table.rows = rows.map((k, i) => {
				const row = [k, data.result[i].value];
				return row;
			})

		} else if (group) {

			const results = data.result;
			rows = Object.keys(results.reduce((map, res) => {
				map[res[group]] = true;
				return map;
			}, {}))
			table.rows = rows.map(k => {

				let currRes = data.result.find(r => r[group] === k);
				const row = [k, currRes && currRes.result];
				return row;
			})

		}
	}
	return table;
}

function crossTable (data) {

	const table = {
		tableType: 'cross'
	}

	table.headings = [this.groupedBy[1] ? this.groupedBy[0] : 'timeframe'].concat(data.cols);

	table.rows = data.rows.map((k, i) => {
		const row = [k];
		data.cols.forEach(name => {
			row.push(data.data[k][name] || 0);
		})

		return row;
	})
	return table
}

module.exports = function (data, timeFormat) {
	if (data.tableType) {
		return data;
	}
	data.name = data.name || (this.toString() + ': ' + this.timeframe);
	if (this.isMultiDimensional) {
		if (this.groupedBy.length > 1 ) {
			if (this.groupedBy.length > 2 || this.query.interval) {
				throw 'Too many dimensions to build a table';
			}	else {
				data = crossTable.call(this, prepDoubleGroupedData(data, this.groupedBy));
			}
		} else if (this.query.interval) {
			data = crossTable.call(this, prepIntervalGroupedData(data, this.intervalUnit, this.groupedBy[0], timeFormat));
			data = this.flipTable ? flip(data) : data;
		} else {
			data = simpleTable.call(this, data);
		}
	} else {
		data = simpleTable.call(this, data, timeFormat);
	}
	data.name = this.toString() + ': ' + this.timeframe;

	return data;
}
