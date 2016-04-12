.PHONY: test

install:
	npm install

test-unit:
	mocha test/helpers.js test

test: test-unit
	nbt verify --skip-layout-checks
