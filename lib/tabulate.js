'use strict';
const utils = require('./utils');
const Table = require('./table');
function plot (target, coords, res) {
  let i = coords.shift();
  let toModify = target;
	while (coords.length) {
    toModify[i] = toModify[i] || [];
		toModify = toModify[i];
		i = coords.shift();
  }
  toModify[i] = res
  return target
}

function tabulate () {
	if (!this.dimensions.length) {
		return {
			axes: [],
			data: this._data.result,
			metric: this.extraction
		}
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

	const data = [];
	this._data.result.forEach(res => {
		const coords = axes.map(axis => {
			let val = res[axis.property];
			if (val === null || val === false || val === true) {
				val = '' + val;
			}
			return axis.values.indexOf(val);
		});

		plot(data, coords, res.result)
	})
	return {
		axes: axes,
		data: data,
		metric: this.extraction
	}
}

function prepIntervalGroupedData () {
	return {
		result: this._data.result.reduce((normalizedResults, snapshot) => {
			return normalizedResults.concat(snapshot.value.map(obj => {
				obj.timeframe = snapshot.timeframe;
				return obj;
			}));
		}, []),
		timeframes: this._data.result.map(snapshot => snapshot.timeframe)
	}
}

module.exports = function () {

	if (this.dimensions.indexOf('timeframe') > -1) {
		this._data = prepIntervalGroupedData.call(this);
	}
	return new Table(tabulate.call(this));
}
