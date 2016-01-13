'use strict';
const AsciiTable = require('ascii-table');

function ascii (data) {
	data = data.tableType ? data : this.tabulate(data);
	data = data.humanize('ISO');
	const table = new AsciiTable(data.name);
	table.setHeading.apply(table, data.headings);
	data.rows.forEach(r => table.addRow.apply(table, r));
	return table.toString();
}

module.exports = function (data) {
	return ascii.call(this, data);
}






