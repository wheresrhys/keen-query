'use strict';
require('isomorphic-fetch');
const querystring = require('querystring');
const utils = require('./utils');
const tabulate = require('./tabulate');
const URL = require('url');
const moment = require('moment');
const forcedQueries = [];
const dataPrinter = require('./data-printer');
const configContainer = process.browser ? window : process.env;
const combinators = require('./combinators');

const filterShorthandMap = {
	'=': {
		operator: 'eq',
	},
	'!=': {
		operator: 'not_eq',
	},
	'>>': {
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
	}
};

const reverseFilterShorthandMap = {
	'eq': '=',
	'not_eq': '!=',
	'ne': '!=',
	'contains': '>>',
	'gt': '>',
	'lt': '<',
	'in': '<<'
};

const intervalMappings = {
	m: 'minutely',
	h: 'hourly',
	d: 'daily',
	w: 'weekly',
	mo: 'monthly',
	y: 'yearly',
}

const intervalUnitMappings = {
	m: 'minute',
	h: 'hour',
	d: 'day',
	w: 'week',
	mo: 'month',
	y: 'year',
}

const extractionMappings = {
	minimum: 'min',
	maximum: 'max',
	sum: 'sum',
	average: 'avg',
	median: 'med',
	count_unique: 'count',
	select_unique: 'select'
}

class KeenQuery {
	constructor (event) {
		if (typeof event === 'object') {
			this.query = event.query || {};
			this.extraction = event.extraction;
			this.filters = event.filters;
		} else {
			this.query = {
				event_collection: event
			};
			this.filters = [];
			this.forcedQueries = forcedQueries;
		}

	}

	// chainable extraction methods
	count (prop) {
		if (prop) {
			this.setExtraction('count_unique')
			this.query.target_property = prop;
		} else {
			this.setExtraction('count')
		}
		return this;
	}

	min (prop) {
		this.setExtraction('minimum');
		this.query.target_property = prop;
		return this;
	}

	max (prop) {
		this.setExtraction('maximum');
		this.query.target_property = prop;
		return this;
	}

	sum (prop) {
		this.setExtraction('sum');
		this.query.target_property = prop;
		return this;
	}

	avg (prop) {
		this.setExtraction('average');
		this.query.target_property = prop;
		return this;
	}

	med (prop) {
		this.setExtraction('median');
		this.query.target_property = prop;
		return this;
	}

	pct (prop, pct) {
		this.setExtraction('percentile');
		this.query.target_property = prop;
		this.query.percentile = pct;
		return this;
	}

	select (prop) {
		this.setExtraction('select_unique');
		this.query.target_property = prop;
		return this;
	}

	raw () {
		this.forcedQueries = [];
		return this;
	}

	interval(interval) {
		this.query.interval = intervalMappings[interval] || 'daily';
		this.intervalUnit = intervalUnitMappings[interval] || 'day';
		this.timeframe = this.timeframe || 'this_14_days';
		return this;
	}

	absTime (start, end, interval) {
		this.timeframe = JSON.stringify({
			start: start.toISOString(),
			end: end.toISOString()
		});

		if (interval) {
			this.interval(interval);
		}

		return this;
	}

	relTime(time, interval) {
		if (time) {
			if (parseInt(time, 10) === Number(time)) {
				time = time + '_days';
			}
		} else {
			time = '14_days';
		}
		this.timeframe = 'this_' + time;

		if (interval) {
			this.interval(interval);
		}

		return this;
	}

	time(time, interval) {
		return this.relTime(time, interval);
	}

	prev () {
		this.timeframe = this.timeframe || 'this_14_days';
		if (this.timeframe.indexOf('this_') === 0) {
			this.timeframe = this.timeframe.replace('this_', 'previous_');
		} else {
			const tf = JSON.parse(this.timeframe);
			const duration = moment(tf.end).diff(moment(tf.start));
			this.timeframe = JSON.stringify({
				start: moment(tf.start).subtract(duration, 'milliseconds').toISOString(),
				end: tf.start.toISOString()
			});
		}
		return this;
	}

	group () {
		this.groupedBy = this.groupedBy || [];
		this.groupedBy = this.groupedBy.concat([].slice.call(arguments));
		return this;
	}

	flip () {
		this.groupedBy = this.groupedBy && this.groupedBy.reverse();

		if (this.query.interval) {
			console.warn ("TODO: flipping time vs group_by tables")
		}
		return this;
	}

	filter (filter) {
		this.filters.push(KeenQuery.parseFilter(filter))
		return this;
	}

	toString () {
		let str = this.query.event_collection;
		if (this.extraction === 'count') {
			str += '->count()';
		} else if (this.extraction === 'percentile') {
			str += `->pct(${this.query.target_property},${this.query.percentile})`;
		} else {
			str+= `->${extractionMappings[this.extraction]}(${this.query.target_property})`
		}

		if (this.groupedBy) {
			str += `->group(${this.groupedBy.join(',')})`
		}
		this.filters.forEach(f => {
			let filter;
			if (f.operator === 'exists') {
				filter = (f.property_value === false ? '!' : '') + f.property_name;
			} else if (f.operator === 'in') {
				filter = f.property_name + '<<' + f.property_value.join(',');
			} else {
				filter = f.property_name + reverseFilterShorthandMap[f.operator] + f.property_value;
			}

			str += `->filter(${filter})`;
		})

		return str;
	}
	setExtraction (name) {

		if (this.extraction) {
			throw new Error(`Cannot run ${name} extraction, extraction type already set to ${this.query.extraction}`);
		}
		this.extraction = name
	}

	generateKeenUrl () {

		let baseUrl = [
			`https://api.keen.io/3.0/projects/${configContainer.KEEN_PROJECT_ID}/queries/${this.extraction}?api_key=${configContainer.KEEN_READ_KEY}`,
			`${querystring.stringify(this.query)}`,
			`filters=${encodeURIComponent(JSON.stringify(this.filters))}`,
			`timeframe=${this.timeframe}`
		].join('&');

		if (this.groupedBy) {
			return baseUrl + `&group_by=${this.groupedBy.length === 1 ? this.groupedBy[0] : encodeURIComponent(JSON.stringify(this.groupedBy))}`
		}

		return baseUrl;
	}

	getQueryObject (type) {
		const qo = {
			extraction: this.extraction,
			query: this.query,
			filters: this.filters,
			groupedBy: this.groupedBy
		}

		return type === 'string' ? JSON.stringify(qo, null, '\t') : qo;
	}

	print (style) {
		this.forcedQueries.forEach(q => {
			q.apply(this);
		});

		if (!this.timeframe) {
			this.time();
		}
		if (style === 'qs' || style === 'qo') {
			return Promise.resolve(this.getQueryObject(style === 'qs' ? 'string' : 'object'));
		}
		const url = this.generateKeenUrl();

		if (style === 'url') {
			return Promise.resolve(url);
		}

		return fetch(url)
			.then(res => res.json())
			.then(data => {
				return dataPrinter(style, data, this);
			})
	}


	tabulate () {
		return tabulate.apply(this, [].slice.call(arguments))
	}

	static parseFilter (filter) {
		const unary = /^(\!)?([\w\.]+)$/.exec(filter);
		if (unary) {
			return {
				property_name: unary[2],
				operator: 'exists',
				property_value: !unary[1]
			};
		} else {
			let filterConf = /^([^<>\!]*)(=|\!=|>>|>|<<|<)([^<>=]*)$/.exec(filter);
			return {
				property_name: filterConf[1],
				operator: filterShorthandMap[filterConf[2]].operator,
				property_value: utils.transformValue(filterConf[3], filterShorthandMap[filterConf[2]].handleList)
			};
		}
	}
	static fromUrl (url) {
		const urlObj = URL.parse(url);
		const query = querystring.parse(urlObj.query);
		const filters = JSON.parse(query.filters);
		const extraction = urlObj.pathname.split('/').pop();
		query.filters && delete query.filters;
		query.timeframe && delete query.timeframe;
		query.interval && delete query.interval;
		return Promise.resolve(new KeenQuery({
			extraction: extraction,
			query: query,
			filters: filters
		}));
	}

	static definePrinter (name, printerFunc) {
		dataPrinter.define(name, printerFunc);
	}

	static defineQuery (name, queryFunc) {
		KeenQuery.prototype[name] = queryFunc;
	}

	static forceQuery (queryFunc) {
		forcedQueries.push[queryFunc];
	}

	static execute (str) {
		console.log(str);
		if (/^@/.test(str)) {
			return combinators(str).print();
		}
	  const eventName = str.split('->')[0];
	  const transforms = str.split('->').slice(1)
	  	.map(str => {

	  		const parts = /([a-z]+)\(([^\)]*)\)/.exec(str);

	  		return {
	  			name: parts[1],
	  			params: parts[2] && parts[1] === 'filter' ? [parts[2]] : parts[2].split(/,\s*/g)
	  		}
	  	});

	  return transforms.reduce((query, transform) => {
	  	return query[transform.name].apply(query, transform.params || []);
	  }, new KeenQuery(eventName));
	}
}

module.exports = KeenQuery;
