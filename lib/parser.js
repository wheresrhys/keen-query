'use strict';

function aggregators() {

}

class Deconstructor {
	constructor (aggregator) {
		this.aggregator = aggregator;
		this.openSingleQuotes = 0;
		this.openDoubleQuotes = 0;
	}

	deconstructAggregator (str) {
		this.str = str;
		const queries = [];
		while(this.str) {
			const str = this.str;
			this.str = null;
			queries.push(this.deconstruct(str));
		}
		return queries;
	}

	deconstruct (str) {
		if (!str) {
			return str;
		}
		if (this.aggregator) {
			if (this.aggregator === 'ratio' && str.indexOf('/') === 0) {
				this.str = str.substr(1);
				return;
			} else if (this.aggregator === 'concat' && str.indexOf('..') === 0) {
				this.str = str.substr(2);
				return;
			}
		}
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

				let res = [{func, body}]
				const next = this.deconstruct(str.substr(i + 1), this.openSingleQuotes, this.openDoubleQuotes)
				return next ? res.concat(next) : res
			}
		}
		return str;
	}
}
function deconstruct (str) {
	return new Deconstructor().deconstruct(str);
}


module.exports = function (str) {
	const structure = deconstruct(str);
	if (/^@/.test(str)) {
		console.log('Running aggregate query:', str);
		return aggregators(str);
	}

	const firstCut = str.split('->');
	const eventName = firstCut.shift();
	str = firstCut.join('->');

	let openParantheses = 0;
	let openSingleQuotes = 0;
	let openDoubleQuotes = 0;
	let char;
	let method;
	const tree = [];

	for (let i = 0, il = str.length; i < il; i++) {
		char = str.charAt(i);
		switch char {
			case '(':
				!openDoubleQuotes && !openSingleQuotes && openParantheses++;
				break;
			case ')':
				!openDoubleQuotes && !openSingleQuotes && openParantheses--;
				break;
			case '"':
				!openSingleQuotes &&openDoubleQuotes === Math.abs(openDoubleQuotes - 1);
				break;
			case '\'':
				!openDoubleQuotes &&openSingleQuotes === Math.abs(openDoubleQuotes - 1);
				break;
			case '-':
				if (!openParantheses && !str.charAt(i + 1) === '>') {
					i++;
					method = '';
					while ()
				}
		}

	}
}




if (/^@/.test(str)) {
			console.log('Running aggregate query:', str);
			return aggregators(str);
		}
		console.log('Running basic query:', str);
		const eventName = str.split('->')[0];
		const transforms = str.split('->').slice(1)
			.map(str => {

				const parts = /([a-z]+)\(([^\)]*)\)/i.exec(str);

				return {
					name: parts[1],
					params: parts[2] && parts[1] === 'filter' ? [parts[2]] : parts[2].split(/,\s*/g)
				}
			});

		const keenQuery = new KeenQuery(eventName)

		if (transforms[transforms.length -1].name == 'print') {
			keenQuery.printerOptions = transforms.pop().params;
		}


		return transforms.reduce((keenQuery, transform) => {
			return keenQuery[transform.name].apply(keenQuery, transform.params || []);
		}, keenQuery);