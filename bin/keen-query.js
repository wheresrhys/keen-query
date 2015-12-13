#!/usr/bin/env node
'use strict';

const program = require('commander');
const KeenQuery = require('../lib/keen-query');

program
	.command('convert [url]')
	.description('Converts an existing keen query into keen-query\'s format')
	.action(function(url) {
		if (!url) {
			console.log('No url specified');
			process.exit(1);
		}
		KeenQuery.fromUrl(url)
			.then(obj => {
				console.log('\nSuccessfully converted to:\n\n' + obj.toString());
				process.exit(0)
			}, err => {
				console.log(err);
				process.exit(1)
			})
	});

program
	.command('* [query]')
	.description('Runs a terse keen query')
	.action(function(query) {
		if (!query) {
			console.log('No keen query specified');
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
