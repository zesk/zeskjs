"use strict";

/**
* Copyright &copy; 2017 Market Acumen, Inc.
*/
var Zesk = require("./Zesk");

var Locale = {},
	is_object = Zesk.is_object,
	to_string = Zesk.to_string,
	avalue = Zesk.avalue,
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
	};
Locale = {
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
			return Zesk.set("locale", set);
		}
		return Zesk.get("locale", "en_US");
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
		var tt = Zesk.get("translation-table", {});
		locale = locale.toLowerCase();
		if (!tt[locale]) {
			tt[locale] = {};
		}
		for (var k in map) {
			if (map.hasOwnProperty(k)) {
				tt[locale][k] = map[k].toString();
			}
		}
		Zesk.set("translation-table", tt);
	},
	translate: function translate(string, locale) {
		var text = string.toString(),
			phrase = string.right(":=", string),
			tt = Zesk.get("translation-table"),
			r,
			_default = arguments.length > 2 ? arguments[2] : phrase;

		locale = locale || Locale.locale();
		tt = [avalue(tt, locale, {}), avalue(tt, Locale.language(locale), {})];
		r = Zesk.each(tt, function(i, t) {
			//	console.log('tried ', text, i, t, t[text]);
			return t[text] || null;
		});
		if (r) {
			return r;
		}
		r = Zesk.each(tt, function(i, t) {
			//	console.log('tried ', phrase, i, t, t[phrase]);
			return t[phrase] || null;
		});
		if (r) {
			return r;
		}
		r = Zesk.each(tt, function(i, t) {
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
		var tables = Zesk.get("translation-table", {});
		tables[locale] = tt;
	},
};
Locale.translation("en", {
	"plural:=day": "days",
	"plural:=staff": "staff",
	"plural:=sheep": "sheep",
	"plural:=octopus": "octopi",
	"plural:=news": "news",
});
Locale.__ = function(phrase, map) {
	if (phrase instanceof Object) {
		Zesk.each(phrase, function(k) {
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
module.exports = Locale;
