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


module.exports.define = function (name, func) {
	printers[name] = func;
}



module.exports.configureMultiStep = function (queries, postSteps, stringToCheck) {
	const print = (/->print\((\w+)\)/.exec(postSteps || stringToCheck) || [])[1];

	if (['qs', 'qo', 'url'].indexOf(print) > -1) {
		this.postPrint = false;
		this.queries = queries.map(q => q + (postSteps || `->print(${print})`));
	} else {
		this.postPrint = print;
		this.queries = queries.map(q => {
			return(q + (postSteps || '')).split('->print')[0] + '->print(json)'
		});
	}
}
