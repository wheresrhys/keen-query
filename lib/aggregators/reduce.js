'use strict';

const printers = require('../printers');

const strategiesMap = {
	avg: vals => {
		return vals.reduce((tot, val) => tot + val, 0) / vals.length;
	},
	min: vals => {
		return vals.reduce((min, val) => Math.min(val, min), vals[0]);
	},
	max: vals => {
		return vals.reduce((max, val) => Math.max(val, max), vals[0]);
	},
	median: vals => {
		const obj = {};
		vals.forEach(v => {
			obj[v] = (obj[v] || 0) + 1;
		})
		let maxCount = 1;
		return Object.keys(obj).reduce((median, v) => {
			if (obj[v] > maxCount) {
				median = v;
				maxCount = obj[v];
			}
			return median;
		}, null) || 'none'
	}
};

function pluck (matrix, column) {
	return matrix.map(r => r[column]);
}

function reduce (query, options, printer) {
	const data = query.ctx.tabulate(query.data, options.timeFormat);

	if (data.tableType === 'single') {
		throw 'Cannot reduce table which only contains one value, silly';
	}
	data.rows = options.strategies.map(strategy => {
		return data.rows[0].map((r, i) => {
			if (i === 0) {
				return strategy;
			}
			return strategiesMap[strategy](pluck(data.rows, i))
		})
	});

	return printer(data);
}


class Reduce {
	constructor (opts) {
		this.strategy = opts.param;
		printers.configureMultiStep.call(this, [opts.body], opts.postSteps, opts.body);
	}

	print () {
		const KeenQuery = require('../keen-query');
		const query = KeenQuery.build(this.queries[0]);
		return query.print()
			.then(res => {

				if (!this.postPrint) {
					return res;
				}

				const strategies = this.strategy === 'all' ? Object.keys(strategiesMap) : [this.strategy];

				return printers(this.postPrint, {
					tableType: reduce,
					title: this.toString(),
					aggregateOptions: {
						strategies: strategies
					},
					queries: {
						data: res,
						ctx: query
					}
				})
			})
	}
	toString () {
		return this.originalQuery;
	}
}

module.exports = Reduce;
