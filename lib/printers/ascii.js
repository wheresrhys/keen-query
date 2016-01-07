'use strict';
const AsciiTable = require('ascii-table');

function ascii (data) {
	const table = new AsciiTable(data.name);
	table.setHeading.apply(table, data.headings);
	data.rows.forEach(r => table.addRow.apply(table, r));
	return table.toString();
}

module.exports = function (data) {
	if (data.tableType === 'multi') {
		return [data.title].concat(data.data.map(data => {
			return ascii.call(this, data);
		})).join('\n\n');
	} else {
		data = data.tableType ? data : this.tabulate(data, 'ISO');
		return ascii.call(this, data);
	}
}

module.exports.timeFormat = 'ISO';
