'use strict';

const KeenQuery = require('../keen-query');
const printers = require('../printers');

const aggregators = {
	concat: require('./concat'),
	comparePast: require('./compare-past'),
	ratio: require('./ratio'),
	reduce: require('./reduce')
};

class Aggregator {
	constructor (conf) {
		const base = require('../index');
		this.queries = conf.body.map(base.build);
		this.aggregator = aggregators[conf.aggregator.substr(1)];
		this._printer = conf.print;
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
			.then(() => printers.call(this, style))
	}
}


module.exports = function (conf) {
	return new Aggregator(conf);
	// const aggregator = {
	// 	queries: conf.body.map(KeenQuery.build),
	// 	aggregatorName: conf.aggregator,
	// 	printer: print,
	// 	aggregatorMethod: aggregators[conf.aggregator]
	// };

	// return aggregator;
};






module.exports.define = function (name, constructor) {
	aggregators[name] = constructor;
}


