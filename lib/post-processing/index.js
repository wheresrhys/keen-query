const reduce = require('./reduce');
const threshold = require('./threshold');
const sort = require('./sort');
const cutoff = require('./cutoff');

const postProcessors = {
	round: function (points) {
		points = points || 0;
		return this.clone({
			data: this.cellIterator(val => {
				return Math.round(val * Math.pow(10, points)) / Math.pow(10, points);
			})
		});
	},
	multiply: function (number) {
		return this.clone({
			data: this.cellIterator(val => {
				return val * number;
			})
		});
	},
	divide: function (number) {
		return this.clone({
			data: this.cellIterator(val => {
				return val / number;
			})
		});
	},
	reduce: reduce.reduce,
	sortAsc: sort.ascending,
	sortDesc: sort.descending,
	threshold: threshold.threshold,
	cutoff: cutoff.cutoff,
	top: cutoff.top,
	bottom: cutoff.bottom
}

const postProcessorNames = Object.keys(postProcessors);

module.exports.mixin = function (proto, transform) {
	postProcessorNames.forEach(method => {
		proto[method] = transform ? transform(postProcessors[method]) : postProcessors[method];
	});
}

module.exports.isPostProcessor = funcName => {
	return postProcessorNames.indexOf(funcName) > -1
}
