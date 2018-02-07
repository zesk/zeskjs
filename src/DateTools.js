/**
 * Copyright &copy; 2017 Market Acumen, Inc.
 */
//const _ = require("lodash");
//const Zesk = require("./Zesk");

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
};

module.exports = DateTools;
