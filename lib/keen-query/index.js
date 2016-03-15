'use strict';
require('isomorphic-fetch');
const querystring = require('querystring');
const tabulate = require('../tabulate');
const Table = require('../table');
const URL = require('url');
const printers = require('../printers');
const configContainer = process.browser ? window : process.env;
const mappings = require('../mappings');
const parser = require('../parser');
if (!configContainer || !configContainer.KEEN_PROJECT_ID || !configContainer.KEEN_READ_KEY) {
	console.log('Make sure you have KEEN_READ_KEY and KEEN_PROJECT_ID env vars set.');
	process.exit(1);
}

const forcedQueries = [];
let fetchOptions = {};
let fetchHandler = res => res.json();
class KeenQuery {
	constructor (event) {
		this.dimensions = [];
		this.groupedBy = [];
		if (typeof event === 'object') {
			throw new Error('THIS DOESN\'T work any more. If you need it to, nag rhys');
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
		return this.median(prop);
	}

	median (prop) {
		this._setExtraction('median');
		this.query.target_property = prop;
		return this;
	}

	with (prop) {
		this.query.actor_property = prop;
		return this;
	}

	pct (prop, pct) {
		return this.percentile(prop, pct);
	}

	percentile (prop, pct) {
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

	tidy (extraStrict) {
		const instance = this._getInstance();
		instance.excludeNulls = true;
		if (extraStrict) {
			instance.excludeFalsy = true;
		}
		return instance;
	}

	interval(interval) {
		const instance = this._getInstance();
		if (instance.dimensions.indexOf('timeframe') === -1) {
			instance.dimensions.unshift('timeframe');
		}

		const intervalParts = /^(?:(\d+)_)?([a-z]+)$/.exec(interval).slice(1);
		const intervalUnit = mappings.intervalUnits[intervalParts[1]] || intervalParts[1];
		instance.intervalUnit = intervalParts[0] ? `${intervalParts[0]} ${intervalUnit}s` : intervalUnit;
		instance.query.interval = intervalParts[0] ? `every_${intervalParts[0]}_${intervalUnit}s` : mappings.intervals[intervalUnit];

		instance.timeframe = instance.timeframe || 'this_14_days';
		return instance;
	}

	get dimension (){
		return this.dimensions.length;
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
		if (typeof filter === 'string') {
			filter = parser.parseFilter(filter);
		}

		if (!Array.isArray(filter)) {
			filter = [filter]
		}
		instance.filters = instance.filters.concat(filter)
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

		if (this.groupedBy.length) {
			str += `->group(${this.groupedBy.join(',')})`
		}

		this.filters.forEach(f => {
			let filter;
			if (f.operator === 'exists') {
				filter = (f.property_value === false ? '!' : '') + f.property_name;
			} else if (f.operator === 'in') {
				filter = f.property_name + '?' + f.property_value.join(',');
			} else {
				filter = f.property_name + mappings.reverseFilterShorthands[f.operator] + f.property_value;
			}

			str += `->filter(${filter})`;
		})

		if (typeof this.timeframe === 'string') {
			str += `->relTime(${this.timeframe})`;
		} else if (typeof this.timeframe === 'object') {
			str += `->absTime(${this.timeframe.start},${this.timeframe.end})`;
		}

		if (this.query.interval) {
			if (/^every_/.test(this.query.interval)) {
				str+= `->interval(${/(\d+_[a-z]+)s$/.exec(this.query.interval)[1]})`;
			} else {
				str+= `->interval(${mappings.inverseIntervals[this.query.interval]})`;
			}
		}

		return str;
	}

	_setExtraction (name) {
		if (this.extraction) {
			throw new Error(`Cannot run ${name} extraction, extraction type already set to ${this.query.extraction}`);
		}
		this.extraction = name
	}

	_getInstance (withData) {
		if (this._data) {
			return this.clone(withData);
		}
		return this;
	}

	buildComplexQueryParts (dontStringifyFilters) {
		const parts = {};
		const filters = this.filters.slice();
		parts.timeframe = this.timeframe;

		if (this.groupedBy.length) {
			parts.group_by = this.groupedBy.length === 1 ? this.groupedBy[0] : encodeURIComponent(JSON.stringify(this.groupedBy));

			if (this.excludeNulls) {
				this.groupedBy.forEach(prop => {
					filters.push({
						property_name: prop,
						operator: 'exists',
						property_value: true
					});
				})
				if (this.excludeFalsy) {
					this.groupedBy.forEach(prop => {
						filters.push({
							property_name: prop,
							operator: 'ne',
							property_value: false
						});
						filters.push({
							property_name: prop,
							operator: 'ne',
							property_value: 'undefined'
						});
					})
				}
			}
		}
		if (filters.length) {
			parts.filters = dontStringifyFilters ? filters : encodeURIComponent(JSON.stringify(filters))
		}
		return parts;
	}
	// format can be `api` or `explorer`
	generateKeenUrl (base, format) {
		format = typeof format === 'undefined' ? 'api' : format
		if (format === 'api') {
			base = typeof base === 'undefined' ? `${configContainer.KEEN_HOST || 'https://api.keen.io/3.0'}/projects/${configContainer.KEEN_PROJECT_ID}/queries/${this.extraction}?api_key=${configContainer.KEEN_READ_KEY}&`: base;
			base += `&${querystring.stringify(this.query)}`;
			const parts = [base];
			const complexQueryParts = this.buildComplexQueryParts()
			return parts.concat(Object.keys(complexQueryParts).map(k => `${k}=${complexQueryParts[k]}`)).join('&');
		} else {
			base = base || '';
			let parameterString = ''
			let properties = {
				analysis_type: this.extraction,
				target_property: this.query.target_property,
				event_collection: this.query.event_collection,
				interval: this.query.interval,
				timeframe: this.timeframe,
				group_by: this.groupedBy
			}

			// Todo: Move this excludeNulls logic outside of generateKeenUrl()
			if (this.groupedBy.length && this.excludeNulls) {
				if (!this.filters) this.filters = []

				this.groupedBy.forEach(prop => {
					this.filters.push({
						property_name: prop,
						operator: 'exists',
						property_value: true
					});
				})
			}

			let explorerParts = [].concat(Object.keys(properties)
				.filter(p => properties[p] && (typeof properties[p] === 'object' ? properties[p].length : properties[p]))
				.map(p => `query[${p}]=${encodeURIComponent(properties[p])}`))

			const filterParts = this.filters.map((f, i) => Object.keys(f).map(p => `query[filters][${i}][${p}]=${encodeURIComponent(f[p])}`));

			if (filterParts && filterParts.length) {
				explorerParts = explorerParts.concat(filterParts.reduce((a, b) => a.concat(b), []));
			}

			parameterString = explorerParts.join('&')

			return `${base}${parameterString}`;

		}

	}

	getAsFunnelStep () {
		return Object.assign({}, this.query, this.buildComplexQueryParts(true));
	}

	getQueryObject (type) {
		const qo = {
			extraction: this.extraction,
			query: this.query,
			filters: this.filters,
			groupedBy: this.groupedBy,
		}
		return type === 'string' ? JSON.stringify(qo, null, '\t') : qo;
	}

	get valueLabel () {
		if (!this.query.target_property) {
			return `${this.extraction} ${this.query.event_collection}`;
		} else {
			return `${this.query.event_collection} (${this.extraction.replace(/_/g, ' ')} ${this.query.target_property})`;
		}
	}

	setPrinter (printer) {
		const instance = this._getInstance(true);
		instance._printer = printer;
		return instance;
	}

	print (style) {

		style = style || this._printer;

		this.forcedQueries.forEach(q => {
			q.apply(this);
		});

		if (!this.timeframe) {
			this.relTime();
		}

		if (style === 'qs' || style === 'qo') {
			return Promise.resolve(this.getQueryObject(style === 'qs' ? 'string' : 'object'));
		}

		if (style === 'funnelStep') {
			return Promise.resolve(this.getAsFunnelStep());
		}
		const url = this.generateKeenUrl();

		if (style === 'url') {
			return Promise.resolve(url);
		}

		if (this._data) {
			return Promise.resolve(printers.call(this, style))
		}

		return fetch(url, fetchOptions)
			.then(fetchHandler)
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
		kq.timeframe = typeof this.timeframe === 'string' ? this.timeframe :
									typeof this.timeframe === 'object' ? Object.assign({}, this.timeframe) : undefined;
		kq.dimensions = this.dimensions.slice();
		kq.intervalUnit = this.intervalUnit;
		kq.excludeNulls = this.excludeNulls;
		kq.groupedBy = this.groupedBy.slice();
		kq._printer = this._printer;
		if (withData && this._data) {
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

	static defineQuery (name, queryFunc) {
		KeenQuery.prototype[name] = queryFunc;
	}

	static forceQuery (queryFunc) {
		forcedQueries.push[queryFunc];
	}

	static setFetchOptions (obj) {
		fetchOptions = obj;
	}

	static setFetchHandler (func) {
		fetchHandler = func;
	}

}

// mixin all the table methods
Table.mixin(KeenQuery.prototype)

module.exports = KeenQuery;
