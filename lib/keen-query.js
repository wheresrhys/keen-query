'use strict';
require('isomorphic-fetch');
const fetchres = require('fetchres');
const querystring = require('querystring');
const utils = require('./utils');
const tabulate = require('./tabulate');
const URL = require('url');
const forcedQueries = [];

let printers = {
	json: function (curr, prev) {
		return prev ? {curr,prev} : curr;
	},

	csv: function (curr, prev) {

	},

	ascii: require('./printers/ascii')
}

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
	select_unique: 'unique'
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

	unique (prop) {
		this.setExtraction('select_unique');
		this.query.target_property = prop;
		return this;
	}

	raw () {
		this.forcedQueries = [];
	}

	//other chainable query methods
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
		if (this.query.group_by && this.query.group_by === prop) {
			console.warn(`You are grouping by the same property twice - no need!`)
			return this;
		}
		if (this.query.group_by) {
			if (this.secondaryGrouping) {
				throw new Error(`Can't group by ${prop}, already grouping by ${this.query.group_by} and ${this.secondaryGrouping}`)
			}

			if (this.query.interval) {
				throw new Error(`Can't group by ${prop}, already grouping by ${this.query.group_by} and ${this.intervalUnit}`)
			}
			console.warn(`Grouping by more than one property at a time can be slow and unstable`)
			this.secondaryGrouping = prop;
		} else {
			this.query.group_by = prop;
		}
		return this;
	}

	flip () {
		if (this.secondaryGrouping) {
			const tmp = this.secondaryGrouping;
			this.secondaryGrouping = this.query.group_by;
			this.query.group_by = tmp;
		} else if (this.query.interval && this.guery.group_by) {
			console.warn ("TODO: flipping time vs group_by tables")
		} else {
			throw new Error ('Cannot flip a table grouped on a single property only')
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

		if (this.query.group_by) {
			str += `->group(${this.query.group_by})`
		}

		if (this.secondaryGrouping) {
			str += `->group(${this.secondaryGrouping})`
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

	generateKeenUrl (query, filters, timeframe) {
		const baseUrl = [
			`https://api.keen.io/3.0/projects/${process.env.KEEN_PROJECT_ID}/queries/${this.extraction}?api_key=${process.env.KEEN_READ_KEY}`,
			`${querystring.stringify(query)}`,
			`filters=${encodeURIComponent(JSON.stringify(filters))}`
		].join('&');

		return timeframe ? baseUrl + `&timeframe=${timeframe}` : baseUrl
	}

	generateKeenUrls (generateUrl) {

		const baseUrl = this.generateKeenUrl(this.query, this.filters)
		if (/^(this|previous)_/.test(this.timespan)) {
			return [
				baseUrl + `&timeframe=${this.timespan}`
			];
		}
		const urls = [
			baseUrl + `&timeframe=this_${this.timespan}`
		];
		if (generateUrl) {
			return urls;
		}

		if (!this.intervalUnit) {
			urls.push(baseUrl + `&timeframe=previous_${this.timespan}`)
		}
		return urls;
	}

	getGroupingUrls () {
		this.secondaryGroups = [];
		return this.print('json', true)
			.then(data => {

				return data.result.map(r => {
					this.secondaryGroups.push(r[this.query.group_by]);
					const filters = this.filters.slice();
					filters.push(KeenQuery.parseFilter(`${this.query.group_by}=${r[this.query.group_by]}`))
					const query = Object.assign({}, this.query, {
						group_by: this.secondaryGrouping
					});
					return this.generateKeenUrl(query, filters, /^(this|previous)_/.test(this.timespan) ? this.timespan : `this_${this.timespan}`);
				})
			})
	}

	mergeSecondaryGrouping (arr) {
		const res = [];

		this.secondaryGroups.forEach((name, i) => {
			const obj = {value: arr[i].result};
			obj[this.query.group_by] = name;
			res.push(obj);
		})

		return [{result: res}]

	}

	getQueryObject (type) {
		const qo = {
			extraction: this.extraction,
			query: this.query,
			filters: this.filters,
			secondaryGrouping: this.secondaryGrouping
		}

		return type === 'string' ? JSON.stringify(qo, null, '\t') : qo;
	}

	print (style, urlGeneration) {
		this.forcedQueries.forEach(q => {
			q.apply(this);
		});

		if (!this.timespan) {
			this.time();
		}
		if (style === 'qs' || style === 'qo') {
			const qo = {
				extraction: this.extraction,
				query: this.query,
				filters: this.filters
			}
			return Promise.resolve(this.getQueryObject(style === 'qs' ? 'string' : 'object'));
		}
		const urlsPromise = (this.secondaryGrouping && !urlGeneration) ? this.getGroupingUrls() : Promise.resolve(this.generateKeenUrls(urlGeneration));

		if (style === 'url') {
			return urlsPromise;
		}
		return urlsPromise.then(urls => Promise.all(urls.map(fetch))
			.then(fetchres.json)
			.then(res => {
				if (this.secondaryGrouping && !urlGeneration) {
					res = this.mergeSecondaryGrouping(res);
				}

				const renderer = printers[style] || printers.json;
				return renderer.call(this, res[0], res[1]);
			}))
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
		printers[name] = printerFunc;
	}

	static defineQuery (name, queryFunc) {
		KeenQuery.prototype[name] = queryFunc;
	}

	static forceQuery (queryFunc) {
		forcedQueries.push[queryFunc];
	}

	static execute (str) {
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
