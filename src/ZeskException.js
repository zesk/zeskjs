/**
 * Copyright &copy; 2017 Market Acumen, Inc.
 */
var format = require("string-format-obj");

class ZeskException {
	constructor(message, args) {
		this.message = message;
		this.arguments = typeof args === "object" ? args : {};
	}

	toString() {
		return "[" + this.constructor.name + " " + format(this.message, this.arguments) + "]";
	}
}

module.exports = ZeskException;
