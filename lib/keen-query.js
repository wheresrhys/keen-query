'use strict';
require('isomorphic-fetch');
const querystring = require('querystring');
const utils = require('./utils');
const tabulate = require('./tabulate');
const Table = require('./table');
const URL = require('url');
const moment = require('moment');

const printers = require('./printers');
const aggregators = require('./aggregators');
const configContainer = process.browser ? window : process.env;
const mappings = require('./mappings');
const parser = require('./parser');
if (!configContainer || !configContainer.KEEN_PROJECT_ID || !configContainer.KEEN_READ_KEY) {
	console.log('Make sure you have KEEN_READ_KEY and KEEN_PROJECT_ID env vars set.');
	process.exit(1);
}

const forcedQueries = [];

class KeenQuery {
	constructor (event) {
		this.dimensions = [];
		this.groupedBy = [];
		if (typeof event === 'object') {
			throw 'THIS DOESN"T work any more'
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
			this._setExtraction('count_unique')
			this.query.target_property = prop;
		} else {
			this._setExtraction('count')
		}
		return this;
	}

	min (prop) {
		this._setExtraction('minimum');
		this.query.target_property = prop;
		return this;
	}

	max (prop) {
		this._setExtraction('maximum');
		this.query.target_property = prop;
		return this;
	}

	sum (prop) {
		this._setExtraction('sum');
		this.query.target_property = prop;
		return this;
	}

	avg (prop) {
		this._setExtraction('average');
		this.query.target_property = prop;
		return this;
	}

	med (prop) {
		this._setExtraction('median');
		this.query.target_property = prop;
		return this;
	}

	pct (prop, pct) {
		this._setExtraction('percentile');
		this.query.target_property = prop;
		this.query.percentile = pct;
		return this;
	}

	select (prop) {
		this._setExtraction('select_unique');
		this.query.target_property = prop;
		return this;
	}

	raw () {
		const instance = this._getInstance();
		instance.forcedQueries = [];
		return instance;
	}

	interval(interval) {
		const instance = this._getInstance();
		instance.dimensions.unshift('timeframe');
		instance.intervalUnit = mappings.intervalUnits[interval] || interval;
		instance.query.interval = mappings.intervals[instance.intervalUnit];

		instance.timeframe = instance.timeframe || 'this_14_days';
		return instance;
	}

	absTime (start, end, interval) {
		const instance = this._getInstance();
		instance.timeframe = JSON.stringify({
			start: typeof start === 'string' ? start : start.toISOString(),
			end: typeof end === 'string' ? end : end.toISOString()
		});

		if (interval) {
			instance.interval(interval);
		}

		return instance;
	}

	relTime(time, interval) {
		const instance = this._getInstance();
		if (time) {
			if (parseInt(time, 10) === Number(time)) {
				time = time + '_days';
			}
		} else {
			time = '14_days';
		}
		instance.timeframe = (time.indexOf('this_') === 0 || time.indexOf('previous_') === 0) ? time : 'this_' + time;

		if (interval) {
			instance.interval(interval);
		}

		return instance;
	}

	time(time, interval) {
		return this.relTime(time, interval);
	}

	group () {
		const instance = this._getInstance();
		instance.groupedBy = instance.groupedBy || [];
		instance.groupedBy = instance.groupedBy.concat([].slice.call(arguments));
		instance.dimensions = instance.dimensions.concat([].slice.call(arguments));
		return instance;
	}

	filter (filter) {
		const instance = this._getInstance();
		instance.filters.push(typeof filter === 'string' ? parser.parseFilter(filter) : filter)
		return instance;
	}

	toString () {
		let str = this.query.event_collection;
		if (this.extraction === 'count') {
			str += '->count()';
		} else if (this.extraction === 'percentile') {
			str += `->pct(${this.query.target_property},${this.query.percentile})`;
		} else {
			str+= `->${mappings.extractions[this.extraction]}(${this.query.target_property})`
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
				filter = f.property_name + mappings.reverseFilterShorthands[f.operator] + f.property_value;
			}

			str += `->filter(${filter})`;
		})

		return str;
	}

	_setExtraction (name) {
		if (this.extraction) {
			throw new Error(`Cannot run ${name} extraction, extraction type already set to ${this.query.extraction}`);
		}
		this.extraction = name
	}

	_getInstance () {
		if (this._data) {
			return this.clone();
		}
		return this;
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

		if (!style && this._printer) {
			return this.print.call(this, this._printer);
		}
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
		if (this._data) {
			return Promise.resolve(printers.call(this, style))
		}

		return fetch(url)
			.then(res => res.json())
			.then(data => {
				this._data = data;
				this._table = this._tabulate(data);
				if (this._postProcessing) {
					this._postProcessing.forEach(opts => {
						this._table = this.getTable()[opts.func].apply(this.getTable(), opts.params);
					})
				}
				return printers.call(this, style);
			});
	}

	_tabulate () {
		return tabulate.apply(this, [].slice.call(arguments))
	}


	getTable () {
		return this._table;
	}

	clone (withData) {
		const kq = new KeenQuery();
		kq.query = Object.assign({}, this.query);
		kq.extraction = this.extraction;
		kq.filters = this.filters.slice().map(f => Object.assign({}, f));
		kq.forcedQueries = this.forcedQueries && this.forcedQueries.slice().map(f => Object.assign({}, f));
		kq._postProcessing = this._postProcessing && this._postProcessing.slice().map(f => Object.assign({}, f));
		kq.timeframe = typeof this.timeframe === 'string' ? this.timeframe : Object.assign({}, this.timeframe);
		kq.dimensions = this.dimensions.slice();
		kq.intervalUnit = this.intervalUnit;
		kq.groupedBy = this.groupedBy.slice();
		kq._printer = this._printer;
		if (withData) {
			kq._data = this._data;
			kq._table = this.getTable().clone();
		}
		return kq;
	}

	static fromUrl (url) {
		const urlObj = URL.parse(url);
		const query = querystring.parse(urlObj.query);
		const filters = query.filters ? JSON.parse(query.filters) : [];
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
		printers.define(name, printerFunc);
	}

	static defineAggregator (name, constructor) {
		aggregators.define(name, constructor);
	}

	static defineQuery (name, queryFunc) {
		KeenQuery.prototype[name] = queryFunc;
	}

	static forceQuery (queryFunc) {
		forcedQueries.push[queryFunc];
	}

}

// mixin all the table methods
['reduce', 'round'].forEach(method => {
	KeenQuery.prototype[method] = function () {
		const kq = this.clone(true);
		kq._table = kq.getTable()[method].apply(kq.getTable(), [].slice.call(arguments))
		return kq;
	}
});

module.exports = KeenQuery;
