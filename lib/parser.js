'use strict';

const mappings = require('./mappings');
const utils = require('./utils');

function merge(query, next) {
	if (query.func) {
		return [query].concat(next)
	}
	query.functions = (query.functions || []).concat(next);
	return query;
}

function parseFilter (filter) {
	let filterConf = /^([^!~\?]*)(=|!=|>|<|~|!~|\?|!\?)(.+)$/.exec(filter);
	if (filterConf) {
		if (!filterConf[1] && !filterConf[3]) {
			throw new Error(`Filter ${filter} must specify a property name to filter on and a value to match e.g. ->filter(user.uuid${filter}abcd)`);
		}
		if (!filterConf[1]) {
			throw new Error(`Filter ${filter} must specify a property name to filter on on the left hand side e.g. ->filter(user.uuid${filter})`);
		}
		if (!filterConf[3]) {
			if (filterConf[2] === '?' || filterConf[2] === '!?') {
				throw new Error(`Filter ${filter} must specify one or more comma-separated values to match on the right hand side e.g ->filter(${filter}apple,pear,cherry)`);
			} else {
				throw new Error(`Filter ${filter} must specify a value to match on the right hand side e.g ->filter(${filter}apple)`);
			}
		}

		if (filterConf[2] === '!?') {
			// TODO be carefuller around quoted commas
			return filterConf[3]
				.split(',')
				.map(val => {
					return {
						property_name: filterConf[1],
						operator: mappings.filterShorthands['!='].operator,
						property_value: utils.transformValue(val)
					}
				});
		}

		return {
			property_name: filterConf[1],
			operator: mappings.filterShorthands[filterConf[2]].operator,
			property_value: utils.transformValue(filterConf[3], mappings.filterShorthands[filterConf[2]].handleList)
		};
	}

	const unary = /^(\!)?(.+)$/.exec(filter);
	if (unary) {
		return {
			property_name: unary[2],
			operator: 'exists',
			property_value: !unary[1]
		};
	}

	throw new Error('Filter structure not recognised');
}


function analyseFunctionCall (func, body) {
	func = func.trim();
	if (func.charAt(0) === '@') {
		return {aggregator: func, body};
	}
	if (typeof body === 'string') {
		if (/^('|").*\1/.test(body)) {
			body = body.substr(1, body.length -2);
		}
		if (body) {
			if (func === 'filter') {
				body = [parseFilter(body)];
			} else {
				body = body.split(',').map(str => str.trim())
			}
		} else {
			body = [];
		}
	}
	return {func, params: body};
}

const extractionNames = ['with', 'min', 'max', 'sum', 'avg', 'med', 'count', 'select', 'median', 'pct', 'percentile'];

function validateStructure (conf) {
	return typeof conf !== 'string';
}

function validateExtraction (conf) {
	if (conf.func !== 'count' && !conf.params.length) {
		throw new Error(`Extraction ${conf.func} must be passed a property e.g. ->${conf.func}(user.uuid)`);
	}
}

function validateParams (conf, length) {
	if (!conf.params.length) {
		throw new Error(`${conf.func} must be passed a value e.g. ->${conf.func}(thingummy)`);
	}

	if (length && conf.params.length !== length) {
		throw new Error(`${conf.func} must be passed ${length} values`);
	}
	return true;
}

const reduceStrategies = Object.assign({all: true}, require('./post-processing/reduce').reduceStrategies);

function validateReduce(conf) {
	if (!reduceStrategies[conf.params[0]]) {
		throw new Error(`Invalid reduction ${conf.params[0]}`);
	}
}

// function validateSort(conf) {
	// TODO proper sort validation
	// if (!reduceStrategies[conf.params[0]]) {
	// 	throw new Error(`Invalid reduction ${conf.params[0]}`);
	// }
// }

function validateRelTime(conf) {
	if (Number(conf.params[0]) && parseInt(conf.params[0], 10) !== Number(conf.params[0])) {
		throw new Error('->relTime() must be passed an integer to specify number of days');
	}

	if (!/(this_|previous_)?\d+(_(minutes|hours|days|weeks|months|years))?/.test(conf.params[0])) {
		throw new Error('Invalid timeframe string passed to ->relTime() (see cheatsheet or ask a dev)');
	}

}

const acceptedIntervals = Object.keys(mappings.intervalUnits)
	.reduce((arr, k) => {
		return arr.concat([k, mappings.intervalUnits[k]]);
	}, []);

const acceptedIntervalsString = Object.keys(mappings.intervalUnits)
	.map(k => {
		return `${k} or ${mappings.intervalUnits[k]}`;
	}).join(', ');

function validateInterval(conf) {
	const intervalUnit = conf.params[0].replace(/^(every_)?\d+_/, '');
	if (acceptedIntervals.indexOf(intervalUnit) === -1) {
		throw new Error(`Invalid interval passed in to ->interval(). Accepted values are ${acceptedIntervalsString} (possibly prefixed by e.g. '2_')`);
	}
}

function validateAbsTime(conf) {
	conf.params.forEach(str => {
		const t = new Date(str).getTime();
		if (t !== t) { // NaN
			throw new Error('Invalid date string passed to ->absTime()');
		}
	})
}


function validateRound(conf) {
	if (conf.params.length) {
		if (conf.params.length > 1) {
			throw new Error('->round() only accepts a single number');
		}
		if (parseInt(conf.params[0], 10) !== Number(conf.params[0])) {
			throw new Error('->round() must be passed an integer');
		}
	}
}

function validateFunction (conf) {
	const name = typeof conf === 'string' ? conf : conf.func;
	const isValidStructure = validateStructure(conf);

	if (extractionNames.indexOf(name) > -1) {
		return isValidStructure && validateExtraction(conf);
	}

	if (['filter', 'group'].indexOf(name) > -1) {
		return isValidStructure && validateParams(conf);
	}

	if (name === 'reduce') {
		return isValidStructure && validateParams(conf) && validateReduce(conf);
	}



	if (['sortAsc', 'sortDesc', 'plotThreshold', 'cutoff', 'top', 'bottom', 'sortProp', 'relabel'].indexOf(name) > -1) {
		return isValidStructure;
		// return isValidStructure && validateSort(conf);
	}

	if (name === 'multiply' || name === 'divide') {
		return isValidStructure && validateParams(conf);
	}


	if (name === 'relTime') {
		return isValidStructure && validateParams(conf, 1) && validateRelTime(conf);
	}

	if (name === 'absTime') {
		return isValidStructure && validateParams(conf, 2) && validateAbsTime(conf);
	}

	if (name === 'interval') {
		return isValidStructure && validateParams(conf, 1) && validateInterval(conf);
	}

	if (name === 'round') {
		return isValidStructure && validateRound(conf);
	}

	if (['raw', 'tidy'].indexOf(name) > -1) {
		return isValidStructure;
	}

	if (isValidStructure) {
		throw new Error(`Invalid function name ${name}`);
	} else {
		const func = conf.replace(/\([^)]*$/, '');
		throw new Error(`Function ${func} must end with opening and closing parantheses e.g. ->${func}() or ->${func}(thing)`);
	}
}

class Deconstructor {
	constructor (aggregator, parent) {
		this.aggregator = aggregator;
		this.openSingleQuotes = 0;
		this.openDoubleQuotes = 0;
		this.parent = parent;
	}

	deconstructAggregator (str) {

		this.str = str.trim();

		// if (str.charAt(0) === '@') {
		// 	const query = this.deconstruct(str);
		// 	query.print = !this.parent && this.print
		// 	query.postProcessing = this.postProcessing;
		// 	return query;
		// }

		const queries = [];
		while(this.str) {
			const str = this.str.trim();
			this.str = null;
			queries.push(str.charAt(0) === '@' ? this.deconstruct(str) : this.deconstructQuery(str));
		}

		if (str.charAt(0) === '@' && queries.length === 1) {
			const query = queries[0];
			query.print = !this.parent && this.print
			return query;
		}

		return queries;
	}

	deconstructQuery (str) {
		str = str.trim();
		if (str.charAt(0) === '@') {
			return this.deconstructAggregator(str);
		}
		const firstCut = str.split('->');
		const eventName = firstCut.shift().trim();
		if (!eventName || eventName.indexOf('(') > -1) {
			throw new Error('Queries must begin with an event name e.g. page:view, dwell');
		}

		str = firstCut.join('->');

		let functions = this.deconstruct(str);
		// take care of the edge case where e.g. we want to validate dwell->count
		if (typeof functions === 'string') {
			functions = [functions];
		}
		if (!Array.isArray(functions) || !functions.some(conf => {
			return extractionNames.indexOf(conf.func) > -1
		})) {
			throw new Error('An extraction e.g. ->count(), must be specified');
		}

		if (functions.filter(conf => {
			return extractionNames.indexOf(conf.func) > -1
		}).length > 1) {
			throw new Error('Only one extraction e.g. ->count(), must be specified');
		}

		functions.forEach(validateFunction);

		return {
			event: eventName,
			functions: functions,
			print: this.print
		}
	}

	setPrint (method) {
		if (this.parent) {
			this.parent.setPrint(method)
		} else {
			this.print = method;
		}
	}

	deconstruct (str) {
		str = str.trim();
		if (!str) {
			return str;
		}

		if (this.aggregator && str.indexOf(',') === 0) {
			this.str = str.substr(1);
			return;
		}

		str = str.replace(/^->/, '');

		let openParantheses = 0;
		let char;
		let func;
		let body;

		for (let i = 0, il = str.length; i < il; i++) {
			char = str.charAt(i);
			switch (char) {
				case '(':
					!this.openDoubleQuotes && !this.openSingleQuotes && openParantheses++;
					break;
				case ')':
					!this.openDoubleQuotes && !this.openSingleQuotes && openParantheses--;
					break;
				case '"':
					!this.openSingleQuotes && (this.openDoubleQuotes = Math.abs(this.openDoubleQuotes - 1));
					break;
				case '\'':
					!this.openDoubleQuotes && (this.openSingleQuotes = Math.abs(this.openSingleQuotes - 1));
					break;
				case 'default':
					break;
			}


			if (openParantheses && !func) {
				func = str.substr(0, i);
			} else if (func && !openParantheses && !body) {
				body = str.substr(func.length + 1, i - (func.length + 1))
				if (func.charAt(0) === '@') {
					body = new Deconstructor(func.substr(1), this).deconstructAggregator(body);
				}
				if (func === 'print') {
					this.setPrint(body);
					return;
				}

				let res = analyseFunctionCall(func, body);

				const next = this.deconstruct(str.substr(i + 1), this.openSingleQuotes, this.openDoubleQuotes)
				return next ? merge(res, next) : res.aggregator ? res : [res]
			}
		}
		return str;
	}
}

function deconstruct (str) {
	str = str.trim();
	const deconstructor = new Deconstructor();
	deconstructor.str = str;
	const conf = deconstructor.deconstructQuery(str);
	return conf;
}

module.exports = deconstruct;
module.exports.parseFilter = parseFilter;
