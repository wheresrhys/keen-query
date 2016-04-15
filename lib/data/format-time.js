'use strict';

const days = 'Sun,Mon,Tue,Wed,Thu,Fri,Sat'.split(',');
const months = 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec'.split(',');

function humanDay (ISO) {
	return days[new Date(ISO).getDay()] + ' ' + new Date(ISO).getDate()
}

module.exports = function (timeframe, unit, timeFormat) {
	if (timeFormat === 'shortISO') {
		switch (unit) {
			case 'minute' :
				return timeframe.start.split('T')[1].slice(0, 8);
			case 'hour' :
				return timeframe.start.split('T')[1].split(0, 8);
			case 'day' :
				return timeframe.start.split('T')[0];
			case 'week' :
				return `${timeframe.start.split('T')[0]} - ${timeframe.end.split('T')[0]}`;
			case 'month' :
				return `${timeframe.start.split('T')[0]} - ${timeframe.end.split('T')[0]}`;
			case 'year' :
				return new Date(timeframe.start).getFullYear();
			default :
				return timeframe.start;
		}
	} else if (timeFormat === 'ISO') {
		throw new Error('TODO - not done ISO string sproperly yet');
		switch (unit) {
			case 'minute' :
				return timeframe.start.split('T')[1].slice(0, 8);
			case 'hour' :
				return timeframe.start.split('T')[1].split(0, 8);
			case 'day' :
				return timeframe.start.split('T')[0];
			case 'week' :
				return `${timeframe.start.split('T')[0]} - ${timeframe.end.split('T')[0]}`;
			case 'month' :
				return `${timeframe.start.split('T')[0]} - ${timeframe.end.split('T')[0]}`;
			case 'year' :
				return new Date(timeframe.start).getFullYear();
			default :
				return timeframe.start;
		}
	} else if (timeFormat === 'human') {

		switch (unit) {
			case 'minute' :
				return timeframe.start.split('T')[1].slice(0, 8);
			case 'hour' :
				return timeframe.start.split('T')[1].split(0, 8);
			case 'day' :
				return humanDay(timeframe.start);
			case 'week' :
				return `${humanDay(timeframe.start)} - ${humanDay(timeframe.end)}`;
			case 'month' :
				return months[new Date(timeframe.start).getMonth()];
			case 'year' :
				return new Date(timeframe.start).getFullYear();
			default :
				return timeframe.start;
		}
	} else if (timeFormat === 'shortest') {

		switch (unit) {
			case 'minute' :
				return timeframe.start.split('T')[1].slice(3, 5);
			case 'hour' :
				return timeframe.start.split('T')[1].split(0, 2);
			case 'day' :
				return `${new Date(timeframe.start).getDate()}/${new Date(timeframe.start).getMonth() + 1}`
			case 'week' :
				return `${new Date(timeframe.start).getDate()}/${new Date(timeframe.start).getMonth() + 1} - ${new Date(timeframe.end).getDate()}/${new Date(timeframe.end).getMonth() + 1}`;
			case 'month' :
				return months[new Date(timeframe.start).getMonth()];
			case 'year' :
				return new Date(timeframe.start).getFullYear();
			default :
				return timeframe.start;
		}
	} else if (timeFormat === 'dateObject') {
		return new Date(timeframe.start);
	}
	return timeframe;

}
