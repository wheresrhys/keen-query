'use strict';


function ascending (table) {

}

function simpleSort(table, direction) {
	const newData = table.humanize().rows.sort((r1, r2) => {
		return (r1[1] > r2[1] ? 1 : r1[1] < r2[1] ? -1 : 0) * (direction === 'desc' ? -1 : 1);
	});

	return table.clone({
		axes: [
			Object.assign({}, table.axes[0], {values: newData.map(r => r[0])})
		],
		data: newData.map(r => r[1])
	});
}


function complexSort (table, direction, strategy, dimension) {
	console.log(strategy, dimension)
	console.log(table.axes)
	// console.log(table.humanize())
	const referenceTable = table.reduce(strategy, dimension);
	console.log(referenceTable)
}

module.exports.ascending = function (strategy, dimension) {
	if (this.dimension === 1) {
		return simpleSort(this, 'asc');
	}
}

module.exports.descending = function (strategy, dimension) {
	if (this.dimension === 1) {
		return simpleSort(this, 'desc');
	} else {
		return complexSort(this, 'desc', strategy, dimension);
	}
}

	// dimension = typeof dimension === 'undefined' ? this.dimension - 1 : this.getAxis(dimension);
	// let table = this;
	// if (dimension !== this.dimension - 1) {
	// 	table = this.switchDimensions(dimension, null, 'shuffle');
	// }
	// let buckets = table.toNested(1, 'bottom');
	// const axes = table.axes.slice();

	// if (strategy === 'all') {

	// 	buckets = Object.keys(buckets).reduce((newBucket, k) => {
	// 		Object.keys(strategiesMap)
	// 			.map(strategy => strategiesMap[strategy](buckets[k]))
	// 			.forEach((val, i) => {
	// 				newBucket[k ? `${k},${i}` : i] = val;
	// 			});
	// 			return newBucket;
	// 	}, {});

	// 	axes.pop();
	// 	axes.push({
	// 		name: 'reduced by ...',
	// 		values: Object.keys(strategiesMap)
	// 	})
	// } else {
	// 	if (buckets['']) {
	// 		buckets = strategiesMap[strategy](buckets[''])
	// 	} else {
	// 		Object.keys(buckets).forEach(k => {
	// 			buckets[k] = strategiesMap[strategy](buckets[k])
	// 		});
	// 	}
	// 	axes.pop();
	// }

	// return table.clone({
	// 	axes,
	// 	data: buckets
	// })

// module.exports.reduceStrategies = strategiesMap;
