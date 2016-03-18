const KeenQuery = require('./keen-query');
const parser = require('./parser');
const Aggregator = require('./aggregator');

function build (queryConf, name) {
	if (typeof queryConf === 'string') {
		queryConf = parser(queryConf);
	}

	if (queryConf.aggregator) {
		return Aggregator.factory(queryConf)
	}

	const keenQuery = new KeenQuery(queryConf.event);
	keenQuery.name = name;
	keenQuery._printer = queryConf.print;
	keenQuery._postProcessors = queryConf.postProcessing;
	return queryConf.functions.reduce((keenQuery, transform) => {
		return keenQuery[transform.func].apply(keenQuery, transform.params || []);
	}, keenQuery);
}

module.exports = KeenQuery;
module.exports.Aggregator = Aggregator;
module.exports.defineAggregator = (name, constructor) => {
	return Aggregator.define(name, constructor);
}
module.exports.aggregate = Aggregator.aggregate;
module.exports.build = build;
module.exports.execute = str => build(str).print();
module.exports.parseFilter = parser.parseFilter;
