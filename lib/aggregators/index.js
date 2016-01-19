'use strict';

const KeenQuery = require('../keen-query');
const printers = require('../printers');

const aggregators = {
	concat: require('./concat'),
	ratio: require('./ratio')
};

class Aggregator {
	constructor (conf) {
		const base = require('../index');
		this.queries = conf.body.map(base.build);
		this.aggregator = aggregators[conf.aggregator.substr(1)];
		this._printer = conf.print;
		this._postProcessing = conf.postProcessing;
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

	getTable () {
		return this._table;
	}
}


module.exports = function (conf) {
	return new Aggregator(conf);
};


module.exports.define = function (name, func) {
	aggregators[name] = func;
}


