'use strict';

function getReferenceTable(table, direction) {
	return table.humanize().rows.sort((r1, r2) => {
		return (r1[1] > r2[1] ? 1 : r1[1] < r2[1] ? -1 : 0) * (direction === 'desc' ? -1 : 1);
	});
}

function simpleSort(table, direction) {
	const referenceTable = getReferenceTable(table, direction);

	return table.clone({
		axes: [
			Object.assign({}, table.axes[0], {values: referenceTable.map(r => r[0])})
		],
		data: referenceTable.map(r => r[1])
	});
}

function complexSort (table, direction, strategy, dimension) {
	const referenceTable = getReferenceTable(table.reduce(strategy, dimension), direction);
}

module.exports.ascending = function (strategy, dimension) {
	if (this.dimension === 1) {
		return simpleSort(this, 'asc');
	} else if (this.dimension === 2) {
		throw new Error('Cannot sort tables of dimension greater than 1. It\'s on the todo list though!');
		return complexSort(this, 'asc', strategy, dimension);
	} else {
		throw new Error('Cannot sort tables of dimesnion greater than 2');
	}
}

module.exports.descending = function (strategy, dimension) {
	if (this.dimension === 1) {
		return simpleSort(this, 'desc');
	} else if (this.dimension === 2) {
		throw new Error('Cannot sort tables of dimension greater than 1. It\'s on the todo list though!');
		return complexSort(this, 'desc', strategy, dimension);
	} else {
		throw new Error('Cannot sort tables of dimesnion greater than 2');
	}
}


function getReferenceTable(table, direction) {
	return table.humanize().rows.sort((r1, r2) => {
		return (r1[1] > r2[1] ? 1 : r1[1] < r2[1] ? -1 : 0) * (direction === 'desc' ? -1 : 1);
	});
}

function simpleSort(table, direction) {
	const referenceTable = getReferenceTable(table, direction);

	return table.clone({
		axes: [
			Object.assign({}, table.axes[0], {values: referenceTable.map(r => r[0])})
		],
		data: referenceTable.map(r => r[1])
	});
}



module.exports.property = function (prop) {
	const order = [].slice.call(arguments, 1);
	const dimension = this.getAxis(prop);
	if (dimension === -1) {
		throw new Error(`Attempting to do a custom sort on the property ${prop}, which doesn't exist`);
	}
	const originalValues = this.axes.find(a => a.property === prop).values;
	// this makes it easier to put the not found items last as the order
	// will go n = first, n-1 = second, ... , 0 = last, -1 = not found
	// we simply exchange 1 and -1 in the function below :o
	order.reverse();
	const orderedValues = originalValues.slice().sort((v1, v2) => {
		const i1 = order.indexOf(v1);
		const i2 = order.indexOf(v2);
		return i1 > i2 ? -1 : i1 < i2 ? 1 : 0;
	});
	const mapper = originalValues.map(v => orderedValues.indexOf(v))
	const newAxes = this.axes.slice();
	newAxes[dimension] = Object.assign({}, this.axes[dimension], {
		values: orderedValues
	});

	return this.clone({
		axes: newAxes,
		data: Object.keys(this.data).reduce((obj, k) => {
			const coords = k.split(',');
			coords[dimension] = mapper[coords[dimension]];
			obj[coords.join(',')] = this.data[k];
			return obj;
		}, {})
	});
}
