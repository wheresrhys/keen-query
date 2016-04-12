'use strict';
const ImmutableMatrix = require('./immutable-matrix');

function immutifyKeen () {

	if (!this.dimension) {
		return new ImmutableMatrix({
			axes: [],
			data: this._rawData.result,
			valueLabel: this.valueLabel
		});
	}

	const axes = this.dimensions.map(dimension => {
		if (dimension === 'timeframe') {
			return {
				property: 'timeframe',
				values: this._rawData.timeframes,
				type: 'timeframe'
			}
		}
		return {
			property: dimension,
			values: Object.keys(this._rawData.result.reduce((obj, res) => {
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
	var points = this._rawData.result;
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

	return new ImmutableMatrix({
		axes: axes,
		interval: this.intervalUnit,
		valueLabel: this.valueLabel,
		data: data
	});

}

function prepIntervalData () {
	let result;
	if (Array.isArray(this._rawData.result[0].value) && ['object', 'undefined'].indexOf(typeof this._rawData.result[0].value[0]) > -1) {
			// group by interval and prop
			result = this._rawData.result.reduce((normalizedResults, snapshot) => {
				return normalizedResults.concat(snapshot.value.map(obj => {
					obj.timeframe = snapshot.timeframe;
					return obj;
				}));
			}, []);
	} else {
		// group by interval but not by prop
		result = this._rawData.result.map(snapshot => {
			return {
				result: snapshot.value,
				timeframe: snapshot.timeframe
			}
		})
	}

	return {
		result: result,
		timeframes: this._rawData.result.map(snapshot => snapshot.timeframe)
	}
}

module.exports = function () {
	if (this.dimensions.indexOf('timeframe') > -1) {
		this._rawData = prepIntervalData.call(this);
	}
	return immutifyKeen.call(this);
}
