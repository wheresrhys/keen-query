'use strict';

module.exports = {
	isSingleNumber: (res) => {
		return Object.keys(res).length === 1 && typeof res.result === 'number';
	}
}
