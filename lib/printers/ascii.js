'use strict';
const AsciiTable = require('ascii-table');

function ascii (data) {
	const table = new AsciiTable(data.name);
	table.setHeading.apply(table, data.headings);
	data.rows.forEach(r => table.addRow.apply(table, r));
	return table.toString();
}

module.exports = function (data) {
	data = data.isTabulated ? data : this.tabulate(data);
	if (Array.isArray(data)) {
		return [this.toString() + ': ' + this.timespan].concat(data.map(ascii)).join('\n\n');
	} else {
		data.name = this.toString() + ': ' + this.timespan;
		return ascii(data);
	}
}
