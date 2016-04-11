// const extractionNames = ['with', 'min', 'max', 'sum', 'avg', 'med', 'count', 'select', 'median', 'pct', 'percentile'];

// function validateStructure (conf) {
// 	return typeof conf !== 'string';
// }

// function validateExtraction (conf) {
// 	if (conf.func !== 'count' && !conf.params.length) {
// 		throw new Error(`Extraction ${conf.func} must be passed a property e.g. ->${conf.func}(user.uuid)`);
// 	}
// }

// function validateParams (conf, length) {
// 	if (!conf.params.length) {
// 		throw new Error(`${conf.func} must be passed a value e.g. ->${conf.func}(thingummy)`);
// 	}

// 	if (length && conf.params.length !== length) {
// 		throw new Error(`${conf.func} must be passed ${length} values`);
// 	}
// 	return true;
// }

// const reduceStrategies = Object.assign({all: true}, require('./post-processing/reduce').reduceStrategies);

// function validateReduce(conf) {
// 	if (!reduceStrategies[conf.params[0]]) {
// 		throw new Error(`Invalid reduction ${conf.params[0]}`);
// 	}
// }

// // function validateSort(conf) {
// 	// TODO proper sort validation
// 	// if (!reduceStrategies[conf.params[0]]) {
// 	// 	throw new Error(`Invalid reduction ${conf.params[0]}`);
// 	// }
// // }

// function validateRelTime(conf) {
// 	if (Number(conf.params[0]) && parseInt(conf.params[0], 10) !== Number(conf.params[0])) {
// 		throw new Error('->relTime() must be passed an integer to specify number of days');
// 	}

// 	if (!/(this_|previous_)?\d+(_(minutes|hours|days|weeks|months|years))?/.test(conf.params[0])) {
// 		throw new Error('Invalid timeframe string passed to ->relTime() (see cheatsheet or ask a dev)');
// 	}

// }

// const acceptedIntervals = Object.keys(mappings.intervalUnits)
// 	.reduce((arr, k) => {
// 		return arr.concat([k, mappings.intervalUnits[k]]);
// 	}, []);

// const acceptedIntervalsString = Object.keys(mappings.intervalUnits)
// 	.map(k => {
// 		return `${k} or ${mappings.intervalUnits[k]}`;
// 	}).join(', ');

// function validateInterval(conf) {
// 	const intervalUnit = conf.params[0].replace(/^(every_)?\d+_/, '');
// 	if (acceptedIntervals.indexOf(intervalUnit) === -1) {
// 		throw new Error(`Invalid interval passed in to ->interval(). Accepted values are ${acceptedIntervalsString} (possibly prefixed by e.g. '2_')`);
// 	}
// }

// function validateAbsTime(conf) {
// 	conf.params.forEach(str => {
// 		const t = new Date(str).getTime();
// 		if (t !== t) { // NaN
// 			throw new Error('Invalid date string passed to ->absTime()');
// 		}
// 	})
// }


// function validateRound(conf) {
// 	if (conf.params.length) {
// 		if (conf.params.length > 1) {
// 			throw new Error('->round() only accepts a single number');
// 		}
// 		if (parseInt(conf.params[0], 10) !== Number(conf.params[0])) {
// 			throw new Error('->round() must be passed an integer');
// 		}
// 	}
// }

// function validateFunction (conf) {
// 	const name = typeof conf === 'string' ? conf : conf.func;
// 	const isValidStructure = validateStructure(conf);

// 	if (extractionNames.indexOf(name) > -1) {
// 		return isValidStructure && validateExtraction(conf);
// 	}

// 	if (['filter', 'group'].indexOf(name) > -1) {
// 		return isValidStructure && validateParams(conf);
// 	}

// 	if (name === 'reduce') {
// 		return isValidStructure && validateParams(conf) && validateReduce(conf);
// 	}



// 	if (['sortAsc', 'sortDesc', 'plotThreshold', 'cutoff', 'top', 'bottom', 'sortProp', 'relabel'].indexOf(name) > -1) {
// 		return isValidStructure;
// 		// return isValidStructure && validateSort(conf);
// 	}

// 	if (name === 'multiply' || name === 'divide') {
// 		return isValidStructure && validateParams(conf);
// 	}


// 	if (name === 'relTime') {
// 		return isValidStructure && validateParams(conf, 1) && validateRelTime(conf);
// 	}

// 	if (name === 'absTime') {
// 		return isValidStructure && validateParams(conf, 2) && validateAbsTime(conf);
// 	}

// 	if (name === 'interval') {
// 		return isValidStructure && validateParams(conf, 1) && validateInterval(conf);
// 	}

// 	if (name === 'round') {
// 		return isValidStructure && validateRound(conf);
// 	}

// 	if (['raw', 'tidy'].indexOf(name) > -1) {
// 		return isValidStructure;
// 	}

// 	if (isValidStructure) {
// 		throw new Error(`Invalid function name ${name}`);
// 	} else {
// 		const func = conf.replace(/\([^)]*$/, '');
// 		throw new Error(`Function ${func} must end with opening and closing parantheses e.g. ->${func}() or ->${func}(thing)`);
// 	}
// }
