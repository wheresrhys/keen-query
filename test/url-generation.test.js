'use strict';

const KeenQuery = require('../lib');
KeenQuery.setConfig({
	KEEN_PROJECT_ID: 'test_proj',
	KEEN_READ_KEY: 'test_key'
});
const expect = require('chai').expect;

const queryUrlMappings = {
	extractionTypes: {
		'tomato:bread->count()': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_14_days',
		'tomato:bread->count(thing)': 'https://api.keen.io/3.0/projects/test_proj/queries/count_unique?api_key=test_key&event_collection=tomato%3Abread&target_property=thing&timeframe=this_14_days',
		'tomato:bread->avg(thing)': 'https://api.keen.io/3.0/projects/test_proj/queries/average?api_key=test_key&event_collection=tomato%3Abread&target_property=thing&timeframe=this_14_days',
		'tomato:bread->median(thing)': 'https://api.keen.io/3.0/projects/test_proj/queries/median?api_key=test_key&event_collection=tomato%3Abread&target_property=thing&timeframe=this_14_days',
		'tomato:bread->sum(thing)': 'https://api.keen.io/3.0/projects/test_proj/queries/sum?api_key=test_key&event_collection=tomato%3Abread&target_property=thing&timeframe=this_14_days',
		'tomato:bread->min(thing)': 'https://api.keen.io/3.0/projects/test_proj/queries/minimum?api_key=test_key&event_collection=tomato%3Abread&target_property=thing&timeframe=this_14_days',
		'tomato:bread->max(thing)': 'https://api.keen.io/3.0/projects/test_proj/queries/maximum?api_key=test_key&event_collection=tomato%3Abread&target_property=thing&timeframe=this_14_days',
		'tomato:bread->percentile(thing,20)': 'https://api.keen.io/3.0/projects/test_proj/queries/percentile?api_key=test_key&event_collection=tomato%3Abread&target_property=thing&percentile=20&timeframe=this_14_days'
	},
	filters: {
		'tomato:bread->count()->filter(prop=true)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_14_days&filters=%5B%7B%22property_name%22%3A%22prop%22%2C%22operator%22%3A%22eq%22%2C%22property_value%22%3Atrue%7D%5D',
		'tomato:bread->count()->filter(prop=null)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_14_days&filters=%5B%7B%22property_name%22%3A%22prop%22%2C%22operator%22%3A%22eq%22%2C%22property_value%22%3Anull%7D%5D',
		'tomato:bread->count()->filter(prop!=false)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_14_days&filters=%5B%7B%22property_name%22%3A%22prop%22%2C%22operator%22%3A%22ne%22%2C%22property_value%22%3Afalse%7D%5D',
		'tomato:bread->count()->filter(prop>1)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_14_days&filters=%5B%7B%22property_name%22%3A%22prop%22%2C%22operator%22%3A%22gt%22%2C%22property_value%22%3A1%7D%5D',
		'tomato:bread->count()->filter(prop<2)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_14_days&filters=%5B%7B%22property_name%22%3A%22prop%22%2C%22operator%22%3A%22lt%22%2C%22property_value%22%3A2%7D%5D',
		'tomato:bread->count()->filter(prop~val)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_14_days&filters=%5B%7B%22property_name%22%3A%22prop%22%2C%22operator%22%3A%22contains%22%2C%22property_value%22%3A%22val%22%7D%5D',
		'tomato:bread->count()->filter(prop!~val)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_14_days&filters=%5B%7B%22property_name%22%3A%22prop%22%2C%22operator%22%3A%22not_contains%22%2C%22property_value%22%3A%22val%22%7D%5D',
		'tomato:bread->count()->filter(prop?val1,val2)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_14_days&filters=%5B%7B%22property_name%22%3A%22prop%22%2C%22operator%22%3A%22in%22%2C%22property_value%22%3A%5B%22val1%22%2C%22val2%22%5D%7D%5D',
		'tomato:bread->count()->filter(prop!?val1,val2)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_14_days&filters=%5B%7B%22property_name%22%3A%22prop%22%2C%22operator%22%3A%22ne%22%2C%22property_value%22%3A%22val1%22%7D%2C%7B%22property_name%22%3A%22prop%22%2C%22operator%22%3A%22ne%22%2C%22property_value%22%3A%22val2%22%7D%5D',
		'tomato:bread->count()->filter(prop)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_14_days&filters=%5B%7B%22property_name%22%3A%22prop%22%2C%22operator%22%3A%22exists%22%2C%22property_value%22%3Atrue%7D%5D',
		'tomato:bread->count()->filter(!prop)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_14_days&filters=%5B%7B%22property_name%22%3A%22prop%22%2C%22operator%22%3A%22exists%22%2C%22property_value%22%3Afalse%7D%5D',
		'tomato:bread->count()->filter(prop1=val1)->filter(prop2!=val2)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_14_days&filters=%5B%7B%22property_name%22%3A%22prop1%22%2C%22operator%22%3A%22eq%22%2C%22property_value%22%3A%22val1%22%7D%2C%7B%22property_name%22%3A%22prop2%22%2C%22operator%22%3A%22ne%22%2C%22property_value%22%3A%22val2%22%7D%5D',
	},
	grouping: {
		'tomato:bread->count()->group(prop)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_14_days&group_by=prop',
		'tomato:bread->count()->group(prop1,prop2)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_14_days&group_by=%5B%22prop1%22%2C%22prop2%22%5D',
		'tomato:bread->count()->group(prop1,prop2)->tidy()': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_14_days&group_by=%5B%22prop1%22%2C%22prop2%22%5D&filters=%5B%7B%22property_name%22%3A%22prop1%22%2C%22operator%22%3A%22exists%22%2C%22property_value%22%3Atrue%7D%2C%7B%22property_name%22%3A%22prop2%22%2C%22operator%22%3A%22exists%22%2C%22property_value%22%3Atrue%7D%5D',
	},
	intervals: {
		'tomato:bread->count()->interval(m)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&interval=minutely&timeframe=this_14_days',
		'tomato:bread->count()->interval(h)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&interval=hourly&timeframe=this_14_days',
		'tomato:bread->count()->interval(d)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&interval=daily&timeframe=this_14_days',
		'tomato:bread->count()->interval(w)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&interval=weekly&timeframe=this_14_days',
		'tomato:bread->count()->interval(mo)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&interval=monthly&timeframe=this_14_days',
		'tomato:bread->count()->interval(y)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&interval=yearly&timeframe=this_14_days',
		'tomato:bread->count()->interval(2_w)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&interval=every_2_weeks&timeframe=this_14_days',
		'skip.tomato:bread->count()->interval(2w)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&interval=every_2_weeks&timeframe=this_14_days',
	},
	timeframe: {
		'tomato:bread->count()': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_14_days',
		'skip.tomato:bread->count()->relTime(6m)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_6_minutes',
		'tomato:bread->count()->relTime(6_minutes)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_6_minutes',
		'skip.tomato:bread->count()->relTime(6h)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_6_hours',
		'tomato:bread->count()->relTime(6_hours)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_6_hours',
		'skip.tomato:bread->count()->relTime(6d)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_6_days',
		'tomato:bread->count()->relTime(6_days)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_6_days',
		'skip.tomato:bread->count()->relTime(6w)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_6_weeks',
		'tomato:bread->count()->relTime(6_weeks)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_6_weeks',
		'skip.tomato:bread->count()->relTime(6mo)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_6_months',
		'tomato:bread->count()->relTime(6_months)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_6_months',
		'skip.tomato:bread->count()->relTime(6y)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_6_years',
		'tomato:bread->count()->relTime(6_years)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_6_years',
		'tomato:bread->count()->relTime(6)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_6_days',
		'tomato:bread->count()->relTime(this_6_days)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_6_days',
		'tomato:bread->count()->relTime(8_weeks)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_8_weeks',
		'tomato:bread->count()->relTime(this_8_weeks)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_8_weeks',
		'tomato:bread->count()->relTime(previous_3_hours)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=previous_3_hours',
		'tomato:bread->count()->absTime(2015-3-12,2016-8-4)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe={"start":"2015-3-12","end":"2016-8-4"}',
		'tomato:bread->count()->relTime(6)->absTime(2015-3-12,2016-8-4)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe={"start":"2015-3-12","end":"2016-8-4"}',
	},
	complex: {
		'tomato:bread->count()->relTime(previous_3_hours)->group(prop1,prop2)->tidy()->filter(!prop3)->interval(w)': 'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&interval=weekly&timeframe=previous_3_hours&group_by=%5B%22prop1%22%2C%22prop2%22%5D&filters=%5B%7B%22property_name%22%3A%22prop3%22%2C%22operator%22%3A%22exists%22%2C%22property_value%22%3Afalse%7D%2C%7B%22property_name%22%3A%22prop1%22%2C%22operator%22%3A%22exists%22%2C%22property_value%22%3Atrue%7D%2C%7B%22property_name%22%3A%22prop2%22%2C%22operator%22%3A%22exists%22%2C%22property_value%22%3Atrue%7D%5D'
	},
	aggregators: {
		// just a dirty test for extra whitespace resilience. Eventually tests for this will go into parser.test.js
		'		@ratio     (tomato:bread ->count    (), hat:potato->avg(prop)    )    ': [
			'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_14_days',
			'https://api.keen.io/3.0/projects/test_proj/queries/average?api_key=test_key&event_collection=hat%3Apotato&target_property=prop&timeframe=this_14_days'
		],
		'@pct(tomato:bread->count(),hat:potato->avg(prop))': [
			'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_14_days',
			'https://api.keen.io/3.0/projects/test_proj/queries/average?api_key=test_key&event_collection=hat%3Apotato&target_property=prop&timeframe=this_14_days'
		],
		'@sum(tomato:bread->count(),hat:potato->avg(prop))': [
			'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_14_days',
			'https://api.keen.io/3.0/projects/test_proj/queries/average?api_key=test_key&event_collection=hat%3Apotato&target_property=prop&timeframe=this_14_days'
		],
		'skip.@subtract(tomato:bread->count(),hat:potato->avg(prop))': '',
		'skip.@divide(tomato:bread->count(),hat:potato->avg(prop))': '',
		'@concat(tomato:bread->count(),hat:potato->avg(prop))': [
			'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&timeframe=this_14_days',
			'https://api.keen.io/3.0/projects/test_proj/queries/average?api_key=test_key&event_collection=hat%3Apotato&target_property=prop&timeframe=this_14_days'
		],
		'@concat(tomato:bread->count()->filter(egg)->interval(d),hat:potato->avg(prop)->filter(jam)->relTime(3)->group(trousers))': [
			'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&interval=daily&timeframe=this_14_days&filters=%5B%7B%22property_name%22%3A%22egg%22%2C%22operator%22%3A%22exists%22%2C%22property_value%22%3Atrue%7D%5D',
			'https://api.keen.io/3.0/projects/test_proj/queries/average?api_key=test_key&event_collection=hat%3Apotato&target_property=prop&timeframe=this_3_days&group_by=trousers&filters=%5B%7B%22property_name%22%3A%22jam%22%2C%22operator%22%3A%22exists%22%2C%22property_value%22%3Atrue%7D%5D'
		],
		'@concat(tomato:bread->count()->filter(egg)->relTime(5),hat:potato->avg(prop)->filter(jam))->interval(w)->relTime(9)->filter(brisket)': [
			'https://api.keen.io/3.0/projects/test_proj/queries/count?api_key=test_key&event_collection=tomato%3Abread&interval=weekly&timeframe=this_9_days&filters=%5B%7B%22property_name%22%3A%22egg%22%2C%22operator%22%3A%22exists%22%2C%22property_value%22%3Atrue%7D%2C%7B%22property_name%22%3A%22brisket%22%2C%22operator%22%3A%22exists%22%2C%22property_value%22%3Atrue%7D%5D',
			'https://api.keen.io/3.0/projects/test_proj/queries/average?api_key=test_key&event_collection=hat%3Apotato&target_property=prop&interval=weekly&timeframe=this_9_days&filters=%5B%7B%22property_name%22%3A%22jam%22%2C%22operator%22%3A%22exists%22%2C%22property_value%22%3Atrue%7D%2C%7B%22property_name%22%3A%22brisket%22%2C%22operator%22%3A%22exists%22%2C%22property_value%22%3Atrue%7D%5D'
		]
	},
	funnels: {
		'@funnel(tomato:bread->count(prop),hat:potato->avg(prop))->with(prop2)': 'https://api.keen.io/3.0/projects/test_proj/queries/funnel?api_key=test_key&steps=%5B%7B%22event_collection%22%3A%22tomato%3Abread%22%2C%22target_property%22%3A%22prop%22%2C%22actor_property%22%3A%22prop2%22%2C%22timeframe%22%3A%22this_14_days%22%7D%2C%7B%22event_collection%22%3A%22hat%3Apotato%22%2C%22target_property%22%3A%22prop%22%2C%22actor_property%22%3A%22prop2%22%2C%22timeframe%22%3A%22this_14_days%22%7D%5D',
		'@funnel(tomato:bread->with(prop1),hat:potato->with(prop2))': 'https://api.keen.io/3.0/projects/test_proj/queries/funnel?api_key=test_key&steps=%5B%7B%22event_collection%22%3A%22tomato%3Abread%22%2C%22actor_property%22%3A%22prop1%22%2C%22timeframe%22%3A%22this_14_days%22%7D%2C%7B%22event_collection%22%3A%22hat%3Apotato%22%2C%22actor_property%22%3A%22prop2%22%2C%22timeframe%22%3A%22this_14_days%22%7D%5D',
		'@funnel(tomato:bread,hat:potato)->with(prop)': 'https://api.keen.io/3.0/projects/test_proj/queries/funnel?api_key=test_key&steps=%5B%7B%22event_collection%22%3A%22tomato%3Abread%22%2C%22actor_property%22%3A%22prop%22%2C%22timeframe%22%3A%22this_14_days%22%7D%2C%7B%22event_collection%22%3A%22hat%3Apotato%22%2C%22actor_property%22%3A%22prop%22%2C%22timeframe%22%3A%22this_14_days%22%7D%5D',
		'@funnel(tomato:bread->filter(goat),hat:potato->filter(snow))->with(prop)': 'https://api.keen.io/3.0/projects/test_proj/queries/funnel?api_key=test_key&steps=%5B%7B%22event_collection%22%3A%22tomato%3Abread%22%2C%22actor_property%22%3A%22prop%22%2C%22timeframe%22%3A%22this_14_days%22%2C%22filters%22%3A%5B%7B%22property_name%22%3A%22goat%22%2C%22operator%22%3A%22exists%22%2C%22property_value%22%3Atrue%7D%5D%7D%2C%7B%22event_collection%22%3A%22hat%3Apotato%22%2C%22actor_property%22%3A%22prop%22%2C%22timeframe%22%3A%22this_14_days%22%2C%22filters%22%3A%5B%7B%22property_name%22%3A%22snow%22%2C%22operator%22%3A%22exists%22%2C%22property_value%22%3Atrue%7D%5D%7D%5D',
	}
};


describe('Generation of keen urls from keen query strings', () => {
	Object.keys(queryUrlMappings).forEach(category => {
		const queries = queryUrlMappings[category];
		describe(category, () => {
			Object.keys(queries).forEach(kq => {
				let func = it;
				if (kq.indexOf('skip.') === 0) {
					func = it.skip;
					kq = kq.replace('skip.', '')
				}
				func(`Should construct api url(s) correctly for ${kq}`, () => {
					return KeenQuery.build(kq).print('url')
						.then(url => {
							if (Array.isArray(url)) {
								expect(url).to.deep.equal(queries[kq]);
							} else {
								expect(url).to.equal(queries[kq]);
							}
						});
				});
			});
		})
	})
})
