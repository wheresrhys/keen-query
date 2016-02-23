.PHONY: test

test-query:
	node ./bin/keen-query.js 'cta->count(user.uuid)->relTime(3)'
	node ./bin/keen-query.js 'cta->count()->filter(user.uuid)->relTime(3)'
	node ./bin/keen-query.js 'cta->count()->filter(user.uuid!?12,11,14)->interval(2_d)->relTime(6)';
	node ./bin/keen-query.js 'cta->count()->filter(user.uuid)->interval(d)->group(page.location.type)->relTime(3)';
	node ./bin/keen-query.js 'cta->count()->filter(user.uuid)->interval(day)->group(page.location.type)->relTime(3)';
	node ./bin/keen-query.js 'cta->count()->filter(user.uuid)->group(page.location.type,user.isStaff)->relTime(3)';
	node ./bin/keen-query.js 'cta->count()->filter(user.uuid)->group(page.location.type,user.isStaff)->relTime(3)->round()';
	node ./bin/keen-query.js 'cta->count()->filter(user.uuid)->interval(2_d)->relTime(6)';

test-trim:
	node ./bin/keen-query.js 'cta->count(user.uuid)->relTime(3)'
	node ./bin/keen-query.js 'cta -> count (user.uuid) -> relTime(3)'
	node ./bin/keen-query.js ' @ratio ( cta -> count (user.uuid) -> relTime(3) , cta -> count (user.uuid) -> relTime(3) ) ->interval(d)'

test-ratio:
	node ./bin/keen-query.js '@ratio(cta->count(),cta->count(user.uuid))->relTime(3)'
	node ./bin/keen-query.js '@ratio(cta->count(),cta->count(user.uuid))->interval(d)->relTime(3)'
	node ./bin/keen-query.js '@ratio(cta->count(),cta->count(user.uuid))->interval(d)->group(page.location.type)->relTime(3)'
	node ./bin/keen-query.js '@ratio(cta->count(),cta->count(user.uuid))->group(page.location.type,user.isStaff)->relTime(3)'
	node ./bin/keen-query.js '@ratio(cta->count()->group(page.location.type,user.isStaff),cta->count(user.uuid)->group(page.location.type))->relTime(3)'

test-concat:
	node ./bin/keen-query.js '@concat(cta->count(),cta->count(user.uuid),dwell->count(user.uuid))->relTime(3)'
	node ./bin/keen-query.js '@concat(cta->count()->group(page.location.type),cta->count(user.uuid),dwell->count(user.uuid))->relTime(3)'
	node ./bin/keen-query.js '@concat(cta->count(),cta->count(user.uuid),dwell->count(user.uuid))->group(page.location.type)->relTime(3)'
	node ./bin/keen-query.js '@concat(cta->count()->group(user.isStaff),cta->count(user.uuid),dwell->count(user.uuid))->group(page.location.type)->relTime(3)'
	node ./bin/keen-query.js '@concat(cta->count(),cta->count(user.uuid))->interval(d)->relTime(3)'
	node ./bin/keen-query.js '@concat(cta->count()->group(page.location.type),cta->count(user.uuid))->interval(d)->relTime(3)'

	# node ./bin/keen-query.js '@concat(page:view->count(user.uuid)->interval(day)->relTime(this_3_days),page:view->count(user.uuid)->filter(user.myft.isMyFtUser=true)->interval(day)->relTime(this_3_days))';
	# node ./bin/keen-query.js '@concat(cta->count(),cta->count(user.uuid))->interval(d)->relTime(3)'
	# node ./bin/keen-query.js '@concat(cta->count(),cta->count(user.uuid))->interval(d)->group(page.location.type)->relTime(3)'
	# node ./bin/keen-query.js '@concat(cta->count(),cta->count(user.uuid))->group(page.location.type,user.isStaff)->relTime(3)'
#

test-reduce:
	node ./bin/keen-query.js 'cta->count()->interval(d)->relTime(3)->reduce(avg)'
	node ./bin/keen-query.js 'cta->count()->interval(d)->group(page.location.type)->relTime(3)'
	node ./bin/keen-query.js 'cta->count(user.uuid)->interval(d)->group(page.location.type)->relTime(3)->reduce(all)'
	node ./bin/keen-query.js '@ratio(cta->count(),cta->count(user.uuid))->interval(d)->group(page.location.type)->relTime(3)'
	node ./bin/keen-query.js '@ratio(cta->count(),cta->count(user.uuid))->interval(d)->group(page.location.type)->relTime(3)->reduce(avg)'

test-threshold:
	node ./bin/keen-query.js 'cta->count()->group(page.location.type)->interval(d)->relTime(3)->threshold(5000,minimumlevel)'

test-select:
	node ./bin/keen-query.js 'cta->select(page.location.type)->relTime(30_minutes)'
	node ./bin/keen-query.js 'cta->select(page.location.type)->relTime(30_minutes)->group(user.isStaff)'
	node ./bin/keen-query.js 'cta->select(page.location.type)->relTime(30_minutes)->interval(m)'
	node ./bin/keen-query.js 'cta->select(page.location.type)->relTime(30_minutes)->interval(m)->group(user.isStaff)'

test-sort:
	node ./bin/keen-query.js 'page:view->count()->group(page.location.type,device.oGridLayout)->relTime(3)->sortDesc(min,device.oGridLayout)'
	# node ./bin/keen-query.js 'cta->count()->group(page.location.type)->relTime(3)->sortAsc()'
	# node ./bin/keen-query.js 'cta->count(user.uuid)->interval(d)->group(page.location.type)->relTime(3)->reduce(all)'
	# node ./bin/keen-query.js '@ratio(cta->count(),cta->count(user.uuid))->interval(d)->group(page.location.type)->relTime(3)'
	# node ./bin/keen-query.js '@ratio(cta->count(),cta->count(user.uuid))->interval(d)->group(page.location.type)->relTime(3)->reduce(avg)'


test-reusability:
	mocha test/reusability.test.js

test-keen-urls:
	mocha test/keen-urls.test.js

test-err:
	node ./bin/keen-query.js '@pct(site:optout->count(user.uuid)->group(device.oGridLayout),page:view->count(user.uuid)->group(device.oGridLayout)->filter(device.oGridLayout?L,M))->round()->interval(d)'

install:
	npm install

test:
	nbt verify --skip-layout-checks
