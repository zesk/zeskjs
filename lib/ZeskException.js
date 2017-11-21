"use strict";

var _typeof =
	typeof Symbol === "function" && typeof Symbol.iterator === "symbol"
		? function(obj) {
				return typeof obj;
			}
		: function(obj) {
				return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype
					? "symbol"
					: typeof obj;
			};

var _createClass = (function() {
	function defineProperties(target, props) {
		for (var i = 0; i < props.length; i++) {
			var descriptor = props[i];
			descriptor.enumerable = descriptor.enumerable || false;
			descriptor.configurable = true;
			if ("value" in descriptor) descriptor.writable = true;
			Object.defineProperty(target, descriptor.key, descriptor);
		}
	}
	return function(Constructor, protoProps, staticProps) {
		if (protoProps) defineProperties(Constructor.prototype, protoProps);
		if (staticProps) defineProperties(Constructor, staticProps);
		return Constructor;
	};
})();

function _classCallCheck(instance, Constructor) {
	if (!(instance instanceof Constructor)) {
		throw new TypeError("Cannot call a class as a function");
	}
}

/*
 * $Id$
 *
 * Copyright (C) 2017 Market Acumen, Inc. All rights reserved
 */
var format = require("string-format-obj");

var ZeskException = (function() {
	function ZeskException(message, args) {
		_classCallCheck(this, ZeskException);

		this.message = message;
		this.arguments = (typeof args === "undefined" ? "undefined" : _typeof(args)) === "object" ? args : {};
	}

	_createClass(ZeskException, [
		{
			key: "toString",
			value: function toString() {
				return "[" + this.constructor.name + " " + format(this.message, this.arguments) + "]";
			},
		},
	]);

	return ZeskException;
})();

module.exports = ZeskException;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9aZXNrRXhjZXB0aW9uLmpzIl0sIm5hbWVzIjpbImZvcm1hdCIsInJlcXVpcmUiLCJaZXNrRXhjZXB0aW9uIiwibWVzc2FnZSIsImFyZ3MiLCJhcmd1bWVudHMiLCJjb25zdHJ1Y3RvciIsIm5hbWUiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBOzs7OztBQUtBLElBQUlBLFNBQVVDLFFBQVEsbUJBQVIsQ0FBZDs7SUFFTUMsYTtBQUNMLHdCQUFZQyxPQUFaLEVBQXFCQyxJQUFyQixFQUEyQjtBQUFBOztBQUMxQixPQUFLRCxPQUFMLEdBQWVBLE9BQWY7QUFDQSxPQUFLRSxTQUFMLEdBQWlCLFFBQU9ELElBQVAseUNBQU9BLElBQVAsT0FBaUIsUUFBakIsR0FBNEJBLElBQTVCLEdBQW1DLEVBQXBEO0FBQ0E7Ozs7NkJBRVU7QUFDVixVQUFPLE1BQU0sS0FBS0UsV0FBTCxDQUFpQkMsSUFBdkIsR0FBOEIsR0FBOUIsR0FBb0NQLE9BQU8sS0FBS0csT0FBWixFQUFxQixLQUFLRSxTQUExQixDQUFwQyxHQUEyRSxHQUFsRjtBQUNBOzs7Ozs7QUFHRkcsT0FBT0MsT0FBUCxHQUFpQlAsYUFBakIiLCJmaWxlIjoiWmVza0V4Y2VwdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiAkSWQkXG4gKlxuICogQ29weXJpZ2h0IChDKSAyMDE3IE1hcmtldCBBY3VtZW4sIEluYy4gQWxsIHJpZ2h0cyByZXNlcnZlZFxuICovXG52YXIgZm9ybWF0XHRcdD0gcmVxdWlyZSgnc3RyaW5nLWZvcm1hdC1vYmonKTtcblxuY2xhc3MgWmVza0V4Y2VwdGlvbiB7XG5cdGNvbnN0cnVjdG9yKG1lc3NhZ2UsIGFyZ3MpIHtcblx0XHR0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuXHRcdHRoaXMuYXJndW1lbnRzID0gdHlwZW9mKGFyZ3MpID09PSBcIm9iamVjdFwiID8gYXJncyA6IHt9O1xuXHR9XG5cdFxuXHR0b1N0cmluZygpIHtcblx0XHRyZXR1cm4gJ1snICsgdGhpcy5jb25zdHJ1Y3Rvci5uYW1lICsgJyAnICsgZm9ybWF0KHRoaXMubWVzc2FnZSwgdGhpcy5hcmd1bWVudHMpICsgJ10nO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gWmVza0V4Y2VwdGlvbjsiXX0=
