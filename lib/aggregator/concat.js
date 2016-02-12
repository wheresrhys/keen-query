'use strict';

const Table = require('../table');
const isGappy = require('../is-gappy.js');

function concat (tables) {

	const table = tables[0];

	//console.log('BEFORE', JSON.stringify(table, null, '\t'));

	if (tables.some(t => t.dimension !== table.dimension)) {
		throw new Error('Tables are incompatible - wrong dimension');
	}

	if (!table.dimension) {
		table.axes = [{
			name: 'thing',
			values: [0].concat(tables.map((t, i) => i + 1))
		}];
		table.data = [table.data].concat(tables.map(t => [t.data]));
	} else if (table.dimension === 1) {

		table.data = [].concat(tables.map(t => t.data));

		//console.log('AFTER (not quite there)', JSON.stringify(table, null, '\t'));

	} else {
		throw new Error('TODO: complex concatenation')
	}

	return table;
}

module.exports = function () {
	this._table = concat(this.queries.map(query => query.getTable()));
};
