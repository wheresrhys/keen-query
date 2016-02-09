const printers = {
	raw: function () {
		return this._data;
	},

	json: function () {
		return this.getTable().humanize();
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
		throw new Error('Not printable');
	}
	const renderer = printers[style] || printers.json;
	return renderer.call(this);
}


module.exports.define = function (name, func) {
	printers[name] = func;
}
