'use strict';

const shorthands = require('./shorthands');
const filters = require('./filters');

const methods = {
	extract: function (prop) {
		this._setExtraction('extraction');
		this.query.target_property = prop;
		return this;
	},

	count: function (prop) {
		if (prop) {
			this._setExtraction('count_unique')
			this.query.target_property = prop;
		} else {
			this._setExtraction('count')
		}
		return this;
	},

	min: function (prop) {
		this._setExtraction('minimum');
		this.query.target_property = prop;
		return this;
	},

	max: function (prop) {
		this._setExtraction('maximum');
		this.query.target_property = prop;
		return this;
	},

	sum: function (prop) {
		this._setExtraction('sum');
		this.query.target_property = prop;
		return this;
	},

	avg: function (prop) {
		this._setExtraction('average');
		this.query.target_property = prop;
		return this;
	},

	median: function (prop) {
		this._setExtraction('median');
		this.query.target_property = prop;
		return this;
	},

	percentile: function (prop, pct) {
		this._setExtraction('percentile');
		this.query.target_property = prop;
		this.query.percentile = pct;
		return this;
	},

	pct: function (prop, pct) {
		return this.precentile(prop, pct);
	},

	with: function (prop) {
		this.query.actor_property = prop;
		return this;
	},

	interval: function (interval) {
		const instance = this._getInstance();

		if (this.extraction === "extraction") {
			throw new Error('Keen extractions are different to all other queries. They do not support grouping or intervals');
		}

		if (instance.dimensions.indexOf('timeframe') === -1) {
			instance.dimensions.unshift('timeframe');
		}

		const intervalParts = /^(?:(\d+)_)?([a-z]+)$/.exec(interval).slice(1);
		const intervalUnit = shorthands.intervalUnits[intervalParts[1]] || intervalParts[1];
		instance.intervalUnit = intervalParts[0] ? `${intervalParts[0]} ${intervalUnit}s` : intervalUnit;
		instance.query.interval = intervalParts[0] ? `every_${intervalParts[0]}_${intervalUnit}s` : shorthands.intervals[intervalUnit];

		instance.timeframe = instance.timeframe || 'this_14_days';
		return instance;
	},

	absTime: function (start, end, interval) {
		const instance = this._getInstance();
		instance.timeframe = JSON.stringify({
			start: typeof start === 'string' ? start : start.toISOString(),
			end: typeof end === 'string' ? end : end.toISOString()
		});

		if (interval) {
			instance.interval(interval);
		}

		return instance;
	},

	relTime: function (time, interval) {
		const instance = this._getInstance();
		if (time) {
			if (parseInt(time, 10) === Number(time)) {
				time = time + '_days';
			}
		} else {
			time = '14_days';
		}
		instance.timeframe = (time.indexOf('this_') === 0 || time.indexOf('previous_') === 0) ? time : 'this_' + time;

		if (interval) {
			instance.interval(interval);
		}

		return instance;
	},

	group: function () {
		const instance = this._getInstance();

		if (this.extraction === "extraction") {
			throw new Error('Keen extractions are different to all other queries. They do not support grouping or intervals');
		}

		instance.groupedBy = instance.groupedBy || [];
		instance.groupedBy = instance.groupedBy.concat([].slice.call(arguments));
		instance.dimensions = instance.dimensions.concat([].slice.call(arguments));
		return instance;
	},

	filter: function (filter) {
		const instance = this._getInstance();
		if (typeof filter === 'string') {
			filter = filters.parse(filter);
		}

		if (!Array.isArray(filter)) {
			filter = [filter]
		}
		instance.filters = instance.filters.concat(filter)
		return instance;
	},

	tidy: function (extraStrict) {
		const instance = this._getInstance();
		instance.excludeNulls = true;
		if (extraStrict) {
			instance.excludeFalsy = true;
		}
		return instance;
	}
};

const methodNames = Object.keys(methods);

const extendables = [];

module.exports.mixin = function (proto, transform) {
	methodNames.forEach(name => {
		proto[name] = transform ? transform(methods[name], name) : methods[name];
	});
	extendables.push({proto, transform})
}

module.exports.define = function (name, func) {
	extendables.forEach(obj => {
		obj.proto[name] = obj.transform ? obj.transform(func, name) : func;
	})
}
