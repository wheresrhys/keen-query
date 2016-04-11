'use strict';

const KeenQuery = require('../lib/index.js');
const expect = require('chai').expect;
describe.skip('reusability of keen-query objects', function () {
	let baseResult;
	let kq;

	before(function (done) {
		this.timeout(20000);
		kq = KeenQuery.build('cta->count()->relTime(1)->interval(h)');
		return kq.print('raw')
			.then(res => {
				baseResult = res;
				done();
			})
	});

	it('should reuse data when printing again', function () {
		return kq.print('raw')
			.then(res => {
				expect(res).to.equal(baseResult)
			})
	});

	it('should not mutate original data when adding some condition', function () {
		const altered = kq.filter('user.uuid');
		expect(altered).to.not.equal(kq);
		return Promise.all([
			altered.print('matrix'),
			kq.print('matrix')
		]).then(res => {
			expect(res[0]).to.not.deep.equal(res[1]);
		})
	})

	it('should not mutate original data when reducing', function () {
		const altered = kq.reduce('avg');
		expect(altered).to.not.equal(kq);
		return Promise.all([
			altered.print('matrix'),
			kq.print('matrix')
		]).then(res => {
			expect(res[0]).to.not.deep.equal(res[1]);
		})
	})
	describe('ratio', function () {
		let ratio;
		before(function (done) {
			ratio = KeenQuery.build('@ratio(cta->count(),cta->count(user.uuid))->relTime(1)->interval(h)');
			return ratio.print('raw')
				.then(() => {
					done();
				})
		});
		it('should not mutate original ratio data when reducing', function () {
			return Promise.all([
				ratio.reduce('avg').print('matrix'),
				ratio.print('matrix')
			])
				.then(res => {
					expect(res[0]).to.not.deep.equal(res[1]);
				})
		});
	});









// 'cta->count()->filter(user.uuid)->group(page.location.type,user.isStaff)->relTime(3)->round()';

})
