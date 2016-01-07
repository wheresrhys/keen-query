'use strict';
const aggregators = {
	concat: require('./concat'),
	compare: require('./compare'),
	ratio: require('./ratio'),
	reduce: require('./reduce')
};
module.exports = function (str) {
	let conf = /^@(\w+)\((.*\))(?:,(\w+))?\)(->.*)?$/.exec(str);
	const combinator = conf[1];
	conf = {
		q: str,
		body: conf[2],
		postSteps: conf[4],
		param: conf[3]
	};
	const c = new aggregators[combinator](conf);
	c.originalQuery = str;
	return c;
};


module.exports.define = function (name, constructor) {
	aggregators[name] = constructor;
}
