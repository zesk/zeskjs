/**
 * Copyright &copy; 2017 Market Acumen, Inc.
 */
let _ = require("lodash");
let Zesk = require("./Zesk");
let DateTools = require("./DateTools");

let datetimeclean = v => {
	if (_.isDate(v)) {
		return DateTools.toString(v);
	}
	return String(v);
};
let timeclean = v => {
	if (_.isDate(v)) {
		return DateTools.toString(v);
	}
	return String(v);
};
let floatclean = v => {
	return parseFloat(v) || null;
};
let intclean = v => {
	return parseInt(v, 10);
};
let stringclean = v => {
	return String(v);
};
let booltruths = ["t", "1", "true", "y", "yes", "on"];
let booleanclean = v => {
	return _.isString(v) ? (_.indexOf(booltruths, v.toLowerCase()) >= 0 ? true : false) : v ? true : false;
};

/**
 * Convert from internal representation to a string
 */
let serializers = {
	id: intclean,
	string: stringclean,
	text: stringclean,
	created: datetimeclean,
	modified: datetimeclean,
	timestamp: datetimeclean,
	date: datetimeclean,
	time: timeclean,
	integer: intclean,
	float: floatclean,
	decimal: floatclean,
	boolean: booleanclean,
	binary: stringclean,
	object: v => {
		if (_.isNumber(v)) {
			return parseInt(v, 10);
		}
		return String(v);
	},
};

let datetimefactory = function(v) {
	return v === null ? null : new Date(v);
};
let datefactory = datetimefactory;
let timefactory = datetimefactory;

/**
 * Convert from string to internal representation
 */
let unserializers = {
	id: Zesk.to_integer,
	string: Zesk.to_string,
	text: Zesk.to_string,
	created: datetimefactory,
	modified: datetimefactory,
	timestamp: datetimefactory,
	date: datefactory,
	time: timefactory,
	integer: Zesk.to_integer,
	float: Zesk.to_double,
	decimal: Zesk.to_double,
	boolean: Zesk.to_boolean,
	binary: Zesk.to_string,
	object: v => {
		return v;
	},
};

module.exports = {
	constants: {
		id: "id",
		string: "string",
		text: "text",
		created: "created",
		modified: "modified",
		timestamp: "timestamp",
		date: "date",
		time: "time",
		integer: "integer",
		float: "float",
		decimal: "decimal",
		boolean: "boolean",
		binary: "binary",
		object: "object",
		ip: "ip",
	},
	serializers: serializers,
	unserializers: unserializers,
};
