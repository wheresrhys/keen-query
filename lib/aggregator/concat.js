'use strict';

// const isGappy = require('../utils').isGappy;
/**
	The code below is generally more comprehensible if each case is understood before
	trying to understand the next. Each one handles a slightly more complex case than
	the previous and can be thought of as a hybrid of the two preceding approaches
**/
function concat (tables) {
	// circular dependency hell!
	const Table = require('../table');
	// end circular dependency hell!
	const firstTable = tables[0];
	const otherTables = tables.slice(1);

	// Concatenating a bunch of 0-dimension tables together
	if (firstTable.dimension === 0 && otherTables.every(t => t.dimension === 0)) {

		// We just bundle all the values and valueLabels up into a single row table
		return new Table({
			axes: [{
				property: 'CONCATENATION_RESULT',
				values: tables.map(t => t.valueLabel)
			}],
			// even though data should technically be an object we can get away with using an array
			// as the flat object for a 1 dimensional table would only have keys '0', '1', '2' ... anyway
			data: tables.map(t => t.data)
		});

	// Concatenating a bunch of 0-dimension tables onto a 1-dimension table
	} else if (firstTable.dimension === 1 && otherTables.every(t => t.dimension === 0)) {

		// As the data structure we start with isn't shallow and easy to copy, we begin by cloning
		const table = firstTable.clone();
		// Anything we append we will need to offset by the number of values that already exist, so we make a note
		const existingColsCount = table.axes[0].values.length;
		// We append the valueLabel for each of the sibling tables to the end of our new table's list of labels
		table.axes[0].values = table.axes[0].values.concat(otherTables.map(t => t.valueLabel));
		// Now we take the single value from each sibling table and append to the new table's data
		otherTables.forEach((t, i) => {
			table.data[existingColsCount + i] = t.data;
		});
		return table;

	// Concatenating a bunch of 1-dimension tables together into a 2 dimensional table
	} else if (firstTable.dimension === 1 && otherTables.every(t => t.dimension === 1)) {
		// TODO check axes and throw Error if tables do not have identical axes

		// As above, we begin by making a deep clone
		const table = firstTable.clone();

		// We build a second axis for the table out of the valueLabels of each table
		table.axes[1] = {
			property: 'CONCATENATION_RESULT',
			values: tables.map(t => t.valueLabel)
		};
		// We build a flat representation of a 2 dimensional array by iterating through the
		// values of the first axis and each of the tables, storing their values in "0,0", "0,1" etc...
		table.data = table.axes[0].values.reduce((obj, name, i) => {
			tables.forEach((t, j) => {
				obj[`${i},${j}`] = t.data[i];
			})
			return obj;
		}, {});

		return table;

	// Concatenating a bunch of 1-dimension tables onto a 2-dimension table
	} else if (firstTable.dimension === 2 && otherTables.every(t => t.dimension === 1)) {

		// We - yawn - clone again
		const table = firstTable.clone();

		// Similar to the second case, way way above, we have to offset by the number of existing values
		// as we are appending to an existing table
		const valueOffset = table.axes[1].values.length;

		// We get headings for each new column of the table from the valueLabels of the sibling tables
		table.axes[1].values = table.axes[1].values.concat(otherTables.map(t => t.valueLabel));

		// Similar to the above, we iterate through the sibling tables and the values of the
		// first axis (I can't recall if there's a reason the iteration is nested in the reverse order
		// to that above)
		otherTables.forEach((name, i) => {
			table.axes[0].values.forEach((v, j) => {
				table.data[`${j},${valueOffset + i}`] = otherTables[i].data[j];
			})
		});

		return table;

	} else {
		throw new Error(`Concatenating multi dimensional tables together is not supported
(and probably isn\'t what you want anyway - think how confusing the graph would be!!!)`)
	}
}

module.exports = function () {
	this._table = concat(this.queries.map(query => query.getTable()));
};

module.exports.concat = concat;
