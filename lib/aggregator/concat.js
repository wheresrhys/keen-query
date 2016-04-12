'use strict';

// const isGappy = require('../utils').isGappy;
/**
	The code below is generally more comprehensible if each case is understood before
	trying to understand the next. Each one handles a slightly more complex case than
	the previous and can be thought of as a hybrid of the two preceding approaches
**/
function concat (matrices) {
	// circular dependency hell!
	const ImmutableMatrix = require('../data/immutable-matrix');
	// end circular dependency hell!
	const firstMatrix = matrices[0];
	const otherMatrices = matrices.slice(1);

	// Concatenating a bunch of 0-dimension matrices together
	if (firstMatrix.dimension === 0 && otherMatrices.every(t => t.dimension === 0)) {

		// We just bundle all the values and valueLabels up into a single row matrix
		return new ImmutableMatrix({
			axes: [{
				property: '_headings',
				values: matrices.map(t => t.valueLabel)
			}],
			// even though data should technically be an object we can get away with using an array
			// as the flat object for a 1 dimensional matrix would only have keys '0', '1', '2' ... anyway
			data: matrices.map(t => t.data)
		});

	// Concatenating a bunch of 0-dimension matrices onto a 1-dimension matrix
	} else if (firstMatrix.dimension === 1 && otherMatrices.every(t => t.dimension === 0)) {

		// As the data structure we start with isn't shallow and easy to copy, we begin by cloning
		const matrix = firstMatrix.clone();
		// Anything we append we will need to offset by the number of values that already exist, so we make a note
		const existingColsCount = matrix.axes[0].values.length;
		// We append the valueLabel for each of the sibling matrices to the end of our new matrix's list of labels
		matrix.axes[0].values = matrix.axes[0].values.concat(otherMatrices.map(t => t.valueLabel));
		// Now we take the single value from each sibling matrix and append to the new matrix's data
		otherMatrices.forEach((t, i) => {
			matrix.data[existingColsCount + i] = t.data;
		});
		return matrix;

	// Concatenating a bunch of 1-dimension matrices together into a 2 dimensional matrix
	} else if (firstMatrix.dimension === 1 && otherMatrices.every(t => t.dimension === 1)) {
		// TODO check axes and throw Error if matrices do not have identical axes

		// As above, we begin by making a deep clone
		const matrix = firstMatrix.clone();

		// We build a second axis for the matrix out of the valueLabels of each matrix
		matrix.axes[1] = {
			property: '_headings',
			values: matrices.map(t => t.valueLabel)
		};
		// We build a flat representation of a 2 dimensional array by iterating through the
		// values of the first axis and each of the matrices, storing their values in "0,0", "0,1" etc...
		matrix.data = matrix.axes[0].values.reduce((obj, name, i) => {
			matrices.forEach((t, j) => {
				obj[`${i},${j}`] = t.data[firstMatrix.findEquivalentCoords(i, t.axes)];
			})
			return obj;
		}, {});

		return matrix;

	// Concatenating a bunch of 1-dimension matrices onto a 2-dimension matrix
	} else if (firstMatrix.dimension === 2 && otherMatrices.every(t => t.dimension === 1)) {

		// We - yawn - clone again
		const matrix = firstMatrix.clone();

		// Similar to the second case, way way above, we have to offset by the number of existing values
		// as we are appending to an existing matrix
		const valueOffset = matrix.axes[1].values.length;

		// We get headings for each new column of the matrix from the valueLabels of the sibling matrices
		matrix.axes[1].values = matrix.axes[1].values.concat(otherMatrices.map(t => t.valueLabel));

		// Similar to the above, we iterate through the sibling matrices and the values of the
		// first axis (I can't recall if there's a reason the iteration is nested in the reverse order
		// to that above)
		otherMatrices.forEach((name, i) => {
			matrix.axes[0].values.forEach((v, j) => {
				matrix.data[`${j},${valueOffset + i}`] = otherMatrices[i].data[j];
			})
		});

		return matrix;

	} else {
		throw new Error(`Concatenating multi dimensional matrices together is not supported
(and probably isn\'t what you want anyway - think how confusing the graph would be!!!)`)
	}
}

module.exports = function () {
	this._matrix = concat(this.queries.map(query => query.getData()));
};

module.exports.getDimension = function () {
	if (this.queries[0].dimension === this.queries[1].dimension) {
		return this.queries[0].dimension + 1;
	} else {
		return this.queries[0].dimension;
	}
}

module.exports.concat = concat;
