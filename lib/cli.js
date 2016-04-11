'use strict';

const program = require('commander');
const KeenQuery = require('./keen-query');
const base = require('./index');

function executeQuery (query, pipe) {
	let print = 'ascii';
	let dots;

	if (pipe) {
		print = 'tsv';
	} else {
		if (/->print\(/.test(query)) {
			print = 'matrix';
		}
		dots = setInterval(() => process.stdout.write('.'), 100)
	}

	let keenQuery;
	try {
		keenQuery = base.build(query)
	} catch (e) {
		console.log('\n',e.message || e);
		process.exit(1)
	}
	keenQuery
		.print(print)
		.then(str => {
			if (print === 'matrix') {
				console.log('\n', JSON.stringify(str, null, '\t'));
			} else if (print === 'tsv') {
				console.log(str);
			} else {
				console.log('\n',str);
			}
			process.exit(0)
		}, err => {
			console.log('\n',err);
			process.exit(1)
		})
		.then(() => dots && clearInterval(dots))
}

module.exports = {
	executeQuery: executeQuery,
	init: function (additionalCommands) {
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
			.command('tsv [query]')
			.description('Runs a terse keen query')
			.action(function(query) {
				if (!query) {
					console.log('No keen query specified');
					process.exit(1);
				}
				executeQuery(query, true);
			});

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

