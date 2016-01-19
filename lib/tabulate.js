'use strict';
const utils = require('./utils');
const Table = require('./table');

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


	const table = new Table({
		axes: axes,
		data: [],
		metric: this.extraction,
		interval: this.intervalUnit
	});

	this._data.result.forEach(res => {
		const coords = axes.map(axis => {
			let val = res[axis.property];
			if (val === null || val === false || val === true) {
				val = '' + val;
			}
			return axis.values.indexOf(val);
		});

		table.plot(coords, res.result)
	});

	return table;
}

function prepIntervalData () {
	let result;
	if (Array.isArray(this._data.result[0].value) && typeof this._data.result[0].value[0] === 'object') {
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
