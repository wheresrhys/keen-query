'use strict';

const KeenQuery = require('../keen-query');
const printers = require('../printers');
const reduce = require('../reduce')

const aggregators = {
	concat: require('./concat'),
	// comparePast: require('./compare-past'),
	ratio: require('./ratio')
};

class Aggregator {
	constructor (conf) {
		const base = require('../index');
		this.queries = conf.body.map(base.build);
		this.aggregator = aggregators[conf.aggregator.substr(1)];
		this._printer = conf.print;
	}

	reduce () {
		return reduce.apply(this, [].slice.call(arguments))
	}

	print (style) {

		if (!style && this._printer) {
			return this.print.call(this, this._printer);
		}

		if (style === 'qs' || style === 'qo' || style === 'url') {
			return Promise.all(this.queries.map(q => q.print('')));
		}

		if (this._table) {
			return Promise.resolve(printers.call(this, style))
		}

		return Promise.all(this.queries.map(q => q.print('')))
			.then(() => this.aggregator())
			.then(() => {
				if (this._reductions) {
					this._reductions.forEach(opts => {
						this._table.reduce(opts);
					})
				}
				return printers.call(this, style)
			})
	}
}


module.exports = function (conf) {
	return new Aggregator(conf);
};






module.exports.define = function (name, constructor) {
	aggregators[name] = constructor;
}


