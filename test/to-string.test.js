const expect = require('chai').expect;
const KeenQuery = require('../lib/keen-query');

describe('toString', function () {
	describe('aggregator', function () {
		it('should preserve shared filters', function () {

			const query = KeenQuery.build(`
				@pct(
					page:view ->count(user.uuid) ->filter(user.myft.optedIntoDailyEmail=true),
					page:view->count(user.uuid)
				)
				->filter(user.subscriptions.isStaff!=true)`);

			expect(query.toString()).to.equal('@pct(page:view->count(user.uuid)->filter(user.myft.optedIntoDailyEmail=true),page:view->count(user.uuid))->filter(user.subscriptions.isStaff!=true)');

		});
	});
});
