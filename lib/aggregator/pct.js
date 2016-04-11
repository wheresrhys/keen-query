'use strict';

const ratio = require('./ratio');

// Basically just a wrapper for @ratio which mutiplies by 100 and rounds
module.exports = function () {
	this._matrix = ratio.calculateRatio(this.queries[0].getData(), this.queries[1].getData()).multiply(100).round(1);
	this._matrix.valueLabel = `${this.queries[0].getData().valueLabel} / ${this.queries[1].getData().valueLabel} %`;
}
