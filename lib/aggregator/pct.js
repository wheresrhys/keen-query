'use strict';

const ratio = require('./ratio');

const Table = require('../table');

module.exports = function () {
	this._table = ratio.calculateRatio(this.queries[0].getTable(), this.queries[1].getTable()).multiply(100).round();
	this._table.valueLabel = `${this.queries[0].getTable().valueLabel} / ${this.queries[1].getTable().valueLabel} %`
}
