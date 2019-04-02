"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /**
                                                                                                                                                                                                                                                                               * Copyright &copy; 2017 Market Acumen, Inc.
                                                                                                                                                                                                                                                                               */


var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _Zesk = require("./Zesk");

var _Zesk2 = _interopRequireDefault(_Zesk);

var _DateTools = require("./DateTools");

var _DateTools2 = _interopRequireDefault(_DateTools);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Locale = {},
    is_object = _Zesk2.default.is_object,
    is_string = _Zesk2.default.is_string,
    to_string = _Zesk2.default.to_string,
    avalue = _Zesk2.default.avalue,
    plural_en = function plural_en(s, count) {
	count = parseInt(count, 10);
	if (count === 1) {
		return s;
	}
	var ess = Locale.translate("plural:=" + s.toLowerCase(), "en", null);
	if (ess) {
		return Locale.case_match_simple(ess, s);
	}
	var s1 = s.substring(s.length - 1);
	switch (s1) {
		case "x":
			return s + "es";
		case "y":
			return s.substring(0, s.length - 1) + "ies";
		default:
			break;
	}
	return s + "s";
},
    cardinal_default = function cardinal_default(object, number) {
	var other = object.other || "-no-other-key-";
	number = parseInt(number, 10);
	if (number === 0) {
		return object.zero || other;
	}
	if (number === 1) {
		return object.one || other;
	}
	if (number === 2) {
		return object.two || other;
	}
	if (number === 3) {
		return object.few || other;
	}
	if (number >= 4 && number <= 6) {
		return object.many || other;
	}
	return other;
};
Locale = {
	cardinal: function cardinal(mixed, number) {
		if (is_string(mixed)) {
			return cardinal_default({
				one: Locale.__("cardinal::one:=" + mixed),
				other: Locale.__("cardinal::other:=" + mixed)
			});
		}
		if (is_object(mixed)) {
			return cardinal_default(mixed, number);
		}
		throw new Error("Invalid mixed type passed in " + (typeof mixed === "undefined" ? "undefined" : _typeof(mixed)));
	},
	cardinal_phrase: function cardinal_phrase(mixed, number) {
		return Locale.__("cardinal::phrase:={number} {cardinal}", {
			number: number,
			cardinal: Locale.cardinal(mixed, number)
		});
	},

	plural: function plural(s, n, locale) {
		n = n || 2;
		if (Locale.language(locale) === "en") {
			return plural_en(s, n);
		} else {
			return plural_en(s, n);
		}
	},
	plural_n: function plural_n(s, n, locale) {
		return n + " " + Locale.plural(s, n, locale);
	},
	locale: function locale(set) {
		if (set) {
			return _Zesk2.default.set("locale", set);
		}
		return _Zesk2.default.get("locale", "en_US");
	},
	language: function language() {
		var x = to_string(arguments[0] || Locale.locale());
		return x.left("_", "en").toLowerCase();
	},
	ordinal: function ordinal(n) {
		return n + Locale.ordinal_suffix(n);
	},
	ordinal_suffix: function ordinal_suffix(n) {
		var m10 = n % 10,
		    m100 = n % 100;
		if (m100 > 10 && m100 < 20) {
			return "th";
		}
		return avalue({ 1: "st", 2: "nd", 3: "rd" }, m10, "th");
	},
	translation: function translation(locale, map) {
		var tt = _Zesk2.default.get("translation-table", {});
		locale = locale.toLowerCase();
		if (!tt[locale]) {
			tt[locale] = {};
		}
		for (var k in map) {
			if (map.hasOwnProperty(k)) {
				tt[locale][k] = map[k].toString();
			}
		}
		_Zesk2.default.set("translation-table", tt);
	},
	translate: function translate(string, locale) {
		var text = string.toString(),
		    phrase = string.right(":=", string),
		    tt = _Zesk2.default.get("translation-table"),
		    r = void 0,
		    _default = arguments.length > 2 ? arguments[2] : phrase;

		locale = locale || Locale.locale();
		tt = [avalue(tt, locale, {}), avalue(tt, Locale.language(locale), {})];
		r = _Zesk2.default.each(tt, function (i, t) {
			//	console.log('tried ', text, i, t, t[text]);
			return t[text] || null;
		});
		if (r) {
			return r;
		}
		r = _Zesk2.default.each(tt, function (i, t) {
			//	console.log('tried ', phrase, i, t, t[phrase]);
			return t[phrase] || null;
		});
		if (r) {
			return r;
		}
		r = _Zesk2.default.each(tt, function (i, t) {
			//	console.log('tried ', phrase.toLowerCase(), i, t, t[phrase.toLowerCase()]);
			return t[phrase.toLowerCase()] || null;
		});
		if (r) {
			return Locale.case_match_simple(r, phrase);
		}
		return _default;
	},
	case_match_simple: function case_match_simple(string, pattern) {
		var char1 = pattern.substr(0, 1);
		var char2 = pattern.substr(1, 1);
		if (char1 === char1.toLowerCase(char1)) {
			return string.toLowerCase();
		} else if (char2 === char2.toLowerCase()) {
			return string.substring(0, 1).toUpperCase() + string.substring(1).toLowerCase();
		} else {
			return string.toUpperCase();
		}
	},
	load: function load(locale, tt) {
		var tables = _Zesk2.default.get("translation-table", {});
		tables[locale] = tt;
	}
};
// Old way
Locale.translation("en", {
	"plural:=day": "days",
	"plural:=staff": "staff",
	"plural:=sheep": "sheep",
	"plural:=octopus": "octopi",
	"plural:=news": "news"
});
// new way
Locale.translation("en", {
	"cardinal::other:=day": "days",
	"cardinal::other:=staff": "staff",
	"cardinal::other:=sheep": "sheep",
	"cardinal::other:=octopus": "octopi",
	"cardinal::other:=news": "news",
	"cardinal::other:=person": "people"
});
Locale.__ = function (phrase, map) {
	if (_lodash2.default.isUndefined(phrase)) {
		return "-undefined-value-";
	}
	if (phrase instanceof Object) {
		_Zesk2.default.each(phrase, function (k) {
			phrase[k] = Locale.__(phrase[k], map);
		});
		return phrase;
	}
	phrase = Locale.translate(phrase);
	if (!is_object(map)) {
		return phrase;
	}
	return phrase.map(map, true);
};

Locale.durationString = function (delta, min_unit) {
	var number = null;
	if (delta < 0) {
		delta = -delta;
	}
	if (_Zesk2.default.is_string(min_unit)) {
		min_unit = _DateTools2.default.units[min_unit] || 0;
	}
	var units = _DateTools2.default.unitsOrder;
	for (var i = units.length - 1; i >= 0; i--) {
		var unit = units[i],
		    nsecs = _DateTools2.default.units[unit];
		if (unit === min_unit || delta > nsecs * 2 - 1) {
			number = parseInt(delta / nsecs, 10);
			return {
				duration: Locale.plural_n(Locale.__(unit), number),
				number: number
			};
		}
	}
	return {
		duration: Locale.plural_n(Locale.__(_DateTools2.default.SECOND), parseInt(delta, 10)),
		number: number
	};
};

/**
 * Output a string like "in 3 days", "5 hours ago"
 *
 * @param {Date} ts
 *        	Date to generate string
 * @param {string} min_unit
 *        	Minimum unit to output
 * @param {string} zero_string
 *        	Optional string if < 1 unit away
 * @return string
 */
Locale.nowString = function (ts, min_unit, zero_string) {
	var now = new Date();
	var delta = (now.getTime() - ts.getTime()) / 1000;

	var _Locale$durationStrin = Locale.durationString(delta, min_unit),
	    duration = _Locale$durationStrin.duration,
	    number = _Locale$durationStrin.number;

	var phrase = null;
	if (number === 0 && _Zesk2.default.is_string(zero_string)) {
		phrase = zero_string;
	} else if (delta < 0) {
		phrase = "Locale::now_string:=in {duration}";
	} else {
		phrase = "Locale::now_string:={duration} ago";
	}
	return Locale.__(phrase, {
		duration: duration,
		min_unit: min_unit,
		zero_string: zero_string
	});
};

module.exports = Locale;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9Mb2NhbGUuanMiXSwibmFtZXMiOlsiTG9jYWxlIiwiaXNfb2JqZWN0IiwiWmVzayIsImlzX3N0cmluZyIsInRvX3N0cmluZyIsImF2YWx1ZSIsInBsdXJhbF9lbiIsInMiLCJjb3VudCIsInBhcnNlSW50IiwiZXNzIiwidHJhbnNsYXRlIiwidG9Mb3dlckNhc2UiLCJjYXNlX21hdGNoX3NpbXBsZSIsInMxIiwic3Vic3RyaW5nIiwibGVuZ3RoIiwiY2FyZGluYWxfZGVmYXVsdCIsIm9iamVjdCIsIm51bWJlciIsIm90aGVyIiwiemVybyIsIm9uZSIsInR3byIsImZldyIsIm1hbnkiLCJjYXJkaW5hbCIsIm1peGVkIiwiX18iLCJFcnJvciIsImNhcmRpbmFsX3BocmFzZSIsInBsdXJhbCIsIm4iLCJsb2NhbGUiLCJsYW5ndWFnZSIsInBsdXJhbF9uIiwic2V0IiwiZ2V0IiwieCIsImFyZ3VtZW50cyIsImxlZnQiLCJvcmRpbmFsIiwib3JkaW5hbF9zdWZmaXgiLCJtMTAiLCJtMTAwIiwidHJhbnNsYXRpb24iLCJtYXAiLCJ0dCIsImsiLCJoYXNPd25Qcm9wZXJ0eSIsInRvU3RyaW5nIiwic3RyaW5nIiwidGV4dCIsInBocmFzZSIsInJpZ2h0IiwiciIsIl9kZWZhdWx0IiwiZWFjaCIsImkiLCJ0IiwicGF0dGVybiIsImNoYXIxIiwic3Vic3RyIiwiY2hhcjIiLCJ0b1VwcGVyQ2FzZSIsImxvYWQiLCJ0YWJsZXMiLCJfIiwiaXNVbmRlZmluZWQiLCJPYmplY3QiLCJkdXJhdGlvblN0cmluZyIsImRlbHRhIiwibWluX3VuaXQiLCJEYXRlVG9vbHMiLCJ1bml0cyIsInVuaXRzT3JkZXIiLCJ1bml0IiwibnNlY3MiLCJkdXJhdGlvbiIsIlNFQ09ORCIsIm5vd1N0cmluZyIsInRzIiwiemVyb19zdHJpbmciLCJub3ciLCJEYXRlIiwiZ2V0VGltZSIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7OzhRQUFBOzs7OztBQUdBOzs7O0FBRUE7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aUJ2RixNQUFqQiIsImZpbGUiOiJMb2NhbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAmY29weTsgMjAxNyBNYXJrZXQgQWN1bWVuLCBJbmMuXG4gKi9cbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcblxuaW1wb3J0IFplc2sgZnJvbSBcIi4vWmVza1wiO1xuaW1wb3J0IERhdGVUb29scyBmcm9tIFwiLi9EYXRlVG9vbHNcIjtcblxubGV0IExvY2FsZSA9IHt9LFxuXHRpc19vYmplY3QgPSBaZXNrLmlzX29iamVjdCxcblx0aXNfc3RyaW5nID0gWmVzay5pc19zdHJpbmcsXG5cdHRvX3N0cmluZyA9IFplc2sudG9fc3RyaW5nLFxuXHRhdmFsdWUgPSBaZXNrLmF2YWx1ZSxcblx0cGx1cmFsX2VuID0gZnVuY3Rpb24ocywgY291bnQpIHtcblx0XHRjb3VudCA9IHBhcnNlSW50KGNvdW50LCAxMCk7XG5cdFx0aWYgKGNvdW50ID09PSAxKSB7XG5cdFx0XHRyZXR1cm4gcztcblx0XHR9XG5cdFx0bGV0IGVzcyA9IExvY2FsZS50cmFuc2xhdGUoXCJwbHVyYWw6PVwiICsgcy50b0xvd2VyQ2FzZSgpLCBcImVuXCIsIG51bGwpO1xuXHRcdGlmIChlc3MpIHtcblx0XHRcdHJldHVybiBMb2NhbGUuY2FzZV9tYXRjaF9zaW1wbGUoZXNzLCBzKTtcblx0XHR9XG5cdFx0bGV0IHMxID0gcy5zdWJzdHJpbmcocy5sZW5ndGggLSAxKTtcblx0XHRzd2l0Y2ggKHMxKSB7XG5cdFx0XHRjYXNlIFwieFwiOlxuXHRcdFx0XHRyZXR1cm4gcyArIFwiZXNcIjtcblx0XHRcdGNhc2UgXCJ5XCI6XG5cdFx0XHRcdHJldHVybiBzLnN1YnN0cmluZygwLCBzLmxlbmd0aCAtIDEpICsgXCJpZXNcIjtcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdGJyZWFrO1xuXHRcdH1cblx0XHRyZXR1cm4gcyArIFwic1wiO1xuXHR9LFxuXHRjYXJkaW5hbF9kZWZhdWx0ID0gZnVuY3Rpb24ob2JqZWN0LCBudW1iZXIpIHtcblx0XHRsZXQgb3RoZXIgPSBvYmplY3Qub3RoZXIgfHwgXCItbm8tb3RoZXIta2V5LVwiO1xuXHRcdG51bWJlciA9IHBhcnNlSW50KG51bWJlciwgMTApO1xuXHRcdGlmIChudW1iZXIgPT09IDApIHtcblx0XHRcdHJldHVybiBvYmplY3QuemVybyB8fCBvdGhlcjtcblx0XHR9XG5cdFx0aWYgKG51bWJlciA9PT0gMSkge1xuXHRcdFx0cmV0dXJuIG9iamVjdC5vbmUgfHwgb3RoZXI7XG5cdFx0fVxuXHRcdGlmIChudW1iZXIgPT09IDIpIHtcblx0XHRcdHJldHVybiBvYmplY3QudHdvIHx8IG90aGVyO1xuXHRcdH1cblx0XHRpZiAobnVtYmVyID09PSAzKSB7XG5cdFx0XHRyZXR1cm4gb2JqZWN0LmZldyB8fCBvdGhlcjtcblx0XHR9XG5cdFx0aWYgKG51bWJlciA+PSA0ICYmIG51bWJlciA8PSA2KSB7XG5cdFx0XHRyZXR1cm4gb2JqZWN0Lm1hbnkgfHwgb3RoZXI7XG5cdFx0fVxuXHRcdHJldHVybiBvdGhlcjtcblx0fTtcbkxvY2FsZSA9IHtcblx0Y2FyZGluYWw6IGZ1bmN0aW9uKG1peGVkLCBudW1iZXIpIHtcblx0XHRpZiAoaXNfc3RyaW5nKG1peGVkKSkge1xuXHRcdFx0cmV0dXJuIGNhcmRpbmFsX2RlZmF1bHQoe1xuXHRcdFx0XHRvbmU6IExvY2FsZS5fXyhcImNhcmRpbmFsOjpvbmU6PVwiICsgbWl4ZWQpLFxuXHRcdFx0XHRvdGhlcjogTG9jYWxlLl9fKFwiY2FyZGluYWw6Om90aGVyOj1cIiArIG1peGVkKSxcblx0XHRcdH0pO1xuXHRcdH1cblx0XHRpZiAoaXNfb2JqZWN0KG1peGVkKSkge1xuXHRcdFx0cmV0dXJuIGNhcmRpbmFsX2RlZmF1bHQobWl4ZWQsIG51bWJlcik7XG5cdFx0fVxuXHRcdHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgbWl4ZWQgdHlwZSBwYXNzZWQgaW4gXCIgKyB0eXBlb2YgbWl4ZWQpO1xuXHR9LFxuXHRjYXJkaW5hbF9waHJhc2UobWl4ZWQsIG51bWJlcikge1xuXHRcdHJldHVybiBMb2NhbGUuX18oXCJjYXJkaW5hbDo6cGhyYXNlOj17bnVtYmVyfSB7Y2FyZGluYWx9XCIsIHtcblx0XHRcdG51bWJlcjogbnVtYmVyLFxuXHRcdFx0Y2FyZGluYWw6IExvY2FsZS5jYXJkaW5hbChtaXhlZCwgbnVtYmVyKSxcblx0XHR9KTtcblx0fSxcblx0cGx1cmFsOiBmdW5jdGlvbiBwbHVyYWwocywgbiwgbG9jYWxlKSB7XG5cdFx0biA9IG4gfHwgMjtcblx0XHRpZiAoTG9jYWxlLmxhbmd1YWdlKGxvY2FsZSkgPT09IFwiZW5cIikge1xuXHRcdFx0cmV0dXJuIHBsdXJhbF9lbihzLCBuKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHBsdXJhbF9lbihzLCBuKTtcblx0XHR9XG5cdH0sXG5cdHBsdXJhbF9uOiBmdW5jdGlvbihzLCBuLCBsb2NhbGUpIHtcblx0XHRyZXR1cm4gbiArIFwiIFwiICsgTG9jYWxlLnBsdXJhbChzLCBuLCBsb2NhbGUpO1xuXHR9LFxuXHRsb2NhbGU6IGZ1bmN0aW9uKHNldCkge1xuXHRcdGlmIChzZXQpIHtcblx0XHRcdHJldHVybiBaZXNrLnNldChcImxvY2FsZVwiLCBzZXQpO1xuXHRcdH1cblx0XHRyZXR1cm4gWmVzay5nZXQoXCJsb2NhbGVcIiwgXCJlbl9VU1wiKTtcblx0fSxcblx0bGFuZ3VhZ2U6IGZ1bmN0aW9uKCkge1xuXHRcdGxldCB4ID0gdG9fc3RyaW5nKGFyZ3VtZW50c1swXSB8fCBMb2NhbGUubG9jYWxlKCkpO1xuXHRcdHJldHVybiB4LmxlZnQoXCJfXCIsIFwiZW5cIikudG9Mb3dlckNhc2UoKTtcblx0fSxcblx0b3JkaW5hbDogZnVuY3Rpb24obikge1xuXHRcdHJldHVybiBuICsgTG9jYWxlLm9yZGluYWxfc3VmZml4KG4pO1xuXHR9LFxuXHRvcmRpbmFsX3N1ZmZpeDogZnVuY3Rpb24obikge1xuXHRcdGxldCBtMTAgPSBuICUgMTAsXG5cdFx0XHRtMTAwID0gbiAlIDEwMDtcblx0XHRpZiAobTEwMCA+IDEwICYmIG0xMDAgPCAyMCkge1xuXHRcdFx0cmV0dXJuIFwidGhcIjtcblx0XHR9XG5cdFx0cmV0dXJuIGF2YWx1ZSh7IDE6IFwic3RcIiwgMjogXCJuZFwiLCAzOiBcInJkXCIgfSwgbTEwLCBcInRoXCIpO1xuXHR9LFxuXHR0cmFuc2xhdGlvbjogZnVuY3Rpb24obG9jYWxlLCBtYXApIHtcblx0XHRsZXQgdHQgPSBaZXNrLmdldChcInRyYW5zbGF0aW9uLXRhYmxlXCIsIHt9KTtcblx0XHRsb2NhbGUgPSBsb2NhbGUudG9Mb3dlckNhc2UoKTtcblx0XHRpZiAoIXR0W2xvY2FsZV0pIHtcblx0XHRcdHR0W2xvY2FsZV0gPSB7fTtcblx0XHR9XG5cdFx0Zm9yIChsZXQgayBpbiBtYXApIHtcblx0XHRcdGlmIChtYXAuaGFzT3duUHJvcGVydHkoaykpIHtcblx0XHRcdFx0dHRbbG9jYWxlXVtrXSA9IG1hcFtrXS50b1N0cmluZygpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRaZXNrLnNldChcInRyYW5zbGF0aW9uLXRhYmxlXCIsIHR0KTtcblx0fSxcblx0dHJhbnNsYXRlOiBmdW5jdGlvbihzdHJpbmcsIGxvY2FsZSkge1xuXHRcdGxldCB0ZXh0ID0gc3RyaW5nLnRvU3RyaW5nKCksXG5cdFx0XHRwaHJhc2UgPSBzdHJpbmcucmlnaHQoXCI6PVwiLCBzdHJpbmcpLFxuXHRcdFx0dHQgPSBaZXNrLmdldChcInRyYW5zbGF0aW9uLXRhYmxlXCIpLFxuXHRcdFx0cixcblx0XHRcdF9kZWZhdWx0ID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgPyBhcmd1bWVudHNbMl0gOiBwaHJhc2U7XG5cblx0XHRsb2NhbGUgPSBsb2NhbGUgfHwgTG9jYWxlLmxvY2FsZSgpO1xuXHRcdHR0ID0gW2F2YWx1ZSh0dCwgbG9jYWxlLCB7fSksIGF2YWx1ZSh0dCwgTG9jYWxlLmxhbmd1YWdlKGxvY2FsZSksIHt9KV07XG5cdFx0ciA9IFplc2suZWFjaCh0dCwgZnVuY3Rpb24oaSwgdCkge1xuXHRcdFx0Ly9cdGNvbnNvbGUubG9nKCd0cmllZCAnLCB0ZXh0LCBpLCB0LCB0W3RleHRdKTtcblx0XHRcdHJldHVybiB0W3RleHRdIHx8IG51bGw7XG5cdFx0fSk7XG5cdFx0aWYgKHIpIHtcblx0XHRcdHJldHVybiByO1xuXHRcdH1cblx0XHRyID0gWmVzay5lYWNoKHR0LCBmdW5jdGlvbihpLCB0KSB7XG5cdFx0XHQvL1x0Y29uc29sZS5sb2coJ3RyaWVkICcsIHBocmFzZSwgaSwgdCwgdFtwaHJhc2VdKTtcblx0XHRcdHJldHVybiB0W3BocmFzZV0gfHwgbnVsbDtcblx0XHR9KTtcblx0XHRpZiAocikge1xuXHRcdFx0cmV0dXJuIHI7XG5cdFx0fVxuXHRcdHIgPSBaZXNrLmVhY2godHQsIGZ1bmN0aW9uKGksIHQpIHtcblx0XHRcdC8vXHRjb25zb2xlLmxvZygndHJpZWQgJywgcGhyYXNlLnRvTG93ZXJDYXNlKCksIGksIHQsIHRbcGhyYXNlLnRvTG93ZXJDYXNlKCldKTtcblx0XHRcdHJldHVybiB0W3BocmFzZS50b0xvd2VyQ2FzZSgpXSB8fCBudWxsO1xuXHRcdH0pO1xuXHRcdGlmIChyKSB7XG5cdFx0XHRyZXR1cm4gTG9jYWxlLmNhc2VfbWF0Y2hfc2ltcGxlKHIsIHBocmFzZSk7XG5cdFx0fVxuXHRcdHJldHVybiBfZGVmYXVsdDtcblx0fSxcblx0Y2FzZV9tYXRjaF9zaW1wbGU6IGZ1bmN0aW9uKHN0cmluZywgcGF0dGVybikge1xuXHRcdGxldCBjaGFyMSA9IHBhdHRlcm4uc3Vic3RyKDAsIDEpO1xuXHRcdGxldCBjaGFyMiA9IHBhdHRlcm4uc3Vic3RyKDEsIDEpO1xuXHRcdGlmIChjaGFyMSA9PT0gY2hhcjEudG9Mb3dlckNhc2UoY2hhcjEpKSB7XG5cdFx0XHRyZXR1cm4gc3RyaW5nLnRvTG93ZXJDYXNlKCk7XG5cdFx0fSBlbHNlIGlmIChjaGFyMiA9PT0gY2hhcjIudG9Mb3dlckNhc2UoKSkge1xuXHRcdFx0cmV0dXJuIHN0cmluZy5zdWJzdHJpbmcoMCwgMSkudG9VcHBlckNhc2UoKSArIHN0cmluZy5zdWJzdHJpbmcoMSkudG9Mb3dlckNhc2UoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHN0cmluZy50b1VwcGVyQ2FzZSgpO1xuXHRcdH1cblx0fSxcblx0bG9hZDogZnVuY3Rpb24obG9jYWxlLCB0dCkge1xuXHRcdGxldCB0YWJsZXMgPSBaZXNrLmdldChcInRyYW5zbGF0aW9uLXRhYmxlXCIsIHt9KTtcblx0XHR0YWJsZXNbbG9jYWxlXSA9IHR0O1xuXHR9LFxufTtcbi8vIE9sZCB3YXlcbkxvY2FsZS50cmFuc2xhdGlvbihcImVuXCIsIHtcblx0XCJwbHVyYWw6PWRheVwiOiBcImRheXNcIixcblx0XCJwbHVyYWw6PXN0YWZmXCI6IFwic3RhZmZcIixcblx0XCJwbHVyYWw6PXNoZWVwXCI6IFwic2hlZXBcIixcblx0XCJwbHVyYWw6PW9jdG9wdXNcIjogXCJvY3RvcGlcIixcblx0XCJwbHVyYWw6PW5ld3NcIjogXCJuZXdzXCIsXG59KTtcbi8vIG5ldyB3YXlcbkxvY2FsZS50cmFuc2xhdGlvbihcImVuXCIsIHtcblx0XCJjYXJkaW5hbDo6b3RoZXI6PWRheVwiOiBcImRheXNcIixcblx0XCJjYXJkaW5hbDo6b3RoZXI6PXN0YWZmXCI6IFwic3RhZmZcIixcblx0XCJjYXJkaW5hbDo6b3RoZXI6PXNoZWVwXCI6IFwic2hlZXBcIixcblx0XCJjYXJkaW5hbDo6b3RoZXI6PW9jdG9wdXNcIjogXCJvY3RvcGlcIixcblx0XCJjYXJkaW5hbDo6b3RoZXI6PW5ld3NcIjogXCJuZXdzXCIsXG5cdFwiY2FyZGluYWw6Om90aGVyOj1wZXJzb25cIjogXCJwZW9wbGVcIixcbn0pO1xuTG9jYWxlLl9fID0gZnVuY3Rpb24ocGhyYXNlLCBtYXApIHtcblx0aWYgKF8uaXNVbmRlZmluZWQocGhyYXNlKSkge1xuXHRcdHJldHVybiBcIi11bmRlZmluZWQtdmFsdWUtXCI7XG5cdH1cblx0aWYgKHBocmFzZSBpbnN0YW5jZW9mIE9iamVjdCkge1xuXHRcdFplc2suZWFjaChwaHJhc2UsIGZ1bmN0aW9uKGspIHtcblx0XHRcdHBocmFzZVtrXSA9IExvY2FsZS5fXyhwaHJhc2Vba10sIG1hcCk7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIHBocmFzZTtcblx0fVxuXHRwaHJhc2UgPSBMb2NhbGUudHJhbnNsYXRlKHBocmFzZSk7XG5cdGlmICghaXNfb2JqZWN0KG1hcCkpIHtcblx0XHRyZXR1cm4gcGhyYXNlO1xuXHR9XG5cdHJldHVybiBwaHJhc2UubWFwKG1hcCwgdHJ1ZSk7XG59O1xuXG5Mb2NhbGUuZHVyYXRpb25TdHJpbmcgPSBmdW5jdGlvbihkZWx0YSwgbWluX3VuaXQpIHtcblx0bGV0IG51bWJlciA9IG51bGw7XG5cdGlmIChkZWx0YSA8IDApIHtcblx0XHRkZWx0YSA9IC1kZWx0YTtcblx0fVxuXHRpZiAoWmVzay5pc19zdHJpbmcobWluX3VuaXQpKSB7XG5cdFx0bWluX3VuaXQgPSBEYXRlVG9vbHMudW5pdHNbbWluX3VuaXRdIHx8IDA7XG5cdH1cblx0bGV0IHVuaXRzID0gRGF0ZVRvb2xzLnVuaXRzT3JkZXI7XG5cdGZvciAobGV0IGkgPSB1bml0cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuXHRcdGxldCB1bml0ID0gdW5pdHNbaV0sXG5cdFx0XHRuc2VjcyA9IERhdGVUb29scy51bml0c1t1bml0XTtcblx0XHRpZiAodW5pdCA9PT0gbWluX3VuaXQgfHwgZGVsdGEgPiBuc2VjcyAqIDIgLSAxKSB7XG5cdFx0XHRudW1iZXIgPSBwYXJzZUludChkZWx0YSAvIG5zZWNzLCAxMCk7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRkdXJhdGlvbjogTG9jYWxlLnBsdXJhbF9uKExvY2FsZS5fXyh1bml0KSwgbnVtYmVyKSxcblx0XHRcdFx0bnVtYmVyLFxuXHRcdFx0fTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHtcblx0XHRkdXJhdGlvbjogTG9jYWxlLnBsdXJhbF9uKExvY2FsZS5fXyhEYXRlVG9vbHMuU0VDT05EKSwgcGFyc2VJbnQoZGVsdGEsIDEwKSksXG5cdFx0bnVtYmVyLFxuXHR9O1xufTtcblxuLyoqXG4gKiBPdXRwdXQgYSBzdHJpbmcgbGlrZSBcImluIDMgZGF5c1wiLCBcIjUgaG91cnMgYWdvXCJcbiAqXG4gKiBAcGFyYW0ge0RhdGV9IHRzXG4gKiAgICAgICAgXHREYXRlIHRvIGdlbmVyYXRlIHN0cmluZ1xuICogQHBhcmFtIHtzdHJpbmd9IG1pbl91bml0XG4gKiAgICAgICAgXHRNaW5pbXVtIHVuaXQgdG8gb3V0cHV0XG4gKiBAcGFyYW0ge3N0cmluZ30gemVyb19zdHJpbmdcbiAqICAgICAgICBcdE9wdGlvbmFsIHN0cmluZyBpZiA8IDEgdW5pdCBhd2F5XG4gKiBAcmV0dXJuIHN0cmluZ1xuICovXG5Mb2NhbGUubm93U3RyaW5nID0gZnVuY3Rpb24odHMsIG1pbl91bml0LCB6ZXJvX3N0cmluZykge1xuXHRsZXQgbm93ID0gbmV3IERhdGUoKTtcblx0bGV0IGRlbHRhID0gKG5vdy5nZXRUaW1lKCkgLSB0cy5nZXRUaW1lKCkpIC8gMTAwMDtcblx0bGV0IHsgZHVyYXRpb24sIG51bWJlciB9ID0gTG9jYWxlLmR1cmF0aW9uU3RyaW5nKGRlbHRhLCBtaW5fdW5pdCk7XG5cdGxldCBwaHJhc2UgPSBudWxsO1xuXHRpZiAobnVtYmVyID09PSAwICYmIFplc2suaXNfc3RyaW5nKHplcm9fc3RyaW5nKSkge1xuXHRcdHBocmFzZSA9IHplcm9fc3RyaW5nO1xuXHR9IGVsc2UgaWYgKGRlbHRhIDwgMCkge1xuXHRcdHBocmFzZSA9IFwiTG9jYWxlOjpub3dfc3RyaW5nOj1pbiB7ZHVyYXRpb259XCI7XG5cdH0gZWxzZSB7XG5cdFx0cGhyYXNlID0gXCJMb2NhbGU6Om5vd19zdHJpbmc6PXtkdXJhdGlvbn0gYWdvXCI7XG5cdH1cblx0cmV0dXJuIExvY2FsZS5fXyhwaHJhc2UsIHtcblx0XHRkdXJhdGlvbjogZHVyYXRpb24sXG5cdFx0bWluX3VuaXQ6IG1pbl91bml0LFxuXHRcdHplcm9fc3RyaW5nOiB6ZXJvX3N0cmluZyxcblx0fSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IExvY2FsZTtcbiJdfQ==