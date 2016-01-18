const KeenQuery = require('./keen-query');
const parser = require('./parser');
const aggregators = require('./aggregators');

function buildAggregator (queryConf) {
	console.log('Running aggregate query:', queryConf.str);
	// TODO create an aggregate wrapper
	return aggregators(queryConf);
}



function build (queryConf) {
	if (typeof queryConf === 'string') {
		queryConf = parser(queryConf);
	}

	if (queryConf.aggregator) {
		return buildAggregator(queryConf);
	}
	console.log('Running simple query', queryConf.str)
	const keenQuery = new KeenQuery(queryConf.event);
	keenQuery._printer = queryConf.print;
	keenQuery._postProcessing = queryConf.postProcessing;
	return queryConf.functions.reduce((keenQuery, transform) => {
		return keenQuery[transform.func].apply(keenQuery, transform.params || []);
	}, keenQuery);
}

module.exports = KeenQuery;
module.exports.build = build;
module.exports.execute = str => build(str).print();