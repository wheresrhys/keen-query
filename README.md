# keen-query

Concise JavaScript API and cli for querying and performing advanced analysis on Keen data.

# Usage

## Running queries

### cli

`npm install -g Financial-Times/keen-query`

Make sure you have KEEN_READ_KEY and KEEN_PROJECT_ID env vars set

*Note: if you work in the next FT team you need n-keen-query (identical syntax to this component, but wrapped in some sensible default settings)*

- `kq 'page:dwell->count()->filter(!user.isStaff)'` will output an ASCII table of data
- `kq convert 'https://... some long Keen url'` can be used to convert existing queries to the format below
- `kq print 'https://... some long Keen url'` can be used to output ASCII tables given a Keen query url

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

Under the hood, keen-query converts the string queries into ones using the API, using `KeenQuery.build()`, which can be used to write your queries as strings, but consume within a JS application.

### Notes on syntax
- Values in the query strings are heavily type coerced, so quote marks are generally not necessary. The (largely untested) intention is however to be agnostic about quote marks, so if you have a value you don't want to be coerced, or that contains awkwards charcters that may break the query parsing (such as `(`), try adding quotes
- **If any bit of syntax seems unintuitive please raise it ASAP - would be good to get most things reasonably settled by the v2 release**

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

*Note: the intention is to replicate all Keen's available filters. Raise an issue if I missed any*

| Function | String | JS API |
| ------------- |-------------| -----|
| prop is equal to value | `->filter(prop=val)` | `kq.filter('prop=val')` |
| prop is not equal to value | `->filter(prop!=val)` | `kq.filter('prop!=val')` |
| prop is greater than value | `->filter(prop>val)` | `kq.filter('prop>val')` |
| prop is less than value | `->filter(prop<val)` | `kq.filter('prop<val')` |
| prop contains value | `->filter(prop~val)` | `kq.filter('prop~val')` |
| prop is equal to val1, val2 ... | `->filter(prop?val1,val2,val3)` | `kq.filter('prop?val1,val2,val3')` |
| prop is not equal to val1, val2 ... | `->filter(prop!?val1,val2,val3)` | `kq.filter('prop!?val1,val2,val3')` |
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
| Group fortnightly | `->interval(2_w)` | `kq.interval('2_w')` |
| Group data by value of page.type | `->group(page.type)` | `kq.group('page.type')` |
| Group data by multiple properties | `->group(page.type,user.isStaff)` | `kq.group('page.type', 'user.isStaff')` |
| Exclude null values | `->tidy()` | `kq.tidy()` |

Instead of shorthands, `minute`, `hour`, `day`, `week`, `month` or `year` can now also be used
### Selecting time range

By default data is returned for `this_14_days`

#### Relative time

| Function | String | JS API |
| ------------- |-------------| -----|
| This 6 days | `->relTime(6)` or `->relTime('this_6_days')` | `kq.relTime(6)` or `kq.relTime('this_6_days') |
| This 8 weeks | `->relTime(8_weeks)` or `->relTime('this_8_weeks')`| `kq.relTime('8_weeks')` or `kq.relTime('this_8_weeks') |
| Previous 3 hours | `->relTime(previous_3_hours)` | `kq.relTime('previous_3_hours') |

#### Absolute time
`start` and `end` should be ISO time strings (`Date` objects are also OK in the JS API). Support for other time formats is on the backlog!

| Function | String | JS API |
| ------------- |-------------| -----|
| From start to end times | `->absTime(start,end)` | `kq.absTime(start, end)` |


### Post processing data

A number of additional methods can be used to aggregate, reduce, or otherwise manipulate the results of a Keen query. They can be combined in all sorts of weird and wonderful ways (e.g. calculate a ratio of two tables, reduce to a single column, then concatenate with the original values) - be careful you're not generating nonsense data!

**Note on specifying dimensions:**
Some methods expect a dimension to be specified e.g to choose between taking an average across rows or columns. The value of dimension can be
 - `timeframe` or the name of a property that has been grouped by
 - a positive integer (0 indexed) to refer dirctly to a given dimension e.g in a table plotting count against time, a value of `1` would pick out the time dimension. Dimensions are added in the same order the methods creating them are called so e.g. `->interval(d)->group(uuid)` would have `timeframe` as the 0th dimension, `uuid` as the 1st;

#### Aggregators

These combine multiple keen-queries using a predefined rule. They follow the syntax `@agregatorName(comma separated list of queries)`. So far they are not available In the JS API, and include:

- `@ratio` - Given two queries returning results with identical structure, it returns a new table where the values are the result of dividing the value in the first table with its corresponding value in the second
- `@pct` - as above but expressed as a percentage
- `@sum` - Given two queries returning results with identical structure, it returns a new table where the values are the result of adding the value in the first table to its corresponding value in the second
- `@concat` - **TODO (please request)** Given n queries returning results with similar structure, it combines them into a single table by concatenating the columns of each table
- `@funnel` - **TODO**

Aggregations must be created using `KeenQuery.build()`, which returns an object with the same interface as a `KeenQuery` instance, so reductions can be performed on it.

#### Reductions

These allow values to be combined according to well known mathematical functions

| Function | String | JS API |
| ------------- |-------------| -----|
| Average of values | `->reduce(avg,timeframe)` | `kq.reduce('avg','timeframe')` |
| Minimum value | `->reduce(min,timeframe)` | `kq.reduce('min','timeframe')` |
| Maximum value | `->reduce(max,timeframe)` | `kq.reduce('max','timeframe')` |
| Median value | `->reduce(median,timeframe)` | `kq.reduce('median','timeframe')` |
| Trend (linear regression gradient) | `->reduce(trend,timeframe)` | `kq.reduce('trend','timeframe')` |
| Percent change - % up/down in last 2 values | `->reduce(%change,timeframe)` | `kq.reduce('%change','timeframe')` |

#### Other

- `->round(n)` Rounds values to n decimal places. if n is negative rounds to the nearest 10, 100, 1000 etc...
- `sort(dimension, value)` **TODO (please request)**
- `multiply(n)` Multiplies each value by `n`

### Outputting data

There are a few built in methods for outputting data

| Output | String | JS API |
| ------------- |-------------| -----|
| Returns the url(s) used to query Keen | `->print(url)` | `kq.print('url') |
| JSON representation of the query | `->print(qo)` | `kq.print('qo') |
| Stringified JSON representation of the query | `->print(qs)` | `kq.print('qs') |
| The raw JSON response(s) from Keen | `->print(raw)` | `kq.print('raw') |
| Normalised JSON of the response (a 2 dimensional matrix with headings) | `->print(json)` | `kq.print('json') |
| Prints out an ASCII table of the results | `->print(ascii)` | `kq.print('ascii') |

`KeenQuery.definePrinter(name, func)` can be used to define your own printers (e.g. to output a graph to the DOM). Within `func`, `this` will point at the current KeenQuery instance, and `this.getTable()` will give access to an object with the following properties and methods:

*Note: the intention is for these objects to be immutable. If you find an instance of a method that mutates the original table it's a bug -* **don't rely on the behaviour and please report**

- `data` - property holding all the data retrieved in an n-dimensional matrix constructed of arrays nested n deep
- `axes` - names and values for axes of the table
- `dimension` - property holding the number of dimensions of the table (i.e. by how many things is data grouped by)
- `size` - property holding an array representing the size of the table e.g. if grouped by `eye.colour` and `hair.colour` and there are 4 possible values for eye colour and 6 for hair colour it will return `[4, 6]`
- `getAxis (name)` - returns the dimension in which a given grouping is held, e.g. in the above example `getAxis('eye')` would return 0, `getAxis('hair')` would return 1
- `convertTime (format)` - converts all timeframe objects to the given format. Accepted values are
	- ISO - ISO strings
	- shortISO - ISO strings with unnecessary fine-grainedness removed
	- human - human readable strings representing the timeframe
	- shortest - shortest possible human readable strings containing enough information to identify the time range
- `humanize (timeFormat)` - converts the table (where possible) to an object of the following format

```
	{
  		headings: ['array', 'of', 'column', 'headings',
  		rows: [[], [], []] // rows of data, including row headings in the first position of each sub array
	}
```
- `cellIterator (func, endDepth)` - Iterates a function over each cell in the table *TODO - known bug. need to change to being immutable*
- `switchDimensions (a, b, method)` - switches two dimensions e.g. swaps rows for columns
   - a - index/name of the first dimension to move (default 0)
   - b - index/name of the second dimension to move (default: the deepest dimension of the table)
   - method - when a or b are their default values, setting method to `shuffle` will move the dimension to be the first/last, and shuffle all other dimesnions along to make room, as opposed to swapping the a/bth dimension with the first/last


the Keen data with all aggregations, reductions etc. already applied.



### Utilities

- KeenQuery.parseFilter(str) - converts a string compatible with the above syntax into a Keen filter object
- KeenQuery.forceQuery(func) - the function will be run as part of every query. Useful for e.g. excluding test data from results
- KeenQuery.defineQuery(name, func) - defines a method `name` which can be used as part of a keen-query string or in the JS API.
