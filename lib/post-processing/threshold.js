'use strict';

const concatUtil = require('../aggregator/concat').concat;

module.exports.threshold = function (value, name) {
	value = Number(value);
	if (this.timeHeadingsLocation === -1) {
		throw new Error ('setting thresholds only supported for graphs that track trend over time. Maybe you want ->target()')
	}

	const thresholdMatrix = this.clone();

	thresholdMatrix.axes = [thresholdMatrix.axes[this.timeHeadingsLocation]];
	thresholdMatrix.valueLabel = name;

	thresholdMatrix.data = thresholdMatrix.axes[0].values.reduce((obj, val, i) => {
		obj[i] = value;
		return obj;
	}, {})
	return concatUtil([this, thresholdMatrix]);
}
