'use strict';

function aggregators() {

}

function analyseFunctionCall (func, body) {
	if (typeof body === 'string' && /^('|").*\1/.test(body)) {
		body = body.substr(1, body.length -2);
	}

	return func.charAt(0) === '@' ? {aggregator: func, body} : {func, body};
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
			return this.deconstruct(str)
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
		console.log(functions)
		return {
			event: eventName,
			functions: functions
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
				let res = [analyseFunctionCall(func, body)]
				const next = this.deconstruct(str.substr(i + 1), this.openSingleQuotes, this.openDoubleQuotes)
				return next ? res.concat(next) : res
			}
		}
		return str;
	}
}
module.exports = function deconstruct (str) {
	return new Deconstructor().deconstructQuery(str);
}
