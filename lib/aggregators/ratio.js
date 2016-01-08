
'use strict';

const printers = require('../printers');



function calculateRatio (queries, options, printer) {
	const data = queries.map(q => {
		return q.ctx.tabulate(q.data, options.timeFormat);
	});

	data[0].rows.forEach((r, i) => {
		r.forEach((c, j) => {
			if (j != 0) {
				r[j] = r[j] / data[1].rows[i][j]
			}
		})
	})

	return printer(data[0]);
}

class Ratio {
	constructor (opts) {
		const qs = opts.body.split('!/');
		printers.configureMultiStep.call(this, qs, opts.postSteps);
	}

	print () {
		const KeenQuery = require('../keen-query');
		const queries = this.queries.map(KeenQuery.build);
		return Promise.all(queries.map(q => q.print()))
			.then(res => {
				if (!this.postPrint) {
					return res;
				}

				return printers(this.postPrint, {
					tableType: calculateRatio,
					title: this.toString(),
					queries: res.map((r, i) => {
						return {
							data: r,
							ctx: queries[i]
						}
					})
				})
			})
	}
	toString () {
		return this.originalQuery;
	}
}

module.exports = Ratio;
