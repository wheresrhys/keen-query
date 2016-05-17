'use strict';

function parseParams (params, func) {
	if (typeof params === 'string') {
		if (/^('|").*\1/.test(params)) {
			params = params.substr(1, params.length -2);
		}
		if (params) {
			if (func === 'filter' || func === 'extract') {
				// don't attempt to split a filter on ',' - far more complex parsing rules defined elsewhere
				params = [params];
			} else {
				params = params.split(',').map(str => str.trim())
			}
		} else {
			params = [];
		}
	}
	return params;
}

/*
	Parser inspired by https://github.com/thejameskyle/the-super-tiny-compiler/blob/master/super-tiny-compiler.js
*/

// Convert keen query string into recognised tokens
function tokenise (inputString) {

	var current = 0;
	var tokens = [];

	// it's important to distinguish between type of operator being opened
	// - inside an aggregator the rules of keen-query still hold
	// - inside a function, until we parse the parameters later, anything goes
	var activeOperator = null;

	const WHITESPACE = /\s/;

	// we need to avoid treating closing parentheses within quote marks as a closing parentheses
	// TODO - escaping of quoted quote marks
	let openDoubleQuotes = false;
	let openSingleQuotes = false;

	// Starte traversing the string
	while (current < inputString.length) {
		var char = inputString[current];

		// opening parentheses which aren't within a function body
		if (char === '(' && activeOperator !== 'functionOpen') {
			activeOperator += 'Open';
			tokens.push({
				type: 'paren',
				value: '('
			});

			current++;

			continue;
		}

		// closing parentheses
		if (char === ')') {
			tokens.push({
				type: 'paren',
				value: ')'
			});
			current++;
			activeOperator = null;
			continue;
		}

		// commas (used as separators between subqueries contained in hte body of aggregators)
		if (char === ',') {
			tokens.push({
				type: 'comma',
				value: ','
			});
			current++;
			continue;
		}

		// ignore whitespace if it's outside function body
		if (WHITESPACE.test(char) && activeOperator !== 'functionOpen') {
			current++;
			continue;
		}

		// @, when not within a function body, signifies an aggregator is being applied
		if (char === '@' && activeOperator !== 'functionOpen') {
			current++;
			let aggName = '';

			while (/[a-z]/i.test(inputString[current])) {
				aggName += inputString[current];
				current++;
			}
			tokens.push({
				type: 'aggregator',
				value: aggName
			});
			activeOperator = 'aggregator';
			continue;
		}

		// ->, when not within a function body, signifies a function is being invoked
		if (char === '-' && inputString[current + 1] === '>' && activeOperator !== 'functionOpen') {
			current = current + 2;
			let funcName = '';
			while (/[a-z]/i.test(inputString[current])) {
				funcName += inputString[current];
				current++;
			}
			tokens.push({
				type: 'function',
				value: funcName
			});
			activeOperator = 'function';
			continue;
		}

		// alphanumeric and : characters can be used as event collection names
		if (/[a-z]/i.test(char) && activeOperator !== 'functionOpen') {
			let collectionName = '';
			while (/[a-z:\-_]/i.test(inputString[current])) {
				if (!(inputString[current] === '-' && inputString[current + 1] === '>')) {
					collectionName += inputString[current];
					current++;
				} else {
					break;
				}
			}
			tokens.push({
				type: 'collection',
				value: collectionName
			});
			continue;
		}

		// otherwise we only allow any other characters to appear if they are within a function body
		if (activeOperator !== 'functionOpen') {
			throw new TypeError('Invalid character: ' + char);
		}

		let params = '';

		// carefully track opening and closing quotes when constructing the function body
		while (char && (openSingleQuotes || openDoubleQuotes || char !== ')')) {
			if (char === '"') {
				openDoubleQuotes = !openDoubleQuotes;
			}

			if (char === '\'') {
				openSingleQuotes = !openSingleQuotes;
			}

			params += char;
			char = inputString[++current];
		}
		tokens.push({
			type: 'params',
			value: params
		});
		continue;
	}

	// return the tokenised string
	return tokens;
}


function constructAST (tokens) {
	// Again we keep a `current` variable that we will use as a cursor.
	var current = 0;

	// But this time we're going to use recursion instead of a `while` loop. So we
	// define a `walk` function.
	const walk = () => {

		// Inside the walk function we start by grabbing the `current` token.
		var token = tokens[current];

		// For aggreagators we...
		if (token.type === 'aggregator') {
			//... note the aggregator name
			const aggregator = token.value;
			token = tokens[++current];
			if (token.type !== 'paren' && token.value !== '(') {
				throw new Error('aggregators must be followed by opening parenthesis');
			}

			//.. then start looking for the parenthesis that closes it
			let parenthesisCount = 1;
			let body = [[]];

			while (parenthesisCount) {
				token = tokens[++current];

				if (token.type === 'paren') {
					parenthesisCount += token.value === '(' ? 1 : -1;
				}
				if (parenthesisCount) {
					// we split into multiple subqueries whenever we encounter a top level comma
					if (token.type === 'comma' && parenthesisCount === 1) {
						body.push([]);
					} else {
						body[body.length - 1].push(token);
					}
				}
			}
			// as aggregators can be nested indefinitely we recurse
			body = body.map(constructAST);

			// move to the next token
			current++;
			return {
				aggregator,
				queries: body
			}
		}

		// for event collections we simply persist the record (we will place it somewhere useful later)
		if (token.type === 'collection') {
			current++;
			return {
				collection: token.value
			}
		}

		// For functions we extract the name and parameters
		if (token.type === 'function') {
			const func = token.value;
			token = tokens[++current];
			if (token.type !== 'paren' && token.value !== '(') {
				throw new Error('functions must be followed by opening parenthesis');
			}
			token = tokens[++current];
			// Handling the case where the function has no parameters
			if (token.type === 'paren' && token.value === ')') {
				current++;
				return {
					func,
					params: []
				}
			}
			let params;
			if (token.type === 'params') {
				// and the case where parameters exist, which we pass into the parmeter parser
				// to convert into an array or keen-compatible filter config object
				params = parseParams(token.value, func);
			}
			token = tokens[++current];
			if (token.type !== 'paren' && token.value !== ')') {
				throw new Error('functions have closing parenthesis');
			}
			current++;
			return {
				func,
				params
			}
		}
		throw new TypeError(token);
	}

	var ast = {
		type: 'KeenQuery',
		body: []
	};

	// kick off the constructuon of the abstract syntax tree
	while (current < tokens.length) {
		ast.body.push(walk());
	}

	// We adjust the trees to match the structure returned by the previous generation of the parser
	// TODO  - consider not doing this
	if (ast.body[0].aggregator) {

		ast = {
			type: 'AggregateQuery',
			aggregator: ast.body[0].aggregator,
			body: ast.body[0].queries,
			functions: ast.body.slice(1)
		}
	} else {
		const event = ast.body.find(f => f.collection);
		ast = {
			type: 'KeenQuery',
			event: event.collection,
			functions: ast.body.filter(f => !f.collection)
		}
	}
	return ast;
}

module.exports = function (str) {
	const tokens = tokenise(str);
	const syntaxTree = constructAST(tokens);
	return syntaxTree;
}
