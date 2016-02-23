'use strict';

const Table = require('../table');
function calculateSum (table1, table2) {
	if (table1.dimension !== table2.dimension) {
		throw new Error('Tables are incompatible - wrong dimension');
	}

	if (table1.size.join(',') !== table2.size.join(',')) {
		throw new Error('Tables are incompatible - different number of rows/columns');
	}
	// TODO need to use that .findEquivalentCoords method more widely
	const data = table1.dimension ? table1.cellIterator((value, coords) => value + table2.data[coords]) : table1.data + table2.data;
	return new Table(Object.assign({}, table1, {
		data: data
	}));
}

module.exports = function () {
	this._table = calculateSum(this.queries[0].getTable(), this.queries[1].getTable())
}
