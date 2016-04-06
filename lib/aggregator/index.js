'use strict';

const printers = require('../printers');
const Table = require('../table');
const Funnel = require('./funnel');
const postProcessing = require('../post-processing');

const aggregators = {
	concat: require('./concat'),
	ratio: require('./ratio'),
	pct: require('./pct'),
	sum: require('./sum')
};

class Aggregator {
	constructor (conf) {
		// conf is an object returned by ../parser.js
		if (conf) {
			// circular dependency hell!
			const base = require('../index');
			// end circular dependency hell!

			// build each query
			this.queries = conf.body.map(base.build);

			// associate an aggregation method with this instance of the generic aggregator interface
			this.aggregatorName = conf.aggregator.substr(1);
			this.aggregator = aggregators[this.aggregatorName];
			if (!this.aggregator) {
				throw new Error(`Invalid aggregator name ${this.aggregatorName}`);
			}

			// these work pretty much the same as on the keen-query object - mainly defining what to do
			// with data after its fetched
			this._printer = conf.print;
			this._postProcessors = [];
			conf.functions.forEach(funcConf => {
				if (postProcessing.isPostProcessor(funcConf.func)) {
					this._postProcessors.push(funcConf);
				} else {
					this.queries = this.queries.map(kq => kq[funcConf.func].apply(kq, funcConf.params || []));
				}
			});
		}
	}

	print (style) {

		style = style || this._printer;

		if (style === 'qs' || style === 'qo' || style === 'url') {
			return Promise.all(this.queries.map(q => q.print(style)));
		}

		if (this._table) {
			return Promise.resolve(printers.call(this, style))
		}

		return Promise.all(this.queries.map(q => q.print('json')))
			.then(() => this.aggregator())
			.then(() => {
				if (this._postProcessors) {
					this._postProcessors.forEach(opts => {
						this._table = this.getTable()[opts.func].apply(this.getTable(), opts.params);
					})
				}
				return printers.call(this, style)
			})
	}

	setPrinter (printer) {
		// this clones in order to e.g. allow the same instance to be used to print
		// different graphs simultaneously
		const instance = this.clone(true);
		instance._printer = printer;
		return instance;
	}

	toString () {
		// stringify each child query and wrap in the aggregator method
		return `@${this.aggregatorName}(${this.queries.map(q => q.toString()).join(',')})`
			+ this.stringifyPostProcessors()
			+ (this._printer ? `->print(${this._printer})` : '');
	}

	get dimension () {
		if (this.aggregator.getDimension) {
			return this.aggregator.getDimension.call(this);
		}
		// allow for an aggregator to calculate its dimension explictly, otherwise
		// default to assuming all the queries are being combined without altering
		// their dimension
		return this._dimension || (this._table && this._table.dimension) || this.queries[0].dimension;
	}

	generateKeenUrl(base, format) {
		// mainly useful for debugging
		return this.queries.map(q => q.generateKeenUrl(base, format))
	}

	clone (withData) {
		// Carefully deep clones everything contained in the aggregator
		const aggregator = new Aggregator();
		aggregator.queries = this.queries.map(kq => kq.clone(withData))
		aggregator.aggregator = this.aggregator;
		aggregator.aggregatorName = this.aggregatorName;
		aggregator._printer = this._printer;
		aggregator._postProcessors = this._postProcessors && this._postProcessors.slice().map(f => Object.assign({}, f));
		if (withData) {
			aggregator._table = this.getTable() && this.getTable().clone();
		}
		return aggregator;
	}

	getTable () {
		return this._table;
	}

	static factory (conf) {
		if (conf.aggregator === '@funnel') {
			return new Funnel(conf);
		}
		return new Aggregator(conf);
	}

	// allow additional aggregators to be defined by consumers
	// In theory there's no limit on what they can do (though for a predictable
	// interface it's best if they return aggregator instances)
	static define (name, func) {
		aggregators[name] = func;
	}

	static aggregate (name) {
		if (name === 'funnel') {
			throw new Error('TODO - support for funnels constructed using the JS API');
		}
		const queries = [].slice.call(arguments, 1);
		const aggregator = new Aggregator();
		aggregator.queries = queries;
		aggregator.aggregator = aggregators[name];
		aggregator.aggregatorName = name;
		return aggregator;
	}
}

// Mixin a load of table methods so they can be applied to the data via the aggregator
// that wraps it
Table.mixin(Aggregator.prototype);

// Mixin a load of keen-query methods so that child queries can be modified post-hoc
['raw', 'interval', 'absTime', 'relTime', 'group', 'filter', 'tidy'].forEach(method => {
	Aggregator.prototype[method] = function () {
		// As always, we clone to maintain immutability
		const aggregator = this.clone();
		aggregator.queries = aggregator.queries.map(q => q[method].apply(q, [].slice.call(arguments)))
		return aggregator;
	}
});

module.exports = Aggregator;
