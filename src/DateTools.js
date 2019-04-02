/**
 * Copyright &copy; 2017 Market Acumen, Inc.
 */
//const _ = require("lodash");
const Zesk = require("./Zesk");

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
	WEEKDAY: "weekday",
	MONTH: "month",
	QUARTER: "quarter",
	YEAR: "year",

	formatting: function(d, localizer) {
		if (!localizer) {
			localizer = function(x) {
				return x;
			};
		}
		let h12 = d.getUTCHours() % 12;
		if (h12 === 0) {
			h12 = 12;
		}
		return {
			YYYY: d.getUTCFullYear(),
			M: d.getUTCMonth() + 1,
			MM: zero(d.getUTCMonth() + 1),
			MMM: localizer(DateTools.short_months[d.getUTCMonth()]),
			MMMM: localizer(DateTools.months[d.getUTCMonth()]),
			W: d.getUTCDay(),
			WWW: localizer(DateTools.short_weekdays[d.getUTCDay()]),
			WWWW: localizer(DateTools.weekdays[d.getUTCDay()]),
			D: d.getUTCDate(),
			DD: zero(d.getUTCDate()),
			h: d.getUTCHours(),
			hh: zero(d.getUTCHours()),
			"12h": h12,
			"12hh": zero(h12),
			m: d.getUTCMinutes(),
			mm: zero(d.getUTCMinutes()),
			s: d.getUTCSeconds(),
			ss: zero(d.getUTCSeconds()),
		};
	},
	format: function(d, format, localizer) {
		return Zesk.map(format, DateTools.formatting(d, localizer));
	},
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
DateTools.unitsOrder = [
	DateTools.MILLISECOND,
	DateTools.SECOND,
	DateTools.MINUTE,
	DateTools.HOUR,
	DateTools.DAY,
	DateTools.WEEK,
	DateTools.MONTH,
	DateTools.YEAR,
];

const subtract = function(source, timestamp) {
	return source.getTime() - timestamp.getTime();
};

const difference = function(source, timestamp, unit = DateTools.SECOND, precision = 0) {
	if (timestamp.getTime() > source.getTime()) {
		return -difference(timestamp, source, unit, precision);
	}
	if (unit === DateTools.WEEKDAY) {
		return source.getUTCDay() - timestamp.getUTCDay();
	}
	let delta = subtract(source, timestamp);
	delta *= 0.001;
	switch (unit) {
		case DateTools.MILLISECOND:
			return delta * 1000;
		case DateTools.SECOND:
			return delta;
		case DateTools.MINUTE:
			return Math.round(delta / 60.0, precision);
		case DateTools.HOUR:
			return Math.round(delta / 3600.0, precision);
		case DateTools.DAY:
			return Math.round(delta / 86400, precision);
		case DateTools.WEEK:
			return Math.round(delta / (86400 * 7), precision);
	}

	let mstart = timestamp.getUTCMonth(),
		ystart = timestamp.getUTCFullYear();

	let mend = source.getUTCMonth(),
		yend = source.getUTCFullYear();

	if (precision === 0) {
		switch (unit) {
			case DateTools.MONTH:
				return (yend - ystart) * 12 + (mend - mstart);
			case DateTools.QUARTER:
				mend = parseInt(mend / 4, 10);
				mstart = parseInt(mstart / 4, 10);
				return (yend - ystart) * 4 + (mend - mstart);
			case DateTools.YEAR:
				return yend - ystart;
			default:
				throw new Error("DateTools.difference(" + source + "," + timestamp + "," + unit + "): Bad unit");
		}
	} else {
		// Works like so:
		//
		// 2/22 -> 3/22 = 1 month
		// 2/12 -> 3/22 = 1 month + ((3/22-2/22) / 28)

		let intmon = (yend - ystart) * 12 + (mend - mstart);
		let total = DateTools.days_in_month(mstart, ystart);

		let temp = new Date();
		temp.setTime(timestamp.getTime());
		temp.setMonth(mstart);
		temp.setYear(ystart);

		let result = null,
			fract = subtract(temp, source);
		fract = fract / parseFloat(total * 86400);

		switch (unit) {
			case DateTools.MONTH:
				result = Math.round(intmon + fract, precision);

				break;
			case DateTools.QUARTER:
				result = Math.round((intmon + fract) / 3, precision);

				break;
			case DateTools.YEAR:
				result = Math.round((intmon + fract) / 12, precision);

				break;
			default:
				throw new Error("DateTools.difference(" + source + "," + timestamp + "," + unit + "): Bad unit");
		}
		return result;
	}
};
DateTools.difference = difference;

DateTools.findUnit = function(seconds) {
	let result = DateTools.YEAR;
	const units = DateTools.units;
	Zesk.each(DateTools.unitsOrder, function() {
		let sec = units[this];
		if (seconds < sec) {
			return true;
		}
		result = this;
	});
	return result;
};

DateTools.toUnit = function(seconds, unit) {
	if (!DateTools.units[unit]) {
		throw new Error("Unknown unit " + unit + " in DateTools.toUnit");
	}
	return parseFloat(seconds) / DateTools.units[unit];
};

const months = function() {
	let m = [],
		d = new Date();
	m.length = MONTHS_IN_YEAR;
	return m.fill(0).map(function(a, i) {
		d.setUTCDate(1);
		d.setUTCMonth(i);
		return d.toDateString().split(" ")[1];
	});
};

DateTools.months = DateTools.short_months = months();

const weekdays = function() {
	let m = [],
		d = new Date(),
		init;
	d.setUTCFullYear(2019);
	d.setUTCDate(19);
	d.setUTCMonth(3); // Sunday
	d.setUTCHours(0);

	d.setUTCSeconds(0);

	init = d.getTime();
	m.length = DAYS_PER_WEEK;
	return m.fill(0).map(function(a, i) {
		d.setTime(init + 86400 * 1000 * i);
		return d.toDateString().split(" ")[0];
	});
};
DateTools.weekdays = DateTools.short_weekdays = weekdays();

module.exports = DateTools;
