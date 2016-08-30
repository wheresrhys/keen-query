'use strict';
const AsciiTable = require('ascii-table');

function ascii () {

	let table = this.getData();

	// make sure the greatest dimension is shown vertically
	// TODO: base it on total text length rather than number of columns/rows
	if (table.dimension === 2) {
		const greatestDimension = table.size.reduce((max, s, i) => {
			if (s > this.getData().size[max]) {
				return i;
			}
			return max;
		}, 0);
		table = table.switchDimensions(greatestDimension, 0, 'swap');
	}
	const data = table.unflatten('shortISO');
	const asciiTable = new AsciiTable(this.name + ': ' + this.toString());
	asciiTable.setHeading.apply(asciiTable, data.headings);
	data.rows.forEach(r => asciiTable.addRow.apply(asciiTable, r));
	return asciiTable.toString();
}

module.exports = function () {
	return ascii.call(this);
}
