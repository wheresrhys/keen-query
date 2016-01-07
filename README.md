# keen-query

Terse query language for keen, (inspired by cypher from neo4j and - blimey! - php)

*Important Note* - there are many edge cases this won't work for at all. The purpose of this module is not to cover everything, but to make the simplest queries easy to carry out.

## Usage

### cli

`npm install -g Financial-Times/keen-query`

Make sure you have KEEN_READ_KEY and KEEN_PROJECT_ID env vars set

Then something like `kq 'page:view->count()'` or `kq 'page:view->count()->print(url)'` to retrieve the actual keen urls used (it will always return 2 urls: the first for this period, the second for previous)

`kq convert 'https://... some long keen url'` can be used to convert existing queries to the format below

`kq print 'https://... some long keen url'` can be used to output ascii tables given a keen query url

### Queries

Queries are chainable and don't require any quote marks around values (values will be heavily type coerced)
- Must start with the name of an event
- Must end in `->print({output mode})` if ascii is not the desired output
- Must include an extraction type from the following
	- `->count()` counts all the events,
	- `->count(prop)` counts unique based on the given property
	- `->min(prop)`
	- `->max(prop)`
	- `->sum(prop)`
	- `->avg(prop)`
	- `->med(prop)`
	- `->pct(prop,pct)`
	- `->select(prop)` select unique
- `->group(prop)` groups results by the given property. If called twice, generates a cross table
- `->flip()` when group is called twice, or interval exists, switches which property forms the columns and which the rows
- `raw()` Extensions built on top of keen query may force evry query to include some functions e.g. `user.isStaff=false`. calling `raw()` will suppress these
- `->filter()` takes a number of shorthands for keen query filters
	- prop=val
	- prop!=val
	- prop>val
	- prop<val
	- prop~val (val is contained in prop)
	- prop?vals (prop is contained in comma separated list of vals)
	- prop (prop exists)
	- !prop (prop doesn't exist)
- `->relTime(period, interval)` e.g. relTime(6,h) = this 6 days, hourly interval, relTime(5_hours,m) = this 5 hours, minutely interval, relTime(22_months) = this 22 months as a single figure
- `->absTime(start, end, interval)` e.g. absTime(new Date(new Date() - 8640000), new Date()) = the last 24 hours as a single figure, absTime(new Date(new Date() - 8640000), new Date(), m) = the last 24 hours, minutely interval
- `->time(period, interval)` alias for relTime
- `->time(period, interval)` e.g time(6,h) = this 6 days, hourly interval, time(5_hours,m) = this 5 hours, minutely interval, time(22_months) = this 22 months as a single figure, time(prev_5_hours,m)
- `->prev()` Show the previous tiem interval

'>

### Aggregations

Queries can be aggregated by wrapping in the following syntax (assume q1, q2 etc are valid query strings).

When the aggregation accepts more than one query in its definition, to ensure all queries return identically structured data it's wise to configure interval, timeframe and grouping after aggregating the individual queries e.g. `@aggregate(q1,q2,q3)->interval(w)->group(meta.thing)` (where each of q1, q2, q3 only define collections and filters)

- `@ratio(q1!/q2)` - calculates the ratio between the values returned by two queries.
- `@comparePast(q)` - compares values with those from previous timeframe
- TODO `@concat(q1!..q2!..q3)` - puts the results of the queries side by side in a single table (accepts an unlimited number of queries)
- `@reduce(q,param)` - reduces values to a summary value. Vlues accepted as param are `avg`, `min`, `max`, `median` and `all` (which will return a table of the results of each reduction)
- TODO `@funnel(q1!..q2!..q3)` - calculates funnel conversion rates for the given queries

Complex analyses combining multiple queries are also possible (be warned - despite the queries happening in parallel this can be slow)

### Built in outputs (to be passed in to `->print()`)
- url - gets the urls used to query keen
- ascii - prints out an ascii table of the results
- qo - json representation of the query
- qs - stringified json representation of the query
- json - json o the results of the query


### JS API
Take the above queries, replace the `->` with `.` and put quote marks around any parameters and you have the javascript API.

Alternatively, use the strings above exactly as they are by using `require('keen-query').execute(queryString)`

#### Utilities

- KeenQuery.parseFilter(str) - converts a string compatible with the above syntax into a keen filter object
- KeenQuery.forceQuery(func) - the function will be run as part of every query. Useful for e.g. excluding test data from results
- KeenQuery.defineQuery(name, func) - defines a method `name` which can be used as part of a keen-query string or in the js api.

#### Adding additional outputs
// TODO
