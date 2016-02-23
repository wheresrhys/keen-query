'use strict';

const ratio = require('./ratio');

// Basically just a wrapper for @ratio which mutiplies by 100 and rounds
module.exports = function () {
	this._table = ratio.calculateRatio(this.queries[0].getTable(), this.queries[1].getTable()).multiply(100).round(1);
	this._table.valueLabel = `${this.queries[0].getTable().valueLabel} / ${this.queries[1].getTable().valueLabel} %`;
}
