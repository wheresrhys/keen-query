'use strict';

const printers = require('../printers');


function concatTables (queries, options) {
	const data = queries.map(q => {
		return q.ctx.tabulate(q.data, 'ISO');
	});

	const table = data[0];
	const col = data[1]

	table.headings = [table.headings[0]].concat(options.concatHeadings);
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

	return ascii(table);
}



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
		const queries = this.queries.map(KeenQuery.build);
		return Promise.all(queries.map(q => q.print()))
			.then(res => {
				if (!this.postPrint) {
					return res;
				}
				if (queries[0].isMultiDimensional) {
					res[0].name = 'current';
					res[1].name = 'previous';

					return printers(this.postPrint, {
						tableType: 'multi',
						title: this.toString(),
						queries: res.map((r, i) => {
							return {
								data: r,
								ctx: queries[i]
							}
						})
					})
				} else {
					return printers(this.postPrint, {
						tableType: concatTables,
						aggregateOptions: {
							concatHeadings: ['current', 'previous']
						},
						title: this.toString(),
						queries: res.map((r, i) => {
							return {
								data: r,
								ctx: queries[i]
							}
						})
					})
				}
			})
	}
	toString () {
		return this.originalQuery;
	}
}

module.exports = ComparePast;
