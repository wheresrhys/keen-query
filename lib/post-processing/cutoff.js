
module.exports.cutoff = function (n, strategy, dimension) {
	const matrix = this.sortDesc(strategy, dimension);
	const refMatrix = strategy ? matrix.reduce(strategy, dimension) : matrix;
	const axis = dimension ? matrix.getAxis(dimension) : 0;
	if (typeof n === 'string' && n.substr(-1) === '%') {
		n = refMatrix.reduce(axis, 'sum').data * n.slice(0, -1) / 100;
	}


	const map = {};
	if (refMatrix !== matrix) {
		throw new Error('TODO: handle cutoff based on some calculation of many values')
	}
	matrix.cellIterator((value, coords) => {
		if (value >= n) {
			map[coords] = value;
		}
	})
	matrix.data = map;
	matrix.axes[axis].values = matrix.axes[axis].values.slice(0, Object.keys(matrix.data).length);
	return matrix;
}

module.exports.top = function (n, strategy, dimension) {
	const matrix = this.sortDesc(strategy, dimension);
	const axis = dimension ? matrix.getAxis(dimension) : 0;
	n = depercentify(n, matrix, axis);
	const map = {};

	matrix.cellIterator((value, coords) => {
		if (Number(coords.split(',')[axis]) < n) {
			map[coords] = value;
		}
	})
	matrix.data = map;
	matrix.axes[axis].values = matrix.axes[axis].values.slice(0, n);
	return matrix;
}



module.exports.bottom = function (n, strategy, dimension) {
	const matrix = this.sortAsc(strategy, dimension);
	const axis = dimension ? matrix.getAxis(dimension) : 0;
	n = depercentify(n, matrix, axis);

	const map = {};
	matrix.cellIterator((value, coords) => {
		if (Number(coords.split(',')[axis]) < n) {
			map[coords] = value;
		}
	})
	matrix.data = map;
	matrix.axes[axis].values = matrix.axes[axis].values.slice(0, n);
	return matrix;
}

function depercentify (n, matrix, axis) {
	if (typeof n === 'string' && n.substr(-1) === '%') {
		n = Number(n.slice(0, -1)) * matrix.size[axis] / 100
	}
	return n;
}
