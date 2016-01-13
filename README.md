# keen-query

Concise javascript API and cli for querying and performing advanced analysis on keen data.

# Usage

## Running queries

### cli

`npm install -g Financial-Times/keen-query`

Make sure you have KEEN_READ_KEY and KEEN_PROJECT_ID env vars set

* Note - if you work in the next FT team you need n-keen-query (identical syntax to this component, but wrapped in some sensible default settings) *

- `kq 'page:dwell->count()->filter(!user.isStaff)'` will output an ascii table of data
- `kq convert 'https://... some long keen url'` can be used to convert existing queries to the format below
- `kq print 'https://... some long keen url'` can be used to output ascii tables given a keen query url

## Writing queries

Queries can be built in two main ways
- a string such as `page:dwell->count()->filter(!user.isStaff)->group(page.location.type).relTime(this_12_days)->interval(d)`.
- Equivalently, the JavaScript API can be used directly
```
	new KeenQuery('page:dwell')
		.count()
		.filter('!user.isStaff')
		.group('page.location.type')
		.relTime('this_12_days')
		.interval('d')
```

Under the hood, keen-query converts the string queries into ones using the API, using `KeenQuery.build()`, which can be used to write your queries as strings, but consume within a js application.

### Notes on syntax
- Values in the query strings are heavily type coerced, so quote marks are generally not necessary. The (largely untested) intention is however to be agnostic about quote marks, so if you have a value you don't want to be coerced, or that contains awkwards charcters that may break the query parsing (such as `(`), try adding quotes
- **If any bit of syntax seems unintuitve please raise it ASAP - would be good to get most things reasonably settled by the v2 release**

### Setting up the data extraction

First choose your event type

| String | JS API |
|-------------| -----|
| Begin string with `page:dwell` | const kq = `new KeenQuery('page:dwell')`|

...then one of the following

| Function | String | JS API |
| ------------- |-------------| -----|
| Count all events | `->count()` | `kq.count()` |
| Count unique values| `->count(user.uuid)` | `kq.count('user.uuid')` |
| Minimum value of prop |	`->min(session.length)` | `kq.min('session.length')`|
| Maximum value of prop |	`->max(session.length)` | `kq.max('session.length')`|
| Sum values of prop |	`->sum(session.length)` | `kq.sum('session.length')`|
| Average value of prop |	`->avg(session.length)` | `kq.avg('session.length')`|
| Median value of prop |	`->med(session.length)` | `kq.med('session.length')`|
| n-th (e.g. 90th) percentile value of prop |`->pct(session.length,90)` | `kq.pct('session.length', 90)`|
| Select unique values for prop |	`->select(user.uuid)` | `kq.select('user.uuid')`|

Then any of the below can be applied in any order (though it's advisable to put any time functions last as these will be the ones you'll most likely want to tweak later)

### Filtering data

Filter can be called as many times as you like

*Note: the intention is to replicate all keen's available filters. Raise an issue if I missed any*

| Function | String | JS API |
| ------------- |-------------| -----|
| prop is equal to value | `->filter(prop=val)` | `kq.filter('prop=val')` |
| prop is not equal to value | `->filter(prop!=val)` | `kq.filter('prop!=val')` |
| prop is greater than value | `->filter(prop>val)` | `kq.filter('prop>val')` |
| prop is less than value | `->filter(prop<val)` | `kq.filter('prop<val')` |
| prop contains value | `->filter(prop~val)` | `kq.filter('prop~val')` |
| prop is equal to val1, val2 ... | `->filter(prop?val1,val2,val3)` | `kq.filter('prop?val1,val2,val3')` |
| prop is equal to value | `->filter(prop=val)` | `kq.filter('prop=val')` |
| prop exists | `->filter(prop)` | `kq.filter('prop')` |
| prop doesn't exist | `->filter(!prop)` | `kq.filter('!prop')` |


### Grouping data by property or time period

Data can be grouped by as many properties as required, as well as by time intervals. For the purposes of outputting as tables/graphs grouping by no more than two things is advisable

| Function | String | JS API |
| ------------- |-------------| -----|
| Group data per minute | `->interval(m)` | `kq.interval('m')` |
| Group data per hour | `->interval(h)` | `kq.interval('h')` |
| Group data per day | `->interval(d)` | `kq.interval('d')` |
| Group data per week | `->interval(w)` | `kq.interval('w')` |
| Group data per month | `->interval(mo)` | `kq.interval('mo')` |
| Group data per year | `->interval(y)` | `kq.interval('y')` |
| Group data by value of page.type | `->group(page.type)` | `kq.group('page.type')` |
| Group data by multiple properties | `->group(page.type,user.isStaff)` | `kq.group('page.type', 'user.isStaff')` |

### Selecting time range

By default data is returned for `this_14_days`

#### Relative time

| Function | String | JS API |
| ------------- |-------------| -----|
| This 6 days | `->relTime(6)` or `->relTime('this_6_days')` | `kq.relTime(6)` or `kq.relTime('this_6_days') |
| This 8 weeks | `->relTime(8_weeks)` or `->relTime('this_8_weeks')`| `kq.relTime('8_weeks')` or `kq.relTime('this_8_weeks') |
| Previous 3 hours | `->relTime(previous_3_hours)` | `kq.relTime('previous_3_hours') |

#### Absolute time
`start` and `end` should be ISO time strings (`Date` objects are also OK in the js API). Support for other time formats is on the backlog!

| Function | String | JS API |
| ------------- |-------------| -----|
| From start to end times | `->absTime(start,end)` | `kq.absTime(start, end)` |



// TODO - rewrite all the below

### Selecting output type

- Must end in `->print({output mode})` if ascii is not the desired output

Built in outputs:

- url - gets the urls used to query keen
- ascii - prints out an ascii table of the results
- qo - json representation of the query
- qs - stringified json representation of the query
- raw - the raw json response
- json - Normalised json of the response (a 2 dimensional matrix with headings)

use `.definePrinter(name, func)` to define your own printers, which will be pased the raw json data. printers are called with `this` referencing the current KeenQuery object. `this.tabulate(data)` will convert the raw json to a normalised table


### Aggregations

Queries can be aggregated by wrapping in the following syntax (assume q1, q2 etc are valid query strings).

When the aggregation accepts more than one query in its definition, to ensure all queries return identically structured data it's wise to configure interval, timeframe and grouping after aggregating the individual queries e.g. `@aggregate(q1,q2,q3)->interval(w)->group(meta.thing)` (where each of q1, q2, q3 only define collections and filters)

- `@ratio(q1!/q2)` - calculates the ratio between the values returned by two queries.
- `@comparePast(q)` - compares values with those from previous timeframe
- TODO `@concat(q1!..q2!..q3)` - puts the results of the queries side by side in a single table (accepts an unlimited number of queries)
- `@reduce(q,param)` - reduces values to a summary value. Vlues accepted as param are `avg`, `min`, `max`, `median` and `all` (which will return a table of the results of each reduction). note - this is different to just using the single query equivalents as they allow e.g. getting the average of daily totals rather than an average of individual values
- TODO `@funnel(q1!..q2!..q3)` - calculates funnel conversion rates for the given queries

Complex analyses combining multiple queries are also possible (be warned - despite the queries happening in parallel this can be slow)


### JS API
Take the above queries, replace the `->` with `.` and put quote marks around any parameters and you have the javascript API.

Alternatively, use the strings above exactly as they are by using `require('keen-query').execute(queryString)` (or `require('keen-query').build(queryString)` to build the query object without executing immediately (run `.print()` to execute))

#### Utilities

- KeenQuery.parseFilter(str) - converts a string compatible with the above syntax into a keen filter object
- KeenQuery.forceQuery(func) - the function will be run as part of every query. Useful for e.g. excluding test data from results
- KeenQuery.defineQuery(name, func) - defines a method `name` which can be used as part of a keen-query string or in the js api.

#### Adding additional outputs
// TODO
