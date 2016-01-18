'use strict';

const printers = require('../printers');

function concat () {

}

module.exports = function () {
	const table = arguments[0];
	tables = [].slice.call(arguments, 1);
	if (tables.some(t => t.dimension !== table.dimension)) {
		throw 'Tables are incompatible - wrong dimension';
	}

	const headings = table.axes[table.axes.length - 1].values;

	table1.cellIterator((value, coords) => {
		let divisor = table2.data;
			while (coords && coords.length) {
			divisor = divisor[coords.shift()];
		}
		return value / divisor;
	});

	return table1;
}
