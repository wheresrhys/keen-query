const printers = {
	raw: function (data) {
		return this._data;
	},

	json: function (data, timeFormat) {
		return this._table;
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

module.exports.mixin = function (obj) {

}

