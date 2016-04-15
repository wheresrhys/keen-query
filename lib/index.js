'use strict';

const KeenQuery = require('./keen-query');
const parser = require('./parser');
const Aggregator = require('./aggregator');
const filters = require('./keen-query/filters');

function build (queryConf, name) {
	if (typeof queryConf === 'string') {
		queryConf = parser(queryConf);
	}

	if (queryConf.aggregator) {
		return Aggregator.factory(queryConf)
	}

	const keenQuery = new KeenQuery(queryConf.event);
	keenQuery.name = name;
	keenQuery._postProcessors = queryConf.postProcessing;
	return queryConf.functions.reduce((keenQuery, transform) => {
		if (transform.func === 'print') {
			keenQuery._printer = transform.params[0];
			return keenQuery;
		}
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

module.exports.parseFilter = filters.parse;

function stringifyFunctionConfigs (functions, indenter) {
	return functions.map(func => {
		return `${indenter}->${func.func}(${func.params.join(',')})`
	});
}

module.exports.format = function format (str, indenter, isSingleLine) {

	let lineBreak = '\n';
	if (isSingleLine) {
		lineBreak = indenter = '';
	}
	const tree = typeof str === 'object' ? str : parser(str);

	if (tree.type === 'AggregateQuery') {
		return `@${tree.aggregator}(${lineBreak}\
${indenter}${tree.body.map(qs => format(qs, indenter, true)).join(`,${lineBreak}${indenter}`)}${lineBreak}\
)${lineBreak}\
${stringifyFunctionConfigs(tree.functions, indenter).join(lineBreak)}`
	} else {
		return `${tree.event}${lineBreak}${stringifyFunctionConfigs(tree.functions, indenter).join(lineBreak)}`
	}
}
