const printers = {
	raw: function () {
		return this._rawData;
	},

	json: function () {
		return this.getData().unflatten();
	},

	csv: function () {

	},
	tsv: function () {
		const table = this.getData().unflatten('human');
		const rows = table.headings ? [table.headings] : []
		return rows.concat(table.rows)
				.map(row => row.join('\t'))
				.join('\n');
	},
	ascii: require('./ascii')
}

module.exports = function (style) {
	if (!this._matrix && style !== 'raw') {
		throw new Error('Not printable');
	}
	const renderer = printers[style] || printers.json;
	return renderer.call(this);
}

module.exports.define = function (name, func) {
	printers[name] = func;
}
