'use strict';
require('isomorphic-fetch');
const fetchres = require('fetchres');
const AsciiTable = require('ascii-table');
const querystring = require('querystring');

function isSingleNumber (res) {
	return Object.keys(res).length === 1 && typeof res.result === 'number';
}

function arrayN (n) {
	return Array(n).join('.').split('.').map(v => undefined);
}

function stringN (n) {
	return Array(n + 1).join(' ');
}


let renderers = {
	json: function (curr, prev) {
		return prev ? {curr,prev} : curr;
	},

	csv: function (curr, prev) {

	},

	ascii: function (curr, prev) {
		const table = new AsciiTable(this.name.replace('->print(ascii)', ''))
		if (prev) {
			table.setHeading('', 'Current', 'Previous')
		} else {
			table.setHeading('', 'Current')
		}
		if (isSingleNumber(curr)) {
			if (prev) {
				table.addRow('Value', curr.result, prev.result)
			} else {
				table.addRow('Value', curr.result)
			}
		} else {

			let rows;
			if (this.query.interval && !this.query.group_by) {
				rows = arrayN(curr.result.length).map((v, i) => {
					return `${this.intervalUnit} ${i + 1}`;
				})
				rows.forEach((k, i) => {
					if (prev) {
						table.addRow(k, curr.result[i].value, prev.result[i].value)
					} else {
						table.addRow(k, curr.result[i].value)
					}
				})

			} else if (!this.query.interval && this.query.group_by) {
				const results = prev ? curr.result.concat(prev.result) : curr.result;
				rows = Object.keys(results.reduce((map, res) => {
					map[res[this.query.group_by]] = true;
					return map;
				}, {}))
				rows.forEach(k => {
					let currRes = curr.result.find(r => r[this.query.group_by] === k);
					if (prev) {
						let prevRes = prev.result.find(r => r[this.query.group_by] === k);
						table.addRow(k, currRes && currRes.result, prevRes && prevRes.result);
					} else {
						table.addRow(k, currRes && currRes.result);
					}
				})
			} else {
				throw new Error ('Ascii tables not supported when interval and group by both specified')
			}
		}
		return table.toString();
	},

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
		operator: 'contained_in',
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
		return value.split(/,\s/g)
			.map(transformValue);
	}

	if (value === 'true') {
		return true;
	}	else if (value === 'false') {
		return false;
	}

	try {
		return Number(value)
	} catch (e) {}
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
		this.query.filters = JSON.stringify(this.filters);
		const timeframe = this.timespan || '14_days';
		const baseUrl = [
			`https://api.keen.io/3.0/projects/${process.env.KEEN_PROJECT_ID}/queries/${this.extraction}?api_key=${process.env.KEEN_READ_KEY}`,
			`${querystring.stringify(this.query)}`
		].join('&');
		if (!this.timespan) {
			this.time();
		}

		const urls = [
			baseUrl + `&timeframe=this_${this.timespan}`
		];

		if (!this.intervalUnit) {
			urls.push(baseUrl + `&timeframe=previous_${this.timespan}`)
		}
		return urls;
	}
	print (style) {
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
			let filterConf = /^(.*)(=|\!=|>>|>|<|<<)(.*)$/.exec(filterString);
			this.filters.push({
				property_name: filterConf[1],
				operator: shorthandMap[filterConf[2]].operator,
				property_value: transformValue(filterConf[3], shorthandMap[filterConf[2]].transformValues)
			})
		}
		return this;
	}

}

module.exports = KeenQuery;

KeenQuery.addPrintMethod = (additionalMethods) => {

}

KeenQuery.addFilter = (additionalMethods) => {

}

KeenQuery.execute = (str) => {
  const eventName = /^[\w\-]+\:[\w\-]+\w/.exec(str)[0];
  const transforms = str.split('->').slice(1)
  	.map(str => {
  		const parts = /([a-z]+)\(([^\)]*)\)/.exec(str);
  		return {
  			name: parts[1],
  			params: parts[2] && parts[2].split(/,\s*/g)
  		}
  	});
  if (['count', 'avg'].indexOf(transforms[0].name) === -1) {
  	throw new Error('Must start query chains with valid extraction type: avg or count');
  }
  return transforms.reduce((query, transform) => {
  	return query[transform.name].apply(query, transform.params || []);
  }, new KeenQuery(eventName, str));
}
