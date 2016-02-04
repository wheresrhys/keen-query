.PHONY: test

test-query:
	node ./bin/keen-query.js 'cta->count(user.uuid)->relTime(3)'
	node ./bin/keen-query.js 'cta->count()->filter(user.uuid)->relTime(3)'
	node ./bin/keen-query.js 'cta->count()->filter(user.uuid)->interval(d)->group(page.location.type)->relTime(3)';
	node ./bin/keen-query.js 'cta->count()->filter(user.uuid)->interval(day)->group(page.location.type)->relTime(3)';
	node ./bin/keen-query.js 'cta->count()->filter(user.uuid)->group(page.location.type,user.isStaff)->relTime(3)';
	node ./bin/keen-query.js 'cta->count()->filter(user.uuid)->group(page.location.type,user.isStaff)->relTime(3)->round()';
	node ./bin/keen-query.js 'cta->count()->filter(user.uuid)->interval(2_d)->relTime(6)';

test-ratio:
	node ./bin/keen-query.js '@ratio(cta->count(),cta->count(user.uuid))->relTime(3)'
	node ./bin/keen-query.js '@ratio(cta->count(),cta->count(user.uuid))->interval(d)->relTime(3)'
	node ./bin/keen-query.js '@ratio(cta->count(),cta->count(user.uuid))->interval(d)->group(page.location.type)->relTime(3)'
	node ./bin/keen-query.js '@ratio(cta->count(),cta->count(user.uuid))->group(page.location.type,user.isStaff)->relTime(3)'

test-concat:
	node ./bin/keen-query.js '@concat(cta->count(),cta->count(user.uuid))->relTime(3)'
	node ./bin/keen-query.js '@concat(cta->count(),cta->count(user.uuid))->interval(d)->relTime(3)'
	node ./bin/keen-query.js '@concat(cta->count(),cta->count(user.uuid))->interval(d)->group(page.location.type)->relTime(3)'
	# node ./bin/keen-query.js '@concat(cta->count(),cta->count(user.uuid))->group(page.location.type,user.isStaff)->relTime(3)'


test-reduce:
	node ./bin/keen-query.js 'cta->count()->interval(d)->relTime(3)->reduce(avg)'
	node ./bin/keen-query.js 'cta->count()->interval(d)->group(page.location.type)->relTime(3)'
	node ./bin/keen-query.js 'cta->count(user.uuid)->interval(d)->group(page.location.type)->relTime(3)->reduce(all)'
	node ./bin/keen-query.js '@ratio(cta->count(),cta->count(user.uuid))->interval(d)->group(page.location.type)->relTime(3)->reduce(avg)'

test-select:
	node ./bin/keen-query.js 'cta->select(page.location.type)->relTime(30_minutes)'
	node ./bin/keen-query.js 'cta->select(page.location.type)->relTime(30_minutes)->group(user.isStaff)'
	node ./bin/keen-query.js 'cta->select(page.location.type)->relTime(30_minutes)->interval(m)'
	node ./bin/keen-query.js 'cta->select(page.location.type)->relTime(30_minutes)->interval(m)->group(user.isStaff)'

test-reusability:
	mocha test/reusability.test.js

test-keen-urls:
	mocha test/keen-urls.test.js

test: test-query test-ratio test-reduce test-select test-reusability test-keen-urls
