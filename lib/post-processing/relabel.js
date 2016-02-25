
module.exports.relabel = function (prop) {
	const newLabels = [].slice.call(arguments, 1);
	const dimension = this.getAxis(prop);
	if (dimension === -1) {
		throw new Error(`Attempting to do a custom sort on the property ${prop}, which doesn't exist`);
	}
	const originalValues = this.axes.find(a => a.property === prop).values;
	const newAxes = this.axes.slice();
	newAxes[dimension] = Object.assign({}, this.axes[dimension], {
		values: newLabels.concat(originalValues.slice(newLabels.length))
	});

	return this.clone({
		axes: newAxes
	});
}
