'use strict';

const printers = require('../printers');

class ComparePast {
	constructor (opts) {
		const q1 = opts.body + opts.postSteps || '';

		printers.configureMultiStep.call(this, [
			q1.split('->print')[0],
			q1.split('->print')[0] + '->prev()'
		], '', q1);
	}

	print () {
		const KeenQuery = require('../keen-query');
		return Promise.all(this.queries.map(KeenQuery.execute))
			.then(res => {
				if (!this.postPrint) {
					return res;
				}
				if (res[0].tableType === 'cross') {
					res[0].name = 'current';
					res[1].name = 'previous';
					return [this.toString()].concat(res.map(data => {
						return printers(this.postPrint, data, this);
					})).join('\n\n');
				} else {
					const table = res[0];
					const col = res[1]
					table.headings.push(col.headings[1]);
					col.rows.forEach(r => {
						const newRow = table.rows.find(t => t[0] === r[0]);
						if (newRow) {
							newRow.push(r[1]);
						} else {
							table.rows.push([r[0], 0, r[1]]);
						}
					})
					table.rows.forEach(r => {
						if (r.length === 2) {
							r.push(0);
						}
					});

					return printers(this.postPrint, table, this);

				}
			})
	}
	toString () {
		return this.originalQuery;
	}
}

module.exports = ComparePast;
