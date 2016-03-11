const printers = {
	raw: function () {
		return this._data;
	},

	json: function () {
		return this.getTable().humanize();
	},

	csv: function () {

	},
	tsv: function () {
		const table = this.getTable().humanize('human');
		const rows = table.headings ? [table.headings] : []
		return rows.concat(table.rows)
				.map(row => row.join('\t'))
				.join('\n');
	}
}

// module.exports.nonFetchingPrinters = {
// 	qs: true,
// 	qo: true,
// 	url: true
// }

module.exports = function (style) {
	if (!this._table && style !== 'raw') {
		throw new Error('Not printable');
	}
	const renderer = printers[style] || printers.json;
	return renderer.call(this);
}


module.exports.define = function (name, func) {
	printers[name] = func;
}
