'use strict';

const ImmutableMatrix = require('../data/immutable-matrix');
function calculateSum (matrix1, matrix2) {
	if (matrix1.dimension !== matrix2.dimension) {
		throw new Error('Tables are incompatible - wrong dimension');
	}
	console.log(matrix1.size, matrix2.size)
	if (matrix1.size.join(',') !== matrix2.size.join(',')) {
		throw new Error('Tables are incompatible - different number of rows/columns');
	}
	// TODO need to use that .findEquivalentCoords method more widely
	const data = matrix1.dimension ? matrix1.cellIterator((value, coords) => value + matrix2.data[coords]) : matrix1.data + matrix2.data;
	return new ImmutableMatrix(Object.assign({}, matrix1, {
		data: data
	}));
}

module.exports = function () {

	this._matrix = this.queries.reduce((matrix, q, i) => {
		if (i === 0) {
			return q.getData();
		} else {
			return calculateSum(matrix, q.getData())
		}
	}, null)
}
