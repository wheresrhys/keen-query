'use strict';
require('isomorphic-fetch');
const fetchres = require('fetchres');
const querystring = require('querystring');
const utils = require('./utils');
const tabulate = require('./tabulate');

let renderers = {
	json: function (curr, prev) {
		return prev ? {curr,prev} : curr;
	},

	csv: function (curr, prev) {

	},

	ascii: require('./printers/ascii'),

	html: (curr, prev) => {

	}
}

const shorthandMap = {
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

function coerceNumber (number) {
	try {
		return Number(value)
	} catch (e) {
		return value;
	}
}

function transformValue(value, handleList) {
	if (handleList === true) {
		return value.split(/,\s*/g)
			.map(transformValue);
	}

	if (value === 'true') {
		return true;
	}	else if (value === 'false') {
		return false;
	}

	const asNumber =  Number(value);

	return asNumber === asNumber ? asNumber : value;
}


class KeenQuery {
	constructor (event, name) {
		this.event = event;
		this.name = 'Query: ' + (name || '');
		this.query = {
			event_collection: event
		};
		this.filters = [];
	}

	setExtraction (name) {

		if (this.extraction) {
			throw new Error(`Cannot run ${name} extraction, extraction type already set to ${this.query.extraction}`);
		}
		this.extraction = name
	}

	count (prop) {
		if (prop) {
			this.setExtraction('count_unique')
			this.query.target_property = prop;
		} else {
			this.setExtraction('count')
		}
		return this;
	}

	time (time, interval) {
		if (time) {
			if (parseInt(time, 10) === Number(time)) {
				time = time + '_days';
			}
		} else {
			time = '14_days';
		}
		this.timespan = time;
		if (interval) {
			this.query.interval = intervalMappings[interval] || 'daily';
			this.intervalUnit = intervalUnitMappings[interval] || 'day';
		}
		return this;
	}

	group (prop) {
		if (this.query.group_by) {
			throw new Error(`Can't group by ${prop}, already grouping by ${this.query.group_by}`)
		}
		this.query.group_by = prop;
		return this;
	}

	generateKeenUrls () {
		const filters = encodeURIComponent(JSON.stringify(this.filters));

		const baseUrl = [
			`https://api.keen.io/3.0/projects/${process.env.KEEN_PROJECT_ID}/queries/${this.extraction}?api_key=${process.env.KEEN_READ_KEY}`,
			`${querystring.stringify(this.query)}`,
			`filters=${filters}`
		].join('&');

		const urls = [
			baseUrl + `&timeframe=this_${this.timespan}`
		];

		if (!this.intervalUnit) {
			urls.push(baseUrl + `&timeframe=previous_${this.timespan}`)
		}
		return urls;
	}
	getQuery (type) {
		const qo = {
			extraction: this.extraction,
			query: this.query,
			filters: this.filters
		}

		return type === 'string' ? JSON.stringify(qo, null, '\t') : qo;
	}

	print (style) {
		if (!this.timespan) {
			this.time();
		}
		if (style === 'qs' || style === 'qo') {
			const qo = {
				extraction: this.extraction,
				query: this.query,
				filters: this.filters
			}
			return Promise.resolve(this.getQuery(style === 'qs' ? 'string' : 'object'));
		}
		const urls = this.generateKeenUrls();

		if (style === 'url') {
			return Promise.resolve(urls);
		}

		return Promise.all(urls.map(fetch))
			.then(fetchres.json)
			.then(res => {
				const renderer = renderers[style] || renderers.json;
				return renderer.call(this, res[0], res[1]);
			})
	}

	filter (filter) {
		const unary = /^(\!)?([\w\.]+)$/.exec(filter);
		if (unary) {
			this.filters.push({
				property_name: unary[2],
				operator: 'exists',
				property_value: !unary[1]
			})
		} else {
			let filterConf = /^([^<>\!]*)(=|\!=|>>|>|<<|<)([^<>=]*)$/.exec(filter);
			this.filters.push({
				property_name: filterConf[1],
				operator: shorthandMap[filterConf[2]].operator,
				property_value: transformValue(filterConf[3], shorthandMap[filterConf[2]].handleList)
			})
		}
		return this;
	}

	tabulate () {
		return tabulate.apply(this, [].slice.call(arguments))
	}

}


KeenQuery.definePrinter = printerDef => {

}

KeenQuery.defineFilter = filterDef => {

}

KeenQuery.execute = (str) => {
  const eventName = /^[\w\-]+\:[\w\-]+\w/.exec(str)[0];
  const transforms = str.split('->').slice(1)
  	.map(str => {
  		const parts = /([a-z]+)\(([^\)]*)\)/.exec(str);
  		return {
  			name: parts[1],
  			params: parts[2] && parts[1] === 'filter' ? [parts[2]] : parts[2].split(/,\s*/g)
  		}
  	});
  if (['count', 'avg'].indexOf(transforms[0].name) === -1) {
  	throw new Error('Must start query chains with valid extraction type: avg or count');
  }
  return transforms.reduce((query, transform) => {
  	return query[transform.name].apply(query, transform.params || []);
  }, new KeenQuery(eventName, str));
}

module.exports = KeenQuery;
