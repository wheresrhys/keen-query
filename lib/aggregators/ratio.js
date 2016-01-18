'use strict';

const printers = require('../printers');

function calculateRatio (table1, table2) {
	// divide each cell by each cell
	if (table1.dimension !== table2.dimension) {
		throw 'Tables are incompatible - wrong dimension';
	}

	if (table2.axes.some((a, i) => {
		return table1.axes[i].name !== a.name;
	})) {
		throw 'Tables are incompatible - grouped by different criteria';
	}
	if (table2.axes.some((a, i) => {
		return table1.axes[i].values.map(v => v.toString).join('|') !== a.values.map(v => v.toString).join('|');
	})) {
		throw 'TODO - dividing tables where not all rows have values';
	}

	table1.cellIterator((value, coords) => {
		let divisor = table2.data;
			while (coords && coords.length) {
			divisor = divisor[coords.shift()];
		}
		return value / divisor;
	});

	return table1;
}

module.exports = function () {
	this._table = calculateRatio(this.queries[0]._table, this.queries[1]._table)
}
