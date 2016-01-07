'use strict';

module.exports = {
	isSingleNumber: res => {
		return Object.keys(res).length === 1 && typeof res.result === 'number';
	},


	getTimePoints: (data, unit) => {
		console.log(data)
		return data.result.map((r, i) => {
			switch (unit) {
				case 'minute' :
					return r.timeframe.start.split('T')[1].slice(0, 8);
				case 'hour' :
					return r.timeframe.start.split('T')[1].split(0, 8);
				case 'day' :
					return r.timeframe.start.split('T')[0];
				case 'week' :
					return `${r.timeframe.start.split('T')[0]} - ${r.timeframe.end.split('T')[0]}`;
				case 'month' :
					return `${r.timeframe.start.split('T')[0]} - ${r.timeframe.end.split('T')[0]}`;
					return;
				case 'year' :
					return `${i+1}th year`;
				default :
					return `${i+1}th period`;
			}
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
