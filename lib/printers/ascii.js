'use strict';
const AsciiTable = require('ascii-table');

function ascii (data) {
	data = data.tableType ? data : this.tabulate(data, 'ISO');
	const table = new AsciiTable(data.name);
	table.setHeading.apply(table, data.headings);
	data.rows.forEach(r => table.addRow.apply(table, r));
	return table.toString();
}

module.exports = function (data) {
	if (typeof data.tableType === 'function') {
		return data.tableType.call(this, data.queries, Object.assign(data.aggregateOptions || {}, {timeFormat: 'ISO'}), ascii);
	} else if (data.tableType === 'multi') {
		return [data.title].concat(data.queries.map(query => {
			return ascii.call(query.ctx, query.data);
		})).join('\n\n');
	} else {
		return ascii.call(this, data);
	}
}






