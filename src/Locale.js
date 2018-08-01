/**
 * Copyright &copy; 2017 Market Acumen, Inc.
 */
import Zesk from "./Zesk";
import DateTools from "./DateTools";

let Locale = {},
	is_object = Zesk.is_object,
	to_string = Zesk.to_string,
	avalue = Zesk.avalue,
	plural_en = function(s, count) {
		count = parseInt(count, 10);
		if (count === 1) {
			return s;
		}
		let ess = Locale.translate("plural:=" + s.toLowerCase(), "en", null);
		if (ess) {
			return Locale.case_match_simple(ess, s);
		}
		let s1 = s.substring(s.length - 1);
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
	plural_n: function(s, n, locale) {
		return n + " " + Locale.plural(s, n, locale);
	},
	locale: function(set) {
		if (set) {
			return Zesk.set("locale", set);
		}
		return Zesk.get("locale", "en_US");
	},
	language: function() {
		let x = to_string(arguments[0] || Locale.locale());
		return x.left("_", "en").toLowerCase();
	},
	ordinal: function(n) {
		return n + Locale.ordinal_suffix(n);
	},
	ordinal_suffix: function(n) {
		let m10 = n % 10,
			m100 = n % 100;
		if (m100 > 10 && m100 < 20) {
			return "th";
		}
		return avalue({ 1: "st", 2: "nd", 3: "rd" }, m10, "th");
	},
	translation: function(locale, map) {
		let tt = Zesk.get("translation-table", {});
		locale = locale.toLowerCase();
		if (!tt[locale]) {
			tt[locale] = {};
		}
		for (let k in map) {
			if (map.hasOwnProperty(k)) {
				tt[locale][k] = map[k].toString();
			}
		}
		Zesk.set("translation-table", tt);
	},
	translate: function(string, locale) {
		let text = string.toString(),
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
	case_match_simple: function(string, pattern) {
		let char1 = pattern.substr(0, 1);
		let char2 = pattern.substr(1, 1);
		if (char1 === char1.toLowerCase(char1)) {
			return string.toLowerCase();
		} else if (char2 === char2.toLowerCase()) {
			return string.substring(0, 1).toUpperCase() + string.substring(1).toLowerCase();
		} else {
			return string.toUpperCase();
		}
	},
	load: function(locale, tt) {
		let tables = Zesk.get("translation-table", {});
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
	if (_.isUndefined(phrase)) {
		return "-undefined-value-";
	}
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

Locale.durationString = function(delta, min_unit) {
	let number = null;
	if (delta < 0) {
		delta = -delta;
	}
	if (Zesk.is_string(min_unit)) {
		min_unit = DateTools.units[min_unit] || 0;
	}
	Zesk.each(DateTools.units, function(unit, nsecs) {
		if (unit === min_unit || delta > nsecs * 2 - 1) {
			number = parseInt(delta / nsecs, 10);
			return Locale.plural_n(Locale.__(unit), number);
		}
	});
	return {
		duration: Locale.plural_n(Locale.__(DateTools.SECOND), parseInt(delta, 10)),
		number: number,
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
Locale.nowString = function(ts, min_unit, zero_string) {
	let now = new Date();
	let delta = (now.getTime() - ts.getTime()) / 1000;
	let { duration, number } = Locale.durationString(delta, min_unit);
	let phrase = null;
	if (number === 0 && Zesk.is_string(zero_string)) {
		phrase = zero_string;
	} else if (delta < 0) {
		phrase = "Locale::now_string:=in {duration}";
	} else {
		phrase = "Locale::now_string:={duration} ago";
	}
	return Locale.__(phrase, {
		duration: duration,
		min_unit: min_unit,
		zero_string: zero_string,
	});
};

module.exports = Locale;
