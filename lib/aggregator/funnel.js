'use strict';

const printers = require('../printers');
const KeenQuery = require('../keen-query');
const ImmutableMatrix = require('../data/immutable-matrix');
const postProcessing = require('../post-processing');

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
			this.sharedFunctions = conf.functions || [];
		}
	}

	print (style) {
		const postProcessors = [];

		this.sharedFunctions.forEach(funcConf => {
			if (funcConf.func === 'print') {
				this._printer = funcConf.params[0];
				return;
			}
			if (postProcessing.isPostProcessor(funcConf.func)) {
				postProcessors.push(funcConf);
			} else {
				this.queries = this.queries.map(kq => kq[funcConf.func].apply(kq, funcConf.params));
			}
		});

		const config = KeenQuery.getConfig();
		style = style || this._printer;

		if (style === 'qs' || style === 'qo') {
			return Promise.all(this.queries.map(q => q.print(style)));
		}

		if (this._matrix) {
			return Promise.resolve(printers.call(this, style))
		}

		return Promise.all(this.queries.map(q => q.print('funnelStep')))
			.then(queries => {

				const url = `https://api.keen.io/3.0/projects/${config.KEEN_PROJECT_ID}/queries/funnel?api_key=${config.KEEN_READ_KEY}&steps=${encodeURIComponent(JSON.stringify(queries))}`;
				if (style === 'url') {
					return url;
				}
				return fetch(url)
					.then(res => res.json())
					.then(data => {
						this._rawData = data;
						this._matrix = new ImmutableMatrix({
							axes: [{
								property: 'step',
								values: this.queries.map(q => q.valueLabel)
							}],
							data: this._rawData.result
						});
					})
					.then(() => {
							postProcessors.forEach(opts => {
								this._matrix = this.getData()[opts.func].apply(this.getData(), opts.params);
							})
						return printers.call(this, style)
					})
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
		return this._dimension || (this._matrix && this._matrix.dimension) || this.queries[0].dimension;
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
		aggregator._postProcessors = this._postProcessors && this._postProcessors.slice().map(f => Object.assign({}, f));
		if (withData) {
			aggregator._matrix = this.getData() && this.getData().clone();
		}
		return aggregator;
	}

	getData () {
		return this._matrix;
	}
}

// Mixin a load of matrix methods so they can be applied to the data via the aggregator
// that wraps it
ImmutableMatrix.mixin(Funnel.prototype);

// Mixin a load of keen-query methods so that child queries can be modified post-hoc
const queryMethods = require('../keen-query/query-methods');
queryMethods.mixin(Funnel.prototype, function (method, methodName) {
	// As always, we clone to maintain immutability
	return function () {
		const funnel = this.clone();
		funnel.queries = funnel.queries.map(q => q[methodName].apply(q, [].slice.call(arguments)))
		return funnel;
	}
});

module.exports = Funnel;
