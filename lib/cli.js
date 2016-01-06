'use strict';

const program = require('commander');
const KeenQuery = require('./keen-query');

KeenQuery.definePrinter('ascii', require('./printers/ascii'));

function executeQuery (query) {
	if (!/->print\(/.test(query)) {
		query = query + '->print(ascii)';
	}
	return KeenQuery.execute(query)
		.then(str => {
			console.log(str);
			process.exit(0)
		}, err => {
			console.log(err);
			process.exit(1)
		})
}

module.exports = {
	executeQuery: executeQuery,
	init: function (additionalCommands) {

		if (!process.env || !process.env.KEEN_PROJECT_ID || !process.env.KEEN_READ_KEY) {
			console.log('Make sure you have KEEN_READ_KEY and KEEN_PROJECT_ID env vars set.');
			process.exit(1);
		}

		program
			.command('print [url]')
			.description('Converts an existing keen query into keen-query\'s format')
			.action(function(url) {
				if (!url) {
					console.log('No url specified');
					process.exit(1);
				}
				KeenQuery.fromUrl(url)
					.then(obj => {
						return obj.print('ascii')
							.then(str => {
								console.log(str);
								process.exit(0)
							});
					}, err => {
						console.log(err);
						process.exit(1)
					})
			});

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
						console.log('\nSuccessfully converted to:\n\n' + 	obj.toString());
						process.exit(0)
					}, err => {
						console.log(err);
						process.exit(1)
					})
			});

		if (additionalCommands) {
			additionalCommands(program);
		}

		program
			.command('* [query]')
			.description('Runs a terse keen query')
			.action(function(query) {
				if (!query) {
					console.log('No keen query specified');
					process.exit(1);
				}
				executeQuery(query);
			});

		program.parse(process.argv);

		if (!process.argv.slice(2).length) {
			program.outputHelp();
		}
	}
}

