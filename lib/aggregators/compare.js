'use strict';

const printers = require('../printers');

class Compare {
	constructor (opts) {
		this.q1 = opts.body + opts.postSteps || ''
		const print = (/->print\((\w+)\)/.exec(this.q1) || [])[1];

		this.q1 = this.q1.split('->print')[0]
		this.q2 = this.q1 + '->prev()';

		if (['qs', 'qo', 'url'].indexOf(print) > -1) {
			this.postPrint = false;
			this.q1 = `${this.q1}->print(${print})`;
			this.q2 = `${this.q2}->print(${print})`;
		} else {
			this.postPrint = print;
			this.q1 = this.q1 + '->print(json)';
			this.q2 = this.q2 + '->print(json)';
		}
	}

	print () {
		const KeenQuery = require('../keen-query');
		return Promise.all([
			KeenQuery.execute(this.q1),
			KeenQuery.execute(this.q2)
		])
			.then(res => {
				// TODO output timeframe
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

module.exports = Compare;
