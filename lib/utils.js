'use strict';

module.exports = {
	isSingleNumber: res => {
		return Object.keys(res).length === 1 && typeof res.result === 'number';
	},

	getTimePoints: (data, unit) => {
		return module.exports.arrayN(data.result.length).map((v, i) => {
			return `${unit} ${i + 1}`;
		});
	},

	arrayN: n => {
		return Array(n).join('.').split('.').map(v => undefined);
	},

	stringN: n => {
		return Array(n + 1).join(' ');
	}
}
