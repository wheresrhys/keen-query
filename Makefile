.PHONY: test

test-unit:
	mocha test/helpers.js test

test: test-unit verify
