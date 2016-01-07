
'use strict';

const printers = require('../printers');

class Ratio {
	constructor (opts) {
		const qs = opts.body.split('!/');
		this.q1 = qs[0];
		this.q2 = qs[1];

		const print = (/->print\((\w+)\)/.exec(opts.postSteps) || [])[1];


		if (['qs', 'qo', 'url'].indexOf(print) > -1) {
			this.postPrint = false;
			this.q1 = this.q1 + opts.postSteps;
			this.q2 = this.q2 + opts.postSteps;
		} else {
			this.postPrint = print;
			this.q1 = this.q1 + opts.postSteps.split('->print')[0] + '->print(json)';
			this.q2 = this.q2 + opts.postSteps.split('->print')[0] + '->print(json)';
		}
	}

	print () {
		const KeenQuery = require('../keen-query');
		return Promise.all([
			KeenQuery.execute(this.q1),
			KeenQuery.execute(this.q2)
		])
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
