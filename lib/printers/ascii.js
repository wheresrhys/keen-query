'use strict';
const AsciiTable = require('ascii-table');

function ascii () {
	let table = this._table;

	// make sure the greatest dimension is shown vertically
	// TODO: base it on total text length rather than number of columns/rows
	if (this._table.dimension === 2) {
		const greatestDimension = this._table.size.reduce((max, s, i) => {
			if (s > this._table.size[max]) {
				return i;
			}
			return max;
		}, 0);
		table = this._table.switchDimensions(greatestDimension, 0, 'swap');
	}

	const data = table.humanize('ISO');
	const asciiTable = new AsciiTable(this.name + ': ' + this.toString());
	asciiTable.setHeading.apply(asciiTable, data.headings);
	data.rows.forEach(r => asciiTable.addRow.apply(asciiTable, r));
	return asciiTable.toString();
}

module.exports = function () {
	return ascii.call(this);
}






