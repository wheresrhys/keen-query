'use strict';
const combinators = {
	concat: require('./concat'),
	compare: require('./compare'),
	ratio: require('./ratio'),
	// reduce: require('./reduce')
};
module.exports = function (str) {
	let conf = /^@(\w+)\((.*\))\)(->.*)$/.exec(str);
	const combinator = conf[1];
	conf = {
		q: str,
		body: conf[2],
		postSteps: conf[3]
	};
	return new combinators[combinator](conf);
};
