'use strict';

const mappings = require('./mappings');
const utils = require('./utils');

function merge(query, next) {

	if (Array.isArray(query)) {
		return query.map(q => merge(q, next))
	}
	if (query.aggregator) {
		query.body.forEach(q => {
			merge(q, next);
		})
		return query;
	} else if (query.functions) {
		query.functions = query.functions.concat(next);
		return query;
	} else {
		return [query].concat(next)
	}
}

function parseFilter (filter) {
	let filterConf = /^([^\!\~\?]*)(=|\!=|>|<|\~|\?)([^=\~\?]*)$/.exec(filter);
	console.log(filterConf);
	if (filterConf) {
		if (!filterConf[1] && !filterConf[3]) {
			throw `Filter ${filter} must specify a property name to filter on and a value to match e.g. ->filter(user.uuid${filter}abcd)`;
		}
		if (!filterConf[1]) {
			throw `Filter ${filter} must specify a property name to filter on on the left hand side e.g. ->filter(user.uuid${filter})`;
		}
		if (!filterConf[3]) {
			if (filterConf[2] === '?') {
				throw `Filter ${filter} must specify one or more comma-separated values to match on the right hand side e.g ->filter(${filter}apple,pear,cherry)`;
			} else {
				throw `Filter ${filter} must specify a value to match on the right hand side e.g ->filter(${filter}apple)`;
			}
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

	throw 'Filter structure not recognised';
}


function analyseFunctionCall (func, body) {
	console.log('rhys', func, typeof body, body);
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
				body = body.split(',')
			}
		} else {
			body = [];
		}
	}

	return {func, params: body};
}

const extractionNames = ['min', 'max', 'sum', 'avg', 'med', 'count', 'select'];

function validateStructure (conf) {
	if (typeof conf === 'string') {
		throw `Function ${conf} must end with opening and closing parantheses e.g. ->${conf}() or ->${conf}(thing)`;
	}
}

function validateExtraction (conf) {
	validateStructure(conf);
	if (conf.func !== 'count' && !conf.params.length) {
		throw `Extraction ${conf.func} must be passed a property e.g. ->${conf.func}(user.uuid)`;
	}
}

function validateFilter (conf) {
	validateStructure(conf);
	if (!conf.params.length) {
		throw `Filters must be passed a value e.g. ->filter(user.uuid=abcd)`;
	}
	// if ()
}

function validateFunction (conf) {
	console.log(conf)
	const name = typeof conf === 'string' ? conf : conf.func;

	if (extractionNames.indexOf(name) > -1) {
		return validateExtraction(conf);
	}

	if (name === 'filter') {
		return validateFilter(conf);
	}

	throw `Invalid function name ${name}`;
}

class Deconstructor {
	constructor (aggregator, parent) {
		this.aggregator = aggregator;
		this.openSingleQuotes = 0;
		this.openDoubleQuotes = 0;
		this.parent = parent;
	}

	deconstructAggregator (str) {

		this.str = str;

		if (str.charAt(0) === '@') {
			const query = this.deconstruct(str);
			query.print = !this.parent && this.print
			query.postProcessing = this.postProcessing;
			return query;
		}

		const queries = [];
		while(this.str) {
			const str = this.str;
			this.str = null;
			queries.push(str.charAt(0) === '@' ? this.deconstruct(str) : this.deconstructQuery(str));
		}
		return queries;
	}

	deconstructQuery (str) {

		if (str.charAt(0) === '@') {
			return this.deconstructAggregator(str);
		}
		const firstCut = str.split('->');
		const eventName = firstCut.shift();
		if (!eventName || eventName.indexOf('(') > -1) {
			throw 'Queries must begin with an event name e.g. page:view, dwell'
		}

		str = firstCut.join('->');
		let functions = this.deconstruct(str);
		// take care of the edge case where e.g. we want to validate dwell->count
		if (typeof functions === 'string') {
			functions = [functions];
		}

		functions.forEach(validateFunction);
		return {
			event: eventName,
			functions: functions,
			print: this.print,
			postProcessing: this.postProcessing || []
		}
	}

	setPrint (method) {
		if (this.parent) {
			this.parent.setPrint(method)
		} else {
			this.print = method;
		}
	}

	setReduction (opts) {
		this.postProcessing = this.postProcessing || [];
		this.postProcessing.push(opts);
	}

	deconstruct (str) {

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
				if (func === 'reduce' || func === 'round') {
					this.setReduction(res);
				}

				const next = this.deconstruct(str.substr(i + 1), this.openSingleQuotes, this.openDoubleQuotes)
				if (func === 'reduce' || func === 'round') {
					return next;
				} else {
					return next ? merge(res, next) : res.aggregator ? res : [res]
				}

			}
		}
		return str;
	}
}
module.exports = function deconstruct (str) {
	const deconstructor = new Deconstructor();
	deconstructor.str = str;
	// if (str.charAt(0) !== '@') {
	// 	str = `@identity(${str})`;
	// };
	try {
		const conf = deconstructor.deconstructQuery(str);
		console.log(JSON.stringify(conf, null, '\t'))
		return conf;
	} catch (e) {
		console.log(e);
	}

}

