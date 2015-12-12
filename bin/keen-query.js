#!/usr/bin/env node
'use strict';

const program = require('commander');
const KeenQuery = require('../lib/keen-query');

program
	.command('* [query]')
	.description('Runs a terse keen query')
	.action(function(query) {
		if (!query) {
			console.log('No keen query specifeid');
			process.exit(1);
		}
		if (!/->print\(/.test(query)) {
			query = query + '->print(ascii)';
		}
		KeenQuery.execute(query)
			.then(str => {
				console.log(str);
				process.exit(0)
			}, err => {
				console.log(err);
				process.exit(1)
			})
	});


program.parse(process.argv);

if (!process.argv.slice(2).length) {
	program.outputHelp();
}
