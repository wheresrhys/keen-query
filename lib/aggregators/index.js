'use strict';

const KeenQuery = require('../keen-query');
const printers = require('../printers');

const aggregators = {
	concat: require('./concat'),
	ratio: require('./ratio'),
	sum: require('./sum'),
};

class Aggregator {
	constructor (conf) {
		if (conf) {
			const base = require('../index');
			this.queries = conf.body.map(base.build);
			this.aggregatorName = conf.aggregator.substr(1);
			this.aggregator = aggregators[this.aggregatorName];
			this._printer = conf.print;
			this._postProcessing = conf.postProcessing;
		}
	}

	print (style) {

		if (!style && this._printer) {
			return this.print.call(this, this._printer);
		}

		if (style === 'qs' || style === 'qo' || style === 'url') {
			return Promise.all(this.queries.map(q => q.print(style)));
		}

		if (this._table) {
			return Promise.resolve(printers.call(this, style))
		}

		return Promise.all(this.queries.map(q => q.print('json')))
			.then(() => this.aggregator())
			.then(() => {
				if (this._postProcessing) {
					this._postProcessing.forEach(opts => {
						this.getTable()[opts.func].apply(this.getTable(), opts.params);
					})
				}
				return printers.call(this, style)
			})
	}

	toString () {
		return `@${this.aggregatorName}(${this.queries.map(q => q.toString()).join(',')})`;
	}

	generateKeenUrl(base) {
		return this.queries.map(q => q.generateKeenUrl(base))
	}

	clone (withData) {
		const aggregator = new Aggregator();
		aggregator.queries = this.queries.map(kq => kq.clone(withData))
		aggregator.aggregator = this.aggregator;
		aggregator._printer = this._print;
		aggregator._postProcessing = this._postProcessing && this._postProcessing.slice().map(f => Object.assign({}, f));
		if (withData) {
			aggregator._table = this.getTable().clone();
		}
		return aggregator;
	}

	getTable () {
		return this._table;
	}
}


['reduce', 'round'].forEach(method => {
	Aggregator.prototype[method] = function () {
		const aggregator = this.clone(true);
		aggregator._table = aggregator.getTable()[method].apply(aggregator.getTable(), [].slice.call(arguments))
		return aggregator;
	}
});

module.exports = function (conf) {
	return new Aggregator(conf);
};

module.exports.define = function (name, func) {
	aggregators[name] = func;
};

['raw', 'interval', 'absTime', 'relTime', 'group', 'filter', 'tidy'].forEach(method => {
	Aggregator.prototype[method] = function () {
		const aggregator = this.clone();
		aggregator.queries = aggregator.queries.map(q => q[method].apply(q, [].slice.call(arguments)))
		return aggregator;
	}
});








