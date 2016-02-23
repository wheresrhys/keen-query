'use strict';

const Table = require('../table');
const isGappy = require('../utils').isGappy;

function calculateRatio (table1, table2) {

	let data;

	if (table1.dimension === 0 && table2.dimension === 0) {
		// For the simplest case we just divide two values
		data = table1.data / table2.data;

	// Both tables are of the same dimension, so there should be more or less a one-to-one
	// mapping between their values. We just need to find the corresponding cells and divide them
	} else if (table1.dimension === table2.dimension) {

		// First we check to see if the tables' dimensions are the same
		if (table2.axes.some((a, i) => {
			return table1.axes[i].name !== a.name;
		})) {
			throw new Error('Tables are incompatible - grouped by different criteria');
		}

		// Then we check to see if there are any gaps in either table's data
		// (Could happen if e.g. one table is last week's data, the other is this week's,
		// and we introduced a new thing this week)
		const tablesHaveGaps = isGappy(table1, table2);

		// We go through each cell of table 1
		data = table1.cellIterator((value, coords) => {
			// if we know there are gaps we can't rely on the coordinates always being correct
			// so we have to be careful to find th eexasct right cell
			// TODO: consider doing this always as e.g. ordering could also screw us over
			if (tablesHaveGaps) {
				coords = table1.findEquivalentCoords(coords, table2.axes);
			}
			// finally divide the value by the equivalent one in the second table
			return value / table2.data[coords];
		});

	// The first table is of greater dimension than the second
	} else if (table1.dimension > table2.dimension) {


		if (table2.dimension === 0) {
			// If the second table holds a single value only then we just need to divide each value
			// in the first table by it - easy peasy, lemon squeasy :)
			data = table1.cellIterator(value => {
				return value / table2.data;
			});
		} else {
			// Otherwise we need to find equivalent coordinates in the table of lower dimension
			// (Difficult difficult, lemon difficult. See the findEquivalentCoords method in the Table
			// class for the magic that makes it work)
			data = table1.cellIterator((value, coords) => {
				coords = table1.findEquivalentCoords(coords, table2.axes);
				return value / table2.data[coords];
			});
		}
	} else {
		throw new Error('Cannot divide a table by one of greater dimension');
	}

	// Now we've built the data we just return a new table, with the value label adjusted accordingly
	return new Table(Object.assign({}, table1, {
		data: data,
		valueLabel: `${table1.valueLabel} / ${table2.valueLabel}`
	}));
}

module.exports = function () {
	this._table = calculateRatio(this.queries[0].getTable(), this.queries[1].getTable())
}

module.exports.calculateRatio = calculateRatio;
