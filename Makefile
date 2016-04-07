.PHONY: test

install:
	npm install

test-unit:
	export KEEN_PROJECT_ID=test_proj; export KEEN_READ_KEY=test_key; mocha test

test: test-unit
	nbt verify --skip-layout-checks
