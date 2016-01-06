
'use strict';

const dataPrinter = require('../data-printer');

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
				console.log(res[0])
					res[0].rows.forEach((r, i) => {
						r.forEach((c, j) => {
							if (j != 0) {
								r[j] = r[j] / res[1].rows[i][j]
							}
						})

					})
					return dataPrinter(this.postPrint, res[0], this);
				// // TODO output timeframe
				// if (res[0].tableType === 'cross') {
				// 	res[0].name = 'current';
				// 	res[1].name = 'previous';
				// 	return [this.toString()].concat(res.map(data => {
				//
				// 	})).join('\n\n');
				// }
			})
	}
	toString () {
		return this.originalQuery;
	}
}

module.exports = Ratio;
