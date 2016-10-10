'use strict';
require('isomorphic-fetch');
const querystring = require('querystring');
const immutifyKeen = require('../data/immutify-keen');
const ImmutableMatrix = require('../data/immutable-matrix');
const URL = require('url');
const printers = require('../printers');
const shorthands = require('./shorthands');
const filters = require('./filters');
const queryMethods = require('./query-methods');

let config = {
	fetchHandler: res => res.json()
};

class KeenQuery {
	constructor (event) {
		this.dimensions = [];
		this.groupedBy = [];
		if (typeof event === 'object') {
			throw new Error('This doesn\'t work any more. If you need it to, nag rhys');
			this.query = event.query || {};
			this.extraction = event.extraction;
			this.filters = event.filters;
		} else {
			this.query = {
				event_collection: event
			};
			this.filters = [];
		}

	}

	select (prop) {
		this._setExtraction('select_unique');
		this.query.target_property = prop;
		return this;
	}

	get dimension (){
		return this.dimensions.length;
	}

	toString () {
		let str = this.query.event_collection;
		if (this.extraction) {
			if (this.extraction === 'count') {
				str += '->count()';
			} else if (this.extraction === 'percentile') {
				str += `->${shorthands.extractions[this.extraction]}(${this.query.target_property},${this.query.percentile})`;
			} else {
				str+= `->${shorthands.extractions[this.extraction]}(${this.query.target_property})`
			}
		}

		if (this.groupedBy.length) {
			str += `->group(${this.groupedBy.join(',')})`
		}

		this.filters.forEach(filter => {
			str += `->filter(${filters.unparse(filter)})`
		});

		if (this.timeframe) {
			try {
				const timeframe = JSON.parse(this.timeframe);
				str += `->absTime(${timeframe.start},${timeframe.end})`;
			} catch (e) {
				str += `->relTime(${this.timeframe})`;
			}
		}

		if (this.query.interval) {
			if (/^every_/.test(this.query.interval)) {
				str+= `->interval(${/(\d+_[a-z]+)s$/.exec(this.query.interval)[1]})`;
			} else {
				str+= `->interval(${shorthands.inverseIntervals[this.query.interval]})`;
			}
		}

		str += this.stringifyPostProcessors();

		if (this._printer) {
			str += `->print(${this._printer})`;
		}

		return str;
	}

	stringifyPostProcessors () {
		return (this._postProcessors || []).map(conf => {
			return `->${conf.func}(${conf.params.join(',')})`
		}).join('');
	}

	_setExtraction (name) {
		if (this.extraction) {
			throw new Error(`Cannot run ${name} extraction, extraction type already set to ${this.query.extraction}`);
		}
		this.extraction = name
	}

	_getInstance (withData) {
		if (this._rawData) {
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
			base = typeof base === 'undefined' ? `${config.KEEN_HOST || 'https://api.keen.io/3.0'}/projects/${config.KEEN_PROJECT_ID}/queries/${this.extraction}?api_key=${config.KEEN_READ_KEY}&`: base;
			base += `${querystring.stringify(this.query)}`;
			const parts = [base];
			const complexQueryParts = this.buildComplexQueryParts()
			let keenApiURL = parts.concat(Object.keys(complexQueryParts).map(k => `${k}=${complexQueryParts[k]}`)).join('&');

			if (this.extraction === 'extraction') {

				// For data extractions, limit to the keen API maximum of 100,000 rows.
				keenApiURL += '&latest=100000';

				// Instead of `target_property`, extractions accept an array of `property_names`
				keenApiURL += `&property_names=["${this.query.target_property.split(',').join('","')}"]`;
			}

			return keenApiURL;
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

			if (this.extraction === 'extraction') {
				properties.latest = 100000;
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
		return Object.assign({}, this.query, this.buildComplexQueryParts(true), {
			actor_property: this.query.actor_property
		});
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

		if (this._rawData) {
			return Promise.resolve(printers.call(this, style))
		}

		return fetch(url, config.fetchOptions)
			.then(config.fetchHandler)
			.then(data => {
				this._rawData = data;

				this._matrix = immutifyKeen.call(this)
				if (this._postProcessors) {
					this._postProcessors.forEach(opts => {
						this._matrix = this.getData()[opts.func].apply(this.getData(), opts.params);
					})
				}
				return printers.call(this, style);
			});
	}

	getData () {
		return this._matrix;
	}

	getTable (dateStyle) {
		return this._matrix.unflatten(dateStyle);
	}

	clone (withData) {
		const kq = new KeenQuery();
		kq.query = Object.assign({}, this.query);
		kq.extraction = this.extraction;
		kq.filters = this.filters.slice().map(f => Object.assign({}, f));
		kq._postProcessors = this._postProcessors && this._postProcessors.slice().map(f => Object.assign({}, f));
		kq.timeframe = typeof this.timeframe === 'string' ? this.timeframe :
									typeof this.timeframe === 'object' ? Object.assign({}, this.timeframe) : undefined;
		kq.dimensions = this.dimensions.slice();
		kq.intervalUnit = this.intervalUnit;
		kq.excludeNulls = this.excludeNulls;
		kq.groupedBy = this.groupedBy.slice();
		kq._printer = this._printer;
		if (withData && this._rawData) {
			kq._rawData = this._rawData;
			kq._matrix = this.getData().clone();
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
		queryMethods.define(name, queryFunc);
	}

	static setConfig (obj) {
		config = Object.assign(config, obj);
	}

	static getConfig () {
		return config;
	}

}

// mixin all the table methods
ImmutableMatrix.mixin(KeenQuery.prototype)
queryMethods.mixin(KeenQuery.prototype)

module.exports = KeenQuery;
