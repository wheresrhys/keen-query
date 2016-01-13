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

function tabulate (results, dimensions, extraction, timeframes) {
	if (!dimensions.length) {
		return {
			axes: [],
			data: results,
			metric: extraction
		}
	}
	const axes = dimensions.map(dimension => {
		if (dimension === 'timeframe') {
			return {
				property: 'timeframe',
				values: timeframes,
				type: 'timeframe'
			}
		}
		return {
			property: dimension,
			values: Object.keys(results.reduce((obj, res) => {
				obj[res[dimension]] = true;
				return obj;
			}, {})).sort()
		}
	});

	const data = [];
	results.forEach(res => {
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
		metric: extraction
	}
}

function prepIntervalGroupedData (data, interval) {
	return {
		result: data.result.reduce((normalizedResults, snapshot) => {
			return normalizedResults.concat(snapshot.value.map(obj => {
				obj.timeframe = snapshot.timeframe;
				return obj;
			}));
		}, []),
		timeframes: data.result.map(snapshot => snapshot.timeframe)
	}
}

module.exports = function (data) {
	if (this.dimensions.indexOf('timeframe') > -1) {
		data = prepIntervalGroupedData(data);
	}
	return new Table(tabulate(data.result, this.dimensions, this.extraction, data.timeframes));
}
