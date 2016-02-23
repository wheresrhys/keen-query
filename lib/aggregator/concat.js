'use strict';

const Table = require('../table');
const isGappy = require('../utils').isGappy;

function concat (tables) {
	const firstTable = tables[0];
	const otherTables = tables.slice(1);

	if (firstTable.dimension === 0 && otherTables.every(t => t.dimension === 0)) {
		//concatenating a bunch of 0-dimension tables together
		return new Table({
			axes: [{
				name: 'CONCATENATION_RESULT',
				values: tables.map(t => t.valueLabel)
			}],
			data: tables.map(t => t.data)
		});

	} else if (firstTable.dimension === 1 && otherTables.every(t => t.dimension === 0)) {
		//concatenating a bunch of 0-dimension tables onto a 1-dimension table
	} else if (firstTable.dimension === 1 && otherTables.every(t => t.dimension === 1)) {
		//concatenating a bunch of 1-dimension tables together
	} else if (firstTable.dimension === 2 && otherTables.every(t => t.dimension === 1)) {
		//concatenating a bunch of 1-dimension tables onto a 2-dimension table
	} else {
		throw new Error('Concatenating multi dimensional tables together is not supported (and probably isn\'t what you\re trying to do')
	}


	// if (tables.some(t => t.dimension !== table.dimension)) {
	// 	throw new Error('Tables are incompatible - wrong dimension');
	// }

	// if (!table.dimension) {
	// 	table.axes = [{
	// 		name: 'CONCATENATION_RESULT',
	// 		values: [0].concat(tables.map((t, i) => i + 1))
	// 	}];
	// 	table.data = [table.data].concat(tables.map(t => [t.data]));
	// } else if (table.dimension === 1) {

	// 	table.data = [].concat(tables.map(t => t.data));

	// 	//console.log('AFTER (not quite there)', JSON.stringify(table, null, '\t'));

	// } else {
	// 	throw new Error('TODO: complex concatenation')
	// }

	// return table;
}

module.exports = function () {
	this._table = concat(this.queries.map(query => query.getTable()));
};
