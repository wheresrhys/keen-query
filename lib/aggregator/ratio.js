'use strict';

const Table = require('../table');

function detectTableGaps (table1, table2) {
	return table2.axes.some((a, i) => {
		return table1.axes[i].values.map(v => v.toString).join('|') !== a.values.map(v => v.toString).join('|');
	});
}

function calculateRatio (table1, table2) {
	// divide each cell by each cell
	if (table1.dimension !== table2.dimension) {
		throw new Error('Tables are incompatible - wrong dimension');
	}

	if (table2.axes.some((a, i) => {
		return table1.axes[i].name !== a.name;
	})) {
		throw new Error('Tables are incompatible - grouped by different criteria');
	}

	const isGappy = detectTableGaps(table1, table2) || detectTableGaps(table2, table1);

	let data;

	if (table1.dimension) {
			data = table1.cellIterator((value, coords) => {
			if (isGappy) {
				coords = table1.findEquivalentCoords(coords, table2.axes);
			}
			return value / table2.data[coords];
		})
	} else {
		data = table1.data / table2.data;
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
