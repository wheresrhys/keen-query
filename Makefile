include n.Makefile

test-unit:
	mocha test/helpers.js test

test: test-unit verify
