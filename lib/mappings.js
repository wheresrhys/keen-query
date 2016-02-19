'use strict';

module.exports = {};

module.exports.filterShorthands = {
	'=': {
		operator: 'eq',
	},
	'!=': {
		operator: 'ne',
	},
	'!?': {
		// this is just an alias for multiple !=, handled in parseFilter
	},
	'>>': {
		operator: 'contains'
	},
	'~': {
		operator: 'contains'
	},
	'>': {
		operator: 'gt',
	},
	'<': {
		operator: 'lt',
	},
	'<<': {
		operator: 'in',
		handleList: true
	},
	'?': {
		operator: 'in',
		handleList: true
	}
};


module.exports.reverseFilterShorthands = {
	'eq': '=',
	'ne': '!=',
	'contains': '~',
	'gt': '>',
	'lt': '<',
	'in': '?'
};

module.exports.intervals = {
	minute: 'minutely',
	hour: 'hourly',
	day: 'daily',
	week: 'weekly',
	month: 'monthly',
	year: 'yearly'
};

module.exports.inverseIntervals = {
	minutely: 'm',
	hourly: 'h',
	daily: 'd',
	weekly: 'w',
	monthly: 'mo',
	yearly: 'y'
};

module.exports.intervalUnits = {
	m: 'minute',
	h: 'hour',
	d: 'day',
	w: 'week',
	mo: 'month',
	y: 'year'
};

module.exports.extractions = {
	minimum: 'min',
	maximum: 'max',
	sum: 'sum',
	average: 'avg',
	median: 'med',
	count_unique: 'count',
	select_unique: 'select'
};
