'use strict';

const printers = require('../printers');
const Table = require('../table');
const configContainer = process.browser ? window : process.env;

class Funnel {
	constructor (conf) {
		// conf is an object returned by ../parser.js
		if (conf) {
			// circular dependency hell!
			const base = require('../index');
			// end circular dependency hell!

			// build each query
			this.queries = conf.body.map(base.build);

			// these work pretty much the same as on the keen-query object - mainly defining what to do
			// with data after its fetched
			this._printer = conf.print;
			this._postProcessing = conf.postProcessing;
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

		return Promise.all(this.queries.map(q => q.print('funnelStep')))
			.then(queries => {
				return fetch(`https://api.keen.io/3.0/projects/${configContainer.KEEN_PROJECT_ID}/queries/funnel?api_key=${configContainer.KEEN_READ_KEY}&steps=${JSON.stringify(queries)}`)
			})
			.then(res => res.json())
			.then(data => {
				this._data = data;
				this._table = new Table({
					axes: [{
						property: 'step',
						values: this.queries.map(q => q.valueLabel)
					}],
					data: this._data.result
				});
			})
			.then(() => {
				if (this._postProcessing) {
					this._postProcessing.forEach(opts => {
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
		return `@${this.aggregatorName}(${this.queries.map(q => q.toString()).join(',')})`;
	}

	get dimension () {
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
		const aggregator = new Funnel();
		aggregator.queries = this.queries.map(kq => kq.clone(withData))
		aggregator.aggregator = this.aggregator;
		aggregator.aggregatorName = this.aggregatorName;
		aggregator._printer = this._printer;
		aggregator._postProcessing = this._postProcessing && this._postProcessing.slice().map(f => Object.assign({}, f));
		if (withData) {
			aggregator._table = this.getTable() && this.getTable().clone();
		}
		return aggregator;
	}

	getTable () {
		return this._table;
	}
}

// Mixin a load of table methods so they can be applied to the data via the aggregator
// that wraps it
Table.mixin(Funnel.prototype);

// Mixin a load of keen-query methods so that child queries can be modified post-hoc
['raw', 'interval', 'absTime', 'relTime', 'group', 'filter', 'tidy'].forEach(method => {
	Funnel.prototype[method] = function () {
		// As always, we clone to maintain immutability
		const aggregator = this.clone();
		aggregator.queries = aggregator.queries.map(q => q[method].apply(q, [].slice.call(arguments)))
		return aggregator;
	}
});

module.exports = Funnel;
