'use strict';
const AsciiTable = require('ascii-table');

function ascii (data) {
	const table = new AsciiTable(data.name);
	table.setHeading.apply(table, data.headings);
	data.rows.forEach(r => table.addRow.apply(table, r));
	return table.toString();
}

module.exports = function (curr, prev) {
	const data = this.tabulate(curr, prev);
	if (data.length === 1) {
		data[0].name = this.getQueryObject('string');
		return ascii(data[0]);
	} else {
		return [this.getQueryObject('string')].concat(data.map(ascii)).join('\n\n');
	}
}
