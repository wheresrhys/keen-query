'use strict';

const ImmutableMatrix = require('../data/immutable-matrix');

function calculateRatio (matrix1, matrix2) {

	let data;

	if (matrix1.dimension === 0 && matrix2.dimension === 0) {
		// For the simplest case we just divide two values
		data = matrix1.data / matrix2.data;

	// Both tables are of the same dimension, so there should be more or less a one-to-one
	// mapping between their values. We just need to find the corresponding cells and divide them
	} else if (matrix1.dimension === matrix2.dimension) {

		// First we check to see if the tables' dimensions are the same
		if (matrix2.axes.some((a, i) => {
			return matrix1.axes[i].name !== a.name;
		})) {
			throw new Error('Tables are incompatible - grouped by different criteria');
		}

		// Then we check to see if there are any gaps in either table's data
		// (Could happen if e.g. one table is last week's data, the other is this week's,
		// and we introduced a new thing this week)
		const gapsExist = ImmutableMatrix.isGappy(matrix1, matrix2);

		// We go through each cell of table 1
		data = matrix1.cellIterator((value, coords) => {
			// if we know there are gaps we can't rely on the coordinates always being correct
			// so we have to be careful to find th eexasct right cell
			// TODO: consider doing this always as e.g. ordering could also screw us over
			if (gapsExist) {
				coords = matrix1.findEquivalentCoords(coords, matrix2.axes);
			}
			// finally divide the value by the equivalent one in the second table
			return value / matrix2.data[coords];
		});

	// The first table is of greater dimension than the second
	} else if (matrix1.dimension > matrix2.dimension) {


		if (matrix2.dimension === 0) {
			// If the second table holds a single value only then we just need to divide each value
			// in the first table by it - easy peasy, lemon squeasy :)
			data = matrix1.cellIterator(value => {
				return value / matrix2.data;
			});
		} else {
			// Otherwise we need to find equivalent coordinates in the table of lower dimension
			// (Difficult difficult, lemon difficult. See the findEquivalentCoords method in the ImmutableMatrix
			// class for the magic that makes it work)
			data = matrix1.cellIterator((value, coords) => {
				coords = matrix1.findEquivalentCoords(coords, matrix2.axes);
				return value / matrix2.data[coords];
			});
		}
	} else {
		throw new Error('Cannot divide a table by one of greater dimension');
	}

	// Now we've built the data we just return a new table, with the value label adjusted accordingly
	return new ImmutableMatrix(Object.assign({}, matrix1, {
		data: data,
		valueLabel: `${matrix1.valueLabel} / ${matrix2.valueLabel}`
	}));
}

module.exports = function () {
	this._matrix = calculateRatio(this.queries[0].getData(), this.queries[1].getData())
}

module.exports.calculateRatio = calculateRatio;
