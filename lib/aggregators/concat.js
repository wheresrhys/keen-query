'use strict';

const printers = require('../printers');

function concat () {

}

module.exports = function () {
	throw 'TODO: Proper concatenation of tables'
	const table = this.queries[0]._table;
	const tables = [].slice.call(this.queries, 1).map(q => q._table);
	if (tables.some(t => t.dimension !== table.dimension)) {
		throw 'Tables are incompatible - wrong dimension';
	}
	if (!table.dimension) {
		table.axes = [{
			name: 'thing',
			values: [0].concat(tables.map((t, i) => i + 1))
		}];
		table.data = [table.data].concat(tables.map(t => [t.data]));
	} else if (table.dimension === 1) {
		table.axes.unshift({
			name: 'thing',
			values: [0].concat(tables.map((t, i) => i + 1))
		});
		table.data = [table.data].concat(tables.map(t => t.data));
	} else {
		throw 'TODO: complex concatenation'
		tables.forEach((t, i) => {
			table.axes[table.axes.length - 1].values = table.axes[table.axes.length - 1].values.concat(t.dimension ? t.axes[t.axes.length - 1].values : i);
			table.data = table.data.concat([t.data]);
		});
	}
	this._table = table;
}
