'use strict';

const KeenQuery = require('../keen-query');
const aggregators = {
	concat: require('./concat'),
	comparePast: require('./compare-past'),
	ratio: require('./ratio'),
	reduce: require('./reduce')
};
module.exports = function (conf) {
	const aggregator = {
		queries: conf.body.map(KeenQuery.build),
		aggregatorName: conf.aggregator,
		printer: print,
		aggregatorMethod: aggregators[conf.aggregator]
	};

	return aggregator;
};



module.exports.define = function (name, constructor) {
	aggregators[name] = constructor;
}


