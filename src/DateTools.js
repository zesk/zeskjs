/**
 * Copyright &copy; 2017 Market Acumen, Inc.
 */
//const _ = require("lodash");
const Zesk = require("./Zesk");
const Locale = require("./Locale");

function zero(x) {
	if (x < 10) {
		return "0" + x;
	}
	return String(x);
}

var DateTools = {
	toString: function(d) {
		return (
			d.getUTCFullYear() +
			"-" +
			zero(d.getUTCMonth() + 1) +
			"-" +
			zero(d.getUTCDate()) +
			" " +
			zero(d.getUTCHours()) +
			":" +
			zero(d.getUTCMinutes()) +
			":" +
			zero(d.getUTCSeconds())
		);
	},
	MILLISECOND: "millisecond",
	SECOND: "second",
	MINUTE: "minute",
	HOUR: "hour",
	DAY: "day",
	WEEK: "week",
	MONTH: "month",
	QUARTER: "quarter",
	YEAR: "year",
};

const SECONDS_IN_MINUTE = 60;
const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;
const DAYS_PER_WEEK = 7;
const DAYS_IN_YEAR = 365;
const MONTHS_IN_YEAR = 12;
const QUARTERS_IN_YEAR = 4;

const SECONDS_IN_HOUR = SECONDS_IN_MINUTE * MINUTES_IN_HOUR;
const SECONDS_IN_DAY = SECONDS_IN_HOUR * HOURS_IN_DAY;
const SECONDS_IN_WEEK = SECONDS_IN_DAY * DAYS_PER_WEEK;
const SECONDS_IN_YEAR = SECONDS_IN_DAY * DAYS_IN_YEAR;

DateTools.units = {
	[DateTools.MILLISECOND]: 0.001,
	[DateTools.SECOND]: 1,
	[DateTools.MINUTE]: SECONDS_IN_MINUTE,
	[DateTools.HOUR]: SECONDS_IN_HOUR,
	[DateTools.DAY]: SECONDS_IN_DAY,
	[DateTools.WEEK]: SECONDS_IN_WEEK,
	[DateTools.YEAR]: SECONDS_IN_YEAR,
	[DateTools.MONTH]: SECONDS_IN_YEAR / MONTHS_IN_YEAR,
	[DateTools.QUARTER]: SECONDS_IN_YEAR / QUARTERS_IN_YEAR,
};

DateTools.findUnit = function(seconds) {
	var last = DateTools.MILLISECONDS;
	return Zesk.each(DateTools.units, (sec, unit) => {
		if (seconds < sec) {
			return last;
		}
		last = sec;
		return null;
	});
};

DateTools.toUnit = function(seconds, unit) {
	if (!DateTools.units[unit]) {
		throw new Error("Unknown unit " + unit + " in DateTools.toUnit");
	}
	return parseFloat(seconds) / DateTools.units[unit];
};

module.exports = DateTools;
