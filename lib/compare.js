'use strict';

class Compare {
	constructor (compareQ) {
		this.compareQ = compareQ;
		const compareConf = /^@compare\((.*)\)$/.exec(compareQ);
		this.q1 = compareConf[1];

		const print = (/->print\((\w+\))/.exec(this.q) || [])[1];

		this.q2 = // q1 but insert ->prev()

		if (['qs', 'qo', 'url'].indexOf(print) > -1) {
			this.q1 = this.q1 + this.sharedQ;
			this.q2 = this.q2 + this.sharedQ;
			this.postPrint = false;
		} else {
			this.postPrint = print;
			this.q1 = this.q1 + '->print(json)';
			this.q2 = this.q2 + '->print(json)';
		}


		// append sharedQ to both q
		// if is a data printer type don't print yet
		// get the data etc, tabulate and print

		// hmm probably need to tabulate all the data
	}

	print () {
		const KeenQuery = require('./keen-query');
		return Promise.all([
			KeenQuery.execute(this.q1),
			KeenQuery.execute(this.q2)
		])
			.then(res => {
				console.log(res[0][0].rows[0])
			})
	}
	toString () {
		return this.compareQ;
	}
}

module.exports = Compare;
