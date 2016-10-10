'use strict';

module.exports.filters = {
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
	'!~': {
		operator: 'not_contains'
	},
	'>': {
		operator: 'gt'
	},
	'<': {
		operator: 'lt'
	},
	'>=': {
		operator: 'gte'
	},
	'<=': {
		operator: 'lte'
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


module.exports.reverseFilters = {
	'eq': '=',
	'ne': '!=',
	'contains': '~',
	'not_contains': '!~',
	'gt': '>',
	'lt': '<',
	'gte': '>=',
	'lte': '<=',
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
	percentile: 'pct',
	average: 'avg',
	median: 'median',
	count_unique: 'count',
	select_unique: 'select'
};
