'use strict';

const Table = require('../table');

function detectTableGaps (table1, table2) {
	return table2.axes.some((a, i) => {
		return table1.axes[i].values.map(v => v.toString).join('|') !== a.values.map(v => v.toString).join('|');
	});
}

function calculateRatio (table1, table2) {

	let data;

	if (table1.dimension === 0 && table2.dimension === 0) {
		data = table1.data / table2.data;
	} else if (table1.dimension === table2.dimension) {
		if (table2.axes.some((a, i) => {
			return table1.axes[i].name !== a.name;
		})) {
			throw new Error('Tables are incompatible - grouped by different criteria');
		}
		const isGappy = detectTableGaps(table1, table2) || detectTableGaps(table2, table1);
		data = table1.cellIterator((value, coords) => {
			if (isGappy) {
				coords = table1.findEquivalentCoords(coords, table2.axes);
			}
			return value / table2.data[coords];
		});
	} else if (table1.dimension > table2.dimension) {
		if (table2.dimension === 0) {
			data = table1.cellIterator(value => {
				console.log(value, table2.data);
				return value / table2.data;
			});
		} else {
			data = table1.cellIterator((value, coords) => {
				coords = table1.findEquivalentCoords(coords, table2.axes);
				return value / table2.data[coords];
			});
		}
	} else {
		throw new Error('Cannot divide a tabel by one of greater dimension');
	}

	return new Table(Object.assign({}, table1, {
		data: data,
		valueLabel: `${table1.valueLabel} / ${table2.valueLabel}`
	}));
}

module.exports = function () {
	this._table = calculateRatio(this.queries[0].getTable(), this.queries[1].getTable())
}

module.exports.calculateRatio = calculateRatio;
