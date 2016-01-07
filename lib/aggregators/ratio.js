
'use strict';

const printers = require('../printers');

class Ratio {
	constructor (opts) {
		const qs = opts.body.split('!/');
		printers.configureMultiStep.call(this, qs, opts.postSteps);
	}

	print () {
		const KeenQuery = require('../keen-query');
		return Promise.all(this.queries.map(KeenQuery.execute))
			.then(res => {
				if (!this.postPrint) {
					return res;
				}
				res[0].rows.forEach((r, i) => {
					r.forEach((c, j) => {
						if (j != 0) {
							r[j] = r[j] / res[1].rows[i][j]
						}
					})

				})
				return printers(this.postPrint, res[0], this);
			})
	}
	toString () {
		return this.originalQuery;
	}
}

module.exports = Ratio;
