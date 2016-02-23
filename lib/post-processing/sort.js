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
	console.log(referenceTable);


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
