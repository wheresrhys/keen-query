'use strict';

const postProcessing = require('../post-processing');
const formatTime = require('./format-time');

// utility used to plot a value in a nested array
function plotInMatrix (matrix, coords, val, endDepth) {
	let i = coords.shift();
	let toModify = matrix;
	while (coords.length - endDepth) {
		toModify[i] = toModify[i] || [];
		toModify = toModify[i];
		i = coords.shift();
	}
	toModify[i] = val;
}


// converts flat data structure e.g. { '0,2,3': 'value'} into a matrix of nested arrays
// positive endDepth means it will leave the lower levels of the matrix flattened once n levels have been nested
function toNested (data, endDepth) {
	const matrix = [];
	Object.keys(data).forEach(coords => {
		plotInMatrix(matrix, coords.split(','), data[coords], endDepth || 0);
	});
	return matrix;
}


// converts flat data structure e.g. { '0,2,3': 'value'} into a matrix of nested arrays
// similar to the above, but starts from the leaves rather than the root of the matrix
// the above function, when endLevel is defined, will return nested arrays which contain flat data structures as their leaves
// this function, on the other hand, will return a flat data structure with nested arrays as the leaves
function nestLowerLevels (flatData, endLevel) {
	const obj = {};
	Object.keys(flatData).forEach(k => {
		const coords = k.split(',');
		const bucketCoord = coords.slice(0, endLevel);
		obj[bucketCoord] = obj[bucketCoord] || {};
		obj[bucketCoord][coords.slice(endLevel)] = flatData[k];
	})
	Object.keys(obj).forEach(k => {
		obj[k] = toNested(obj[k]);
	})
	return obj
}

class ImmutableMatrix {
	constructor (conf) {
		this.name = conf.name;
		this.data = conf.data;
		this.interval = conf.interval;
		this.axes = conf.axes;
		this.valueLabel = conf.valueLabel;
		if (this.data == null || (typeof this.data === 'object' && !Object.keys(this.data).length)) { // eslint-disable-line
			throw new Error('No data points returned for this query');
		}
	}

	get dimension () {
		return this.axes.length;
	}

	get size () {
		return this.axes.map(a => a.values.length)
	}

	get timeHeadingsLocation () {
		return this.getAxis('timeframe');
	}

	getAxis (name) {
		if (typeof name === 'number') {
			return name;
		}
		// easier to type
		if (name === 'time') {
			name = 'timeframe';
		}
		let dimension = -1;
		this.axes.some((dim, i) => {
			if (dim.property === name) {
				dimension = i;
				return true;
			}
		});
		return dimension;
	}

	convertTime (format) {
		if (this.timeHeadingsLocation === -1) {
			return this;
		}
		const axes = this.axes.slice();
		axes[this.timeHeadingsLocation] = {
			property: 'timeframe',
			values: axes[this.timeHeadingsLocation].values.map(obj => {
				return formatTime(obj, this.interval, format)
			})
		};

		return this.clone({
			axes: axes
		});
	}

	// converts a table to a the sort of data structure graphing libraries typically require
	// i.e. a header row, then a number of rows with a heading in the first cell of each
	unflatten (timeFormat) {
		if (this.dimension > 2) {
			throw new Error('can\'t unflatten tables of greater than 2 dimensions');
		}
		const table = this.convertTime(timeFormat);
		const output = {};
		if (this.dimension === 0) {
			// just send back a single cell
			output.rows = [[table.valueLabel, table.data]]
			return output;
		} else if (table.dimension === 1) {
			// if (table.axes[0].property === '_headings') {
			// 	output.headings = table.axes[0].values;
			// } else {
				output.headings = [table.axes[0].property, table.valueLabel]
			// }
			output.rows = table.axes[0].values.map((label, i) => {
				return [label, table.data[i]]; // this works because [i] notation works on an object or an array :-)
			})
		} else {
			const data = table.toNested();

			output.headings = [table.axes[0].property].concat(table.axes[1].values);
			output.rows = table.axes[0].values.map((label, i) => {
				return [label].concat(data[i]);
			})
		}
		const cols = output.headings.length;
		output.rows.forEach(r => {
			for(let i = 0; i<cols;i++) {
				// transform empty values to 0 or empty strings for consumption by google charts
				r[i] = r[i] || (i > 0 ? 0 : '');
			}
		})
		return output;
	}

	// returns a nested 'matrix' of the data
	toNested (levels, startPoint) {
		if (startPoint === 'bottom') {
			return nestLowerLevels(this.data, this.dimension - (levels || 0));
		} else {
			return toNested(this.data, levels || 0);
		}
	}

	// iterates over every value in the flattened data stucture, calling func on each value
	// func expects (value, coordsString);
	cellIterator (func) {
		if (this.dimension === 0) {
			return func(this.data);
		}
		return Object.keys(this.data).reduce((obj, k) => {
			obj[k] = func(this.data[k], k);
			return obj;
		}, {});
	}

	// given a set of axes similar to this table's and  an array of coords
	// finds what the coords of the same point would be for a table with those axes
	// e.g copes with the scenario where this table has page.type of 'article', front', 'stream'
	// but the table being compared with only has 'article' and 'null'
	findEquivalentCoords (coords, alternateAxes) {

		// Convert coordinate strings to an array, and make a note to convert back
		let returnString;
		if (typeof coords === 'string' || typeof coords === 'number') {
			coords = String(coords).split(',');
			returnString = true;
		}

		// Iterate through each axis of this table
		coords = coords.reduce((newCoords, n, i) => {

			// Make a note of the current axis
			const referenceAxis = this.axes[i];

			// Find the same axis in the other table
			// Note - axes are expeceted to be in the sam order if they exist
			const newAxis = alternateAxes.find(a => a.property === referenceAxis.property);
			// Handle the case where the axis doesn't exist i.e the other table
			// is grouped less granularly and has fewer axes. e.g. where this table has a row,
			// the other table will only have a value so we will need fewer coordinates to specify
			// its position
			if (!newAxis) {
				return newCoords;
			}

			// get the value in the axes that this coordinate points to
			const referenceValue = referenceAxis.values[n];

			// find the index of this value in the equivalent axis in the other table
			// and push it onto the end of the new coordinates
			if (typeof referenceValue === 'string') {
				newCoords.push(newAxis.values.indexOf(referenceAxis.values[n]));
			} else {
				newCoords.push(newAxis.values.indexOf(newAxis.values.find(dateObj => {
					return dateObj.start === referenceAxis.values[n].start;
				})));
			}
			return newCoords;
		}, []);

		// convert back to a string if required
		return returnString ? coords : coords.join(',');
	}

	reduce () {
		return postProcessing.reduce.apply(this, arguments);
	}

	// returns a new table with values rounded to n decimal points
	round (points) {
		points = points || 0;
		return this.clone({
			data: this.cellIterator(val => {
				return Math.round(val * Math.pow(10, points)) / Math.pow(10, points);
			})
		});
	}

	multiply (number) {
		return this.clone({
			data: this.cellIterator(val => {
				return val * number;
			})
		});
	}

	divide (number) {
		return this.clone({
			data: this.cellIterator(val => {
				return val / number;
			})
		});
	}

	clone (overrides) {
		return new ImmutableMatrix(Object.assign({}, this, overrides || {}));
	}

	// swaps two dimensions of the table
	// e.g. can convert a time x deviceType table to a deviceType x time table
	// a - index or name of the first dimension to move (if null, picks the first dimension available)
	// b - index or name of the second dimension to move (if null, picks the last dimension available)
	// method - shuffle or swap.
	// - swap does a straight swap of the dimensions, leaving all others unchanged
	// - shuffle (generally only applied when moving a dimension to be the first or last) shuffles all other dimensions along to make room
	switchDimensions (a, b, method) {

		if (this.dimensions < 2) {
			throw new Error('Cannot switch dimensions - This is not a multidimensional table!');
		}
		// shuffle by default when only asking to move one value
		method = method || ((a == null || b == null) ? 'shuffle' : 'swap'); //eslint-disable-line

		// To perform the operation we need to convert names of axes to their numerical positions
		a = (a == null) ? 0 : this.getAxis(a); //eslint-disable-line
		b = (b == null) ? this.dimension - 1 : this.getAxis(b); //eslint-disable-line

		if (a > this.dimensions || b > this.dimensions) {
			throw new Error(`This table does not have a ${Math.max(a, b)} dimension`);
		}

		// ...it happens
		if (a === b) {
			return this;
		}

		// to ease the logic later we swap the axes if necessary so we only ever have to
		// move things in one direction
		if (a > b) {
			const tmp = a;
			a = b;
			b = tmp;
		}

		// clone the axes and keep a pointer to the a axis
		const axes = this.axes.slice();
		const tmp = axes[a];

		// splice and dice to swap the axes
		if (method === 'swap') {
			axes[a] = axes[b];
			axes[b] = tmp;
		} else if (method === 'shuffle') {
			axes.splice(a, 1, axes[b]);
			axes.splice(b, 1, tmp);
		}

		// ... but that was (more or less) just the labels done. Now we need to switch the data about
		return this.clone({
			axes: axes,
			data: Object.keys(this.data).reduce((map, k) => {
				// luckily, because it's a flat data structure :), we can jsut applu the same trick
				// as above to the coordinate strings
				const coords = k.split(',');
				const tmp = coords[a];
				if (method === 'swap') {
					coords[a] = coords[b];
					coords[b] = tmp;
				} else if (method === 'shuffle') {
					coords.splice(a, 1, coords[b]);
					coords.splice(b, 1, tmp);
				}

				map[coords.join(',')] = this.data[k];
				return map;
			}, {})
		});
	}
}

module.exports = ImmutableMatrix;

// Post processing methods can be quite convoluted, so are defined elsewhere
// and mixed back in to the prototype here
postProcessing.mixin(ImmutableMatrix.prototype);

// So they can be called on aggregators and keen-query objects all post processing methods
// can also, via this mixin, made available on any object that wraps a table
module.exports.mixin = function (wrapperPrototype) {
	postProcessing.mixin(wrapperPrototype, (method, methodName) => {
		return function () {
			const target = this.clone(true);
			target._postProcessors = target._postProcessors || [];
			target._postProcessors.push({
				func: methodName,
				params: [].slice.call(arguments)
			});

			if (target._matrix) {
				target._matrix = method.apply(target.getData(), [].slice.call(arguments))
			}

			return target;
		}
	});
}




function detectTableGaps (table1, table2) {
	return table2.axes.some((a, i) => {
		return table1.axes[i].values.map(v => v.toString).join('|') !== a.values.map(v => v.toString).join('|');
	});
}


module.exports.isGappy = function (table2, table1) {
	return detectTableGaps(table1, table2) || detectTableGaps(table2, table1);
}


