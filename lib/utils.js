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
	},

	transformValue: (value, handleList) => {
		if (handleList === true) {
			return value.split(/,\s*/g)
				.map(transformValue);
		}

		// support strings passed in with quote marks
		if (/^("|'').*\1$/.test(value)) {
			return value.substr(1, value.length - 2)
		}

		if (value === 'true') {
			return true;
		}	else if (value === 'false') {
			return false;
		}

		const asNumber =  Number(value);

		return asNumber === asNumber ? asNumber : value;
	}
};
