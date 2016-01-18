'use strict';
const AsciiTable = require('ascii-table');

function ascii () {
	const data = this._table.humanize('ISO');
	const table = new AsciiTable(this.name + ': ' + this.toString());
	table.setHeading.apply(table, data.headings);
	data.rows.forEach(r => table.addRow.apply(table, r));
	return table.toString();
}

module.exports = function () {
	return ascii.call(this);
}






