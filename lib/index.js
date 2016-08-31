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
module.exports.build = build;
module.exports.execute = str => build(str).print();
module.exports.parseFilter = filters.parse;

module.exports.Aggregator = Aggregator;
module.exports.aggregate = Aggregator.aggregate;

module.exports.defineAggregator = (name, constructor) => {
	return Aggregator.define(name, constructor);
}

function stringifyFunctionConfigs (functions, indenter) {
	return functions.map(func => {
		return `${indenter}->${func.func}(${func.params.join(',')})`
	});
}


module.exports.format = function format (str, indenter, isSingleLine, startingIndent) {
	// note down how far to indent each line by default, which allows deep nesting
	startingIndent = startingIndent || '';

	// If nested we line break and indent as our 'newline' character
	// If on single line we use an empty string
	let lineBreak = '\n' + startingIndent;
	if (isSingleLine) {
		lineBreak = indenter = '';
	}

	// handle ASTs or raw keen-query strings
	const tree = typeof str === 'object' ? str : parser(str);


	if (tree.type === 'AggregateQuery') {
		// recursively format each subquery in the aggregate's body, indent them, and start a new line for each one
		const stringifiedBody = tree.body.map(qs => format(qs, indenter, isSingleLine, startingIndent + indenter))
			.map(str => indenter + str)
			.join(`,${lineBreak}`);

		// if there are shared functions print them all on a new line each
		const sharedFunctions = tree.functions.length ? (lineBreak + stringifyFunctionConfigs(tree.functions, indenter).join(lineBreak)) : '';
		return `@${tree.aggregator}(${lineBreak}\
${stringifiedBody}${lineBreak}\
)${sharedFunctions}`
	} else {
		const functions = stringifyFunctionConfigs(tree.functions, indenter).join(lineBreak);
		return `${tree.event}${lineBreak}${functions}`
	}
}
