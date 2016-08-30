'use strict';

const ImmutableMatrix = require('../data/immutable-matrix');
function calculateDifference (matrix1, matrix2) {
	if (matrix1.dimension !== matrix2.dimension) {
		throw new Error('Tables are incompatible - wrong dimension');
	}
	if (matrix1.size.join(',') !== matrix2.size.join(',')) {
		throw new Error('Tables are incompatible - different number of rows/columns');
	}
	// TODO need to use that .findEquivalentCoords method more widely
	const data = matrix1.dimension ? matrix1.cellIterator((value, coords) => value - matrix2.data[coords]) : matrix1.data - matrix2.data;
	return new ImmutableMatrix(Object.assign({}, matrix1, {
		data: data
	}));
}

module.exports = function () {

	this._matrix = calculateDifference(this.queries[0].getData(), this.queries[1].getData())
}
