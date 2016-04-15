'use strict';

const shorthands = require('./shorthands');
const utils = require('../utils');

module.exports.parse = function (filter) {
	let filterConf = /^([^!~\?]*)(=|!=|>|<|~|!~|\?|!\?)(.+)$/.exec(filter);
	if (filterConf) {
		if (!filterConf[1] && !filterConf[3]) {
			throw new Error(`Filter ${filter} must specify a property name to filter on and a value to match e.g. ->filter(user.uuid${filter}abcd)`);
		}
		if (!filterConf[1]) {
			throw new Error(`Filter ${filter} must specify a property name to filter on on the left hand side e.g. ->filter(user.uuid${filter})`);
		}
		if (!filterConf[3]) {
			if (filterConf[2] === '?' || filterConf[2] === '!?') {
				throw new Error(`Filter ${filter} must specify one or more comma-separated values to match on the right hand side e.g ->filter(${filter}apple,pear,cherry)`);
			} else {
				throw new Error(`Filter ${filter} must specify a value to match on the right hand side e.g ->filter(${filter}apple)`);
			}
		}

		if (filterConf[2] === '!?') {
			// TODO be carefuller around quoted commas
			return filterConf[3]
				.split(',')
				.map(val => {
					return {
						property_name: filterConf[1],
						operator: shorthands.filters['!='].operator,
						property_value: utils.transformValue(val)
					}
				});
		}

		return {
			property_name: filterConf[1],
			operator: shorthands.filters[filterConf[2]].operator,
			property_value: utils.transformValue(filterConf[3], shorthands.filters[filterConf[2]].handleList)
		};
	}

	const unary = /^(\!)?(.+)$/.exec(filter);
	if (unary) {
		return {
			property_name: unary[2],
			operator: 'exists',
			property_value: !unary[1]
		};
	}

	throw new Error('Filter structure not recognised');
}

module.exports.unparse = function (filterObj) {
	let filter;
	if (filterObj.operator === 'exists') {
		filter = (filterObj.property_value === false ? '!' : '') + filterObj.property_name;
	} else if (filterObj.operator === 'in') {
		filter = filterObj.property_name + '?' + filterObj.property_value.join(',');
	} else {
		filter = filterObj.property_name + shorthands.reverseFilters[filterObj.operator] + filterObj.property_value;
	}

	return filter;
}
