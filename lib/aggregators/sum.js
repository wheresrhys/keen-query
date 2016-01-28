'use strict';

const printers = require('../printers');
const Table = require('../table');
function calculateSum (table1, table2) {
	if (table1.dimension !== table2.dimension) {
		throw 'Tables are incompatible - wrong dimension';
	}

	if (table1.size.join(',') !== table2.size.join(',')) {
		throw 'Tables are incompatible - different number of rows/columns';
	}

	const data = table1.dimension ? table1.cellIterator((value, coords) => value + table2.data[coords]) : table1.data + table2.data;
	return new Table(Object.assign({}, table1, {
		data: data
	}));
}

module.exports = function () {
	this._table = calculateSum(this.queries[0].getTable(), this.queries[1].getTable())
}
