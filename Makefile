.PHONY: test

test-query:
	node ./bin/keen-query.js 'cta->count()->filter(user.uuid)'
	node ./bin/keen-query.js 'cta->count()->filter(user.uuid)->interval(d)->group(page.location.type)->flip()';
	node ./bin/keen-query.js 'cta->count()->filter(user.uuid)->group(page.location.type,user.isStaff)->flip()';

test-ratio:
	node ./bin/keen-query.js '@ratio(cta->count()!/cta->count(user.uuid))'
	node ./bin/keen-query.js '@ratio(cta->count()!/cta->count(user.uuid))->interval(d)'
	node ./bin/keen-query.js '@ratio(cta->count()!/cta->count(user.uuid))->interval(d)->group(page.location.type)'
	node ./bin/keen-query.js '@ratio(cta->count()!/cta->count(user.uuid))->group(page.location.type,user.isStaff)'

test-reduce:
	node ./bin/keen-query.js '@reduce(cta->count(),all)->interval(d)'
	node ./bin/keen-query.js '@reduce(cta->count(),all)->interval(d)->group(page.location.type)'
	node ./bin/keen-query.js '@reduce(cta->count(),all)->group(page.location.type, user.isStaff)'

test-select:
	node ./bin/keen-query.js 'cta->select(page.location.type)->relTime(30_minutes)'
	node ./bin/keen-query.js 'cta->select(page.location.type)->relTime(30_minutes)->group(user.isStaff)'
	node ./bin/keen-query.js 'cta->select(page.location.type)->relTime(30_minutes)->interval(d)'
	node ./bin/keen-query.js 'cta->select(page.location.type)->relTime(30_minutes)->interval(d)->group(user.isStaff)'

test: test-query test-ratio test-reduce test-select
