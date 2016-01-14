const KeenQuery = require('./lib/keen-query');
const parser = require('./lib/parser');
const aggregators = require('./lib/aggregators');

function build (queryConf) {
	if (typeof queryConf === 'string') {
		queryConf = parser(queryConf);
	}
	if (queryConf.aggregator) {
		console.log('Running aggregate query:', queryConf.str);
		// TODO create an aggregate wrapper
		return queryConf.body.map(build);
	}
	console.log('Running simple query', queryConf.str)
	const keenQuery = new KeenQuery(queryConf.eventName);
	keenQuery._printer = queryConf.print;

	return queryConf.functions.reduce((keenQuery, transform) => {
		return keenQuery[transform.func].apply(keenQuery, transform.params || []);
	}, keenQuery);
}


const logO = obj => {
	console.log(JSON.stringify(obj, null, '\t'));
}

logO(build('page:view->count(apples)->filter(\'pickle\')'))
logO(build('@ratio(page:view->count(apples),page:view->filter(\'pickle\'))->group(lobs)'))
logO(build('@ratio(page:view->count(apples),@concat(page:view->filter(\'pickle\'),page:view->filter(\'apple\')))->group(lobs)'))

logO(build('page:view->count(apples)->filter(\'pickle\')->print(ascii)		'));
logO(build('@ratio(page:view->count(apples),page:view->filter(\'pickle\'))->group(lobs)->print(ascii)		'));
logO(build('@ratio(page:view->count(apples),@concat(page:view->filter(\'pickle\'),page:view->filter(\'apple\')))->group(lobs)->print(ascii)		'));


module.exports = KeenQuery;
module.exports.build = build;
module.exports.execute = (str) => build(str).print();
