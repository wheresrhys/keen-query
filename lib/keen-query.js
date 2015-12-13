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
			console.warn(`Grouping by more than one property at a time can be slow and unpredictable`)
			this.secondaryGrouping = prop;
		} else {
			this.query.group_by = prop;
		}
		return this;
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
					return this.generateKeenUrl(query, filters, `this_${this.timespan}`);
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

	getQuery (type) {
		const qo = {
			extraction: this.extraction,
			query: this.query,
			filters: this.filters,
			secondaryGrouping: this.secondaryGrouping
		}

		return type === 'string' ? JSON.stringify(qo, null, '\t') : qo;
	}

	print (style, urlGeneration) {
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
				const renderer = renderers[style] || renderers.json;
				return renderer.call(this, res[0], res[1]);
			}))
	}

	filter (filter) {
		this.filters.push(KeenQuery.parseFilter(filter))
		return this;
	}



	tabulate () {
		return tabulate.apply(this, [].slice.call(arguments))
	}

}

KeenQuery.parseFilter = filter => {
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
			operator: shorthandMap[filterConf[2]].operator,
			property_value: transformValue(filterConf[3], shorthandMap[filterConf[2]].handleList)
		};
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
