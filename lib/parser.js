'use strict';

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

function analyseFunctionCall (func, body) {
	if (func.charAt(0) === '@') {
		return {aggregator: func, body};
	}
	if (typeof body === 'string') {
		if (/^('|").*\1/.test(body)) {
			body = body.substr(1, body.length -2);
		}
		body = body.split()
	}

	return {func, params: body};
}

class Deconstructor {
	constructor (aggregator) {
		this.aggregator = aggregator;
		this.openSingleQuotes = 0;
		this.openDoubleQuotes = 0;
	}

	deconstructAggregator (str) {

		this.str = str;

		if (str.charAt(0) === '@') {
			const query = this.deconstruct(str);
			query.print = this.topLevel && this.print
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
		str = firstCut.join('->');
		const functions = this.deconstruct(str);
		return {
			event: eventName,
			functions: functions,
			print: this.topLevel && this.print
		}
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
					body = new Deconstructor(func.substr(1)).deconstructAggregator(body);
				}
				if (func === 'print') {
					this.print = body;
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
module.exports = function deconstruct (str) {
	const deconstructor = new Deconstructor();
	deconstructor.topLevel = true;
	deconstructor.str = str;
	return deconstructor.deconstructQuery(str);
}
