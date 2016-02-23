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
		const table = firstTable.clone();
		const existingColsCount = table.axes[0].values.length;
		table.axes[0].values = table.axes[0].values.concat(otherTables.map(t => t.valueLabel));
		otherTables.forEach((t, i) => {
			table.data[existingColsCount + i] = t.data;
		});
		return table;
	} else if (firstTable.dimension === 1 && otherTables.every(t => t.dimension === 1)) {
		//concatenating a bunch of 1-dimension tables together
		// TODO throw Error if tables do not have identical axes
		const table = firstTable.clone();
		table.axes[1] = {
			name: 'CONCATENATION_RESULT',
			values: tables.map(t => t.valueLabel)
		};
		table.data = table.axes[0].values.reduce((obj, name, i) => {
			tables.forEach((t, j) => {
				obj[`${i},${j}`] = t.data[i];
			})
			return obj;
		}, {});
		return table;
	} else if (firstTable.dimension === 2 && otherTables.every(t => t.dimension === 1)) {
		//concatenating a bunch of 1-dimension tables onto a 2-dimension table
		throw new Error('Concatenating extra columsn onto a 2 dimensional table')
		const table = firstTable.clone();
		table.axes[1].values = table.axes[1].values.concat(otherTables.map(t => t.valueLabel));

		// table.data = table.axes[0].values.reduce((obj, name, i) => {
		// 	tables.forEach((t, j) => {
		// 		obj[`${i},${j}`] = t.data[i];
		// 	})
		// 	return obj;
		// }, {});


		// const table = firstTable.clone();
		// const existingColsCount = table.axes[0].values.length;
		// table.axes[0].values = table.axes[0].values.concat(otherTables.map(t => t.valueLabel));
		// otherTables.forEach((t, i) => {
		// 	table.data[existingColsCount + i] = t.data;
		// });



		// return table;

	} else {
		throw new Error('Concatenating multi dimensional tables together is not supported (and probably isn\'t what you\re trying to do')
	}
}

module.exports = function () {
	this._table = concat(this.queries.map(query => query.getTable()));
};
