'use strict';

function detectTableGaps (table1, table2) {
	return table2.axes.some((a, i) => {
		return table1.axes[i].values.map(v => v.toString).join('|') !== a.values.map(v => v.toString).join('|');
	});
}

module.exports = function(table2, table1) {
	return detectTableGaps(table1, table2) || detectTableGaps(table2, table1)
};
