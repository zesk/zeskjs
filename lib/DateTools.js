"use strict";

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
	toString: function toString(d) {
		return d.getUTCFullYear() + "-" + zero(d.getUTCMonth() + 1) + "-" + zero(d.getUTCDate()) + " " + zero(d.getUTCHours()) + ":" + zero(d.getUTCMinutes()) + ":" + zero(d.getUTCSeconds());
	}
};

module.exports = DateTools;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9EYXRlVG9vbHMuanMiXSwibmFtZXMiOlsiemVybyIsIngiLCJTdHJpbmciLCJEYXRlVG9vbHMiLCJ0b1N0cmluZyIsImQiLCJnZXRVVENGdWxsWWVhciIsImdldFVUQ01vbnRoIiwiZ2V0VVRDRGF0ZSIsImdldFVUQ0hvdXJzIiwiZ2V0VVRDTWludXRlcyIsImdldFVUQ1NlY29uZHMiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOztBQUFBOzs7QUFHQTtBQUNBOztBQUVBLFNBQVNBLElBQVQsQ0FBY0MsQ0FBZCxFQUFpQjtBQUNoQixLQUFJQSxJQUFJLEVBQVIsRUFBWTtBQUNYLFNBQU8sTUFBTUEsQ0FBYjtBQUNBO0FBQ0QsUUFBT0MsT0FBT0QsQ0FBUCxDQUFQO0FBQ0E7O0FBRUQsSUFBSUUsWUFBWTtBQUNmQyxXQUFVLGtCQUFTQyxDQUFULEVBQVk7QUFDckIsU0FDQ0EsRUFBRUMsY0FBRixLQUNBLEdBREEsR0FFQU4sS0FBS0ssRUFBRUUsV0FBRixLQUFrQixDQUF2QixDQUZBLEdBR0EsR0FIQSxHQUlBUCxLQUFLSyxFQUFFRyxVQUFGLEVBQUwsQ0FKQSxHQUtBLEdBTEEsR0FNQVIsS0FBS0ssRUFBRUksV0FBRixFQUFMLENBTkEsR0FPQSxHQVBBLEdBUUFULEtBQUtLLEVBQUVLLGFBQUYsRUFBTCxDQVJBLEdBU0EsR0FUQSxHQVVBVixLQUFLSyxFQUFFTSxhQUFGLEVBQUwsQ0FYRDtBQWFBO0FBZmMsQ0FBaEI7O0FBa0JBQyxPQUFPQyxPQUFQLEdBQWlCVixTQUFqQiIsImZpbGUiOiJEYXRlVG9vbHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAmY29weTsgMjAxNyBNYXJrZXQgQWN1bWVuLCBJbmMuXG4gKi9cbi8vY29uc3QgXyA9IHJlcXVpcmUoXCJsb2Rhc2hcIik7XG4vL2NvbnN0IFplc2sgPSByZXF1aXJlKFwiLi9aZXNrXCIpO1xuXG5mdW5jdGlvbiB6ZXJvKHgpIHtcblx0aWYgKHggPCAxMCkge1xuXHRcdHJldHVybiBcIjBcIiArIHg7XG5cdH1cblx0cmV0dXJuIFN0cmluZyh4KTtcbn1cblxudmFyIERhdGVUb29scyA9IHtcblx0dG9TdHJpbmc6IGZ1bmN0aW9uKGQpIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0ZC5nZXRVVENGdWxsWWVhcigpICtcblx0XHRcdFwiLVwiICtcblx0XHRcdHplcm8oZC5nZXRVVENNb250aCgpICsgMSkgK1xuXHRcdFx0XCItXCIgK1xuXHRcdFx0emVybyhkLmdldFVUQ0RhdGUoKSkgK1xuXHRcdFx0XCIgXCIgK1xuXHRcdFx0emVybyhkLmdldFVUQ0hvdXJzKCkpICtcblx0XHRcdFwiOlwiICtcblx0XHRcdHplcm8oZC5nZXRVVENNaW51dGVzKCkpICtcblx0XHRcdFwiOlwiICtcblx0XHRcdHplcm8oZC5nZXRVVENTZWNvbmRzKCkpXG5cdFx0KTtcblx0fSxcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRGF0ZVRvb2xzO1xuIl19