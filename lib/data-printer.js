const printers = {
	rawData: function (data) {
		return data;
	},

	json: function (data) {
		return this.tabulate(data);
	},

	csv: function (data) {

	}
}

module.exports = function (style, data, ctx) {
	const renderer = printers[style] || printers.json;
	return renderer.call(ctx, data);
}


module.exports.define = function (name, printerFunc) {
	printers[name] = printerFunc;
}
