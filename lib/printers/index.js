const printers = {
	raw: function (data) {
		return data;
	},

	json: function (data, timeFormat) {
		return data.tableType ? data : this.tabulate(data, timeFormat);
	},

	csv: function (data) {

	}
}

module.exports = function (style) {
	if (!this._table) {
		throw 'Not printable';
	}
	const renderer = printers[style] || printers.json;
	return renderer.call(this);
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
		if (print !== 'raw') {
			this.postPrint = print || 'json';
		}
		this.queries = queries.map(q => {
			return(q + (postSteps || '')).split('->print')[0] + '->print(raw)';
		});
	}
}
