'use strict';
const AsciiTable = require('ascii-table');

function ascii (data) {
	const table = new AsciiTable(data.name);
	table.setHeading.apply(table, data.headings);
	data.rows.forEach(r => table.addRow.apply(table, r));
	return table.toString();
}

module.exports = function (data) {
	data = this.tabulate(data, 'ISO');
	data.name = data.name || (this.toString() + ': ' + this.timeframe);
	return ascii(data);
}
