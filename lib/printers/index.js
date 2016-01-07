const printers = {
	rawData: function (data) {
		return data;
	},

	json: function (data) {
		return data.tableType ? data : this.tabulate(data);
	},

	csv: function (data) {

	}
}

module.exports = function (style, data, ctx) {
	const renderer = printers[style] || printers.json;
	return renderer.call(ctx, data);
}


module.exports.define = function (name, func) {
	printers[name] = func;
}
