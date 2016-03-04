'use strict';
const Table = require('./table');

function tabulate () {

	if (!this.dimension) {
		return new Table({
			axes: [],
			data: this._data.result,
			valueLabel: this.valueLabel
		});
	}

	const axes = this.dimensions.map(dimension => {
		if (dimension === 'timeframe') {
			return {
				property: 'timeframe',
				values: this._data.timeframes,
				type: 'timeframe'
			}
		}
		return {
			property: dimension,
			values: Object.keys(this._data.result.reduce((obj, res) => {
				obj[res[dimension]] = true;
				return obj;
			}, {})).sort()
		}
	});

	// Using ES5 as this bit of code is a real bottleneck, so want full control over the babelified output
	/* eslint-disable */
	var indexMemo = {};
	axes.forEach(a => {
		if (a.property !== 'timeframe') {
			a.values.forEach(function (v, i) {
				indexMemo[a.property + '::' + v] = i;
			})
		}
	})

	var data = {};
	var points = this._data.result;
	var i = points.length;
	var res;
	var coords;
	var val;

	while (i--) {
		res = points[i];

		coords = axes.map(function (axis) {

			val = res[axis.property];
			if (val === null || val === false || val === true) {
				val = '' + val;
			}

			if (axis.property === 'timeframe') {
				return axis.values.indexOf(val);
			}

			return indexMemo[axis.property + '::' + val];
		});

		data[coords.join(',')] = res.result;
	}
	/* eslint-enable */

	return new Table({
		axes: axes,
		interval: this.intervalUnit,
		valueLabel: this.valueLabel,
		data: data
	});

}

function prepIntervalData () {
	let result;
	if (Array.isArray(this._data.result[0].value) && ['object', 'undefined'].indexOf(typeof this._data.result[0].value[0]) > -1) {
			// group by interval and prop
			result = this._data.result.reduce((normalizedResults, snapshot) => {
				return normalizedResults.concat(snapshot.value.map(obj => {
					obj.timeframe = snapshot.timeframe;
					return obj;
				}));
			}, []);
	} else {
		// group by interval but not by prop
		result = this._data.result.map(snapshot => {
			return {
				result: snapshot.value,
				timeframe: snapshot.timeframe
			}
		})
	}

	return {
		result: result,
		timeframes: this._data.result.map(snapshot => snapshot.timeframe)
	}
}

module.exports = function () {
	if (this.dimensions.indexOf('timeframe') > -1) {
		this._data = prepIntervalData.call(this);
	}
	return tabulate.call(this);
}
