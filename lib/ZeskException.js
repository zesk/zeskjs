"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Copyright &copy; 2017 Market Acumen, Inc.
 */
var format = require("string-format-obj");

var ZeskException = function () {
	function ZeskException(message, args) {
		_classCallCheck(this, ZeskException);

		this.message = message;
		this.arguments = (typeof args === "undefined" ? "undefined" : _typeof(args)) === "object" ? args : {};
	}

	_createClass(ZeskException, [{
		key: "toString",
		value: function toString() {
			return "[" + this.constructor.name + " " + format(this.message, this.arguments) + "]";
		}
	}]);

	return ZeskException;
}();

module.exports = ZeskException;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9aZXNrRXhjZXB0aW9uLmpzIl0sIm5hbWVzIjpbImZvcm1hdCIsInJlcXVpcmUiLCJaZXNrRXhjZXB0aW9uIiwibWVzc2FnZSIsImFyZ3MiLCJhcmd1bWVudHMiLCJjb25zdHJ1Y3RvciIsIm5hbWUiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBOzs7QUFHQSxJQUFJQSxTQUFTQyxRQUFRLG1CQUFSLENBQWI7O0lBRU1DLGE7QUFDTCx3QkFBWUMsT0FBWixFQUFxQkMsSUFBckIsRUFBMkI7QUFBQTs7QUFDMUIsT0FBS0QsT0FBTCxHQUFlQSxPQUFmO0FBQ0EsT0FBS0UsU0FBTCxHQUFpQixRQUFPRCxJQUFQLHlDQUFPQSxJQUFQLE9BQWdCLFFBQWhCLEdBQTJCQSxJQUEzQixHQUFrQyxFQUFuRDtBQUNBOzs7OzZCQUVVO0FBQ1YsVUFBTyxNQUFNLEtBQUtFLFdBQUwsQ0FBaUJDLElBQXZCLEdBQThCLEdBQTlCLEdBQW9DUCxPQUFPLEtBQUtHLE9BQVosRUFBcUIsS0FBS0UsU0FBMUIsQ0FBcEMsR0FBMkUsR0FBbEY7QUFDQTs7Ozs7O0FBR0ZHLE9BQU9DLE9BQVAsR0FBaUJQLGFBQWpCIiwiZmlsZSI6Ilplc2tFeGNlcHRpb24uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAmY29weTsgMjAxNyBNYXJrZXQgQWN1bWVuLCBJbmMuXG4gKi9cbnZhciBmb3JtYXQgPSByZXF1aXJlKFwic3RyaW5nLWZvcm1hdC1vYmpcIik7XG5cbmNsYXNzIFplc2tFeGNlcHRpb24ge1xuXHRjb25zdHJ1Y3RvcihtZXNzYWdlLCBhcmdzKSB7XG5cdFx0dGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcblx0XHR0aGlzLmFyZ3VtZW50cyA9IHR5cGVvZiBhcmdzID09PSBcIm9iamVjdFwiID8gYXJncyA6IHt9O1xuXHR9XG5cblx0dG9TdHJpbmcoKSB7XG5cdFx0cmV0dXJuIFwiW1wiICsgdGhpcy5jb25zdHJ1Y3Rvci5uYW1lICsgXCIgXCIgKyBmb3JtYXQodGhpcy5tZXNzYWdlLCB0aGlzLmFyZ3VtZW50cykgKyBcIl1cIjtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFplc2tFeGNlcHRpb247XG4iXX0=