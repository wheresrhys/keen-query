const printers = {
	raw: function (data) {
		return this._data;
	},

	json: function (data, timeFormat) {
		return this._table.humanize();
	},

	csv: function (data) {

	}
}

// module.exports.nonFetchingPrinters = {
// 	qs: true,
// 	qo: true,
// 	url: true
// }

module.exports = function (style) {
	if (!this._table && style !== 'raw') {
		throw 'Not printable';
	}
	const renderer = printers[style] || printers.json;
	return renderer.call(this);
}


module.exports.define = function (name, func) {
	printers[name] = func;
}
