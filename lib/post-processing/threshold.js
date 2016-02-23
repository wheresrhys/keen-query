'use strict';

const concatUtil = require('../aggregator/concat').concat;

module.exports.threshold = function (value, name) {
	value = Number(value);
	if (this.timeHeadingsLocation === -1) {
		throw new Error ('setting thresholds only supported for graphs that track trend over time. Maybe you want ->target()')
	}

	const thresholdTable = this.clone();

	thresholdTable.axes = [thresholdTable.axes[this.timeHeadingsLocation]];
	thresholdTable.valueLabel = name;

	thresholdTable.data = thresholdTable.axes[0].values.reduce((obj, val, i) => {
		obj[i] = value;
		return obj;
	}, {})
	return concatUtil([this, thresholdTable]);
}
