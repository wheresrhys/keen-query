
module.exports.cutoff = function (n, percentOrRaw, strategy, dimension) {
	const table = this.sortDesc(strategy, dimension);
	const refTable = strategy ? table.reduce(strategy, dimension) : table;
	const axis = dimension ? table.getAxis(dimension) : 0;
	if (percentOrRaw === 'percent') {
		n = refTable.reduce('sum').data * n / 100;
	}
	const map = {};
	if (refTable !== table) {
		throw new Error('TODO: handle cutoff based on some calculation of many values')
	}
	table.cellIterator((value, coords) => {
		if (value >= n) {
			map[coords] = value;
		}
	})
	table.data = map;
	table.axes[axis].values = table.axes[axis].values.slice(0, Object.keys(table.data).length);
	return table;
}

module.exports.top = function (n, percentOrRaw, strategy, dimension) {
	const table = this.sortDesc(strategy, dimension);
	const axis = dimension ? table.getAxis(dimension) : 0;
	if (percentOrRaw === 'percent') {
		n = n * table.size[axis] / 100
	}
	const map = {};
	table.cellIterator((value, coords) => {
		if (Number(coords.split(',')[axis]) < n) {
			map[coords] = value;
		}
	})
	table.data = map;
	// console.log(map)
	table.axes[axis].values = table.axes[axis].values.slice(0, n);
	return table;
}

module.exports.bottom = function (n, percentOrRaw, strategy, dimension) {
	const table = this.sortAsc(strategy, dimension);
	const axis = dimension ? table.getAxis(dimension) : 0;
	if (percentOrRaw === 'percent') {
		n = n * table.size[axis] / 100
	}
	const map = {};
	table.cellIterator((value, coords) => {
		if (Number(coords.split(',')[axis]) < n) {
			map[coords] = value;
		}
	})
	table.data = map;
	table.axes[axis].values = table.axes[axis].values.slice(0, n);
	return table;
}
