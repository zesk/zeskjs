"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * Copyright &copy; 2017 Market Acumen, Inc.
 */
var $ = require("jquery");

var Zesk = {};
var hooks = {};
var W = global.window || {};
var d = W.document || {};
var L = W.location || {};

function gettype(x) {
	if (x === null) {
		return "null";
	}
	return Object.prototype.toString.call(x).split(" ")[1].split("]")[0].toLowerCase();
}

function avalue(obj, i, def) {
	if (def === undefined) {
		def = null;
	}
	if ((typeof obj === "undefined" ? "undefined" : _typeof(obj)) === "object") {
		if (typeof obj[i] !== "undefined") {
			return obj[i];
		}
		return def;
	}
	return def;
}
Zesk.avalue = avalue;

function is_bool(a) {
	return gettype(a) === "boolean";
}
function is_numeric(a) {
	return gettype(a) === "number";
}
function is_string(a) {
	return gettype(a) === "string";
}
function is_array(a) {
	return gettype(a) === "array";
}
function is_object(a) {
	return gettype(a) === "object";
}
function is_integer(a) {
	return is_numeric(a) && parseInt(a, 10) === a;
}
function is_function(a) {
	return gettype(a) === "function";
}
function is_float(a) {
	return typeof a === "number" && parseInt(a, 10) !== a;
}
function is_url(x) {
	return (/^http:\/\/.+|^https:\/\/.+|^mailto:.+@.+|^ftp:\/\/.+|^file:\/\/.+|^news:\/\/.+/.exec(x.toLowerCase().trim())
	);
}

Zesk.flip = function (object) {
	var i,
	    result = {};
	for (i in object) {
		if (object.hasOwnProperty(i)) {
			result[String(object[i])] = i;
		}
	}
	return result;
};

/* Kernel */

Zesk.is_date = function (a) {
	return Object.prototype.toString.call(a) === "[object Date]";
};

Zesk.gettype = gettype;

Zesk.is_array = is_array;
Zesk.is_object = is_object;
Zesk.is_array = is_array;
Zesk.is_number = is_numeric;
Zesk.is_numeric = is_numeric;
Zesk.is_bool = is_bool;
Zesk.is_string = is_string;
Zesk.is_integer = is_integer;
Zesk.is_function = is_function;
Zesk.is_float = is_float;
Zesk.is_url = is_url;

function to_list(x, def, delim) {
	def = def || [];
	delim = delim || ".";
	if (is_array(x)) {
		return x;
	}
	if (x === null) {
		return def;
	}
	return x.toString().split(delim);
}

function to_bool(x) {
	var d = arguments.length > 1 ? arguments[1] : false;
	if (is_bool(x)) {
		return x;
	}
	if (is_numeric(x)) {
		return parseInt(x, 10) !== 0;
	}
	if (is_string(x)) {
		if (["t", "true", "1", "enabled", "y", "yes"].contains(x)) {
			return true;
		}
		if (["f", "false", "0", "disabled", "n", "no"].contains(x)) {
			return false;
		}
	}
	return d;
}

function object_path(object, path, def) {
	var curr = object,
	    k;
	path = to_list(path, [], ".");
	for (k = 0; k < path.length; k++) {
		if (k === path.length - 1) {
			return avalue(curr, path[k], def);
		}
		curr = avalue(curr, path[k]);
		if (curr === null) {
			return def;
		}
		if (!is_object(curr)) {
			return def;
		}
	}
	return curr;
}

function object_set_path(object, path, value) {
	var curr = object,
	    k,
	    seg;
	path = to_list(path, [], ".");
	for (k = 0; k < path.length; k++) {
		seg = path[k];
		if (_typeof(curr[seg]) === "object") {
			curr = curr[seg];
		} else if (k === path.length - 1) {
			curr[seg] = value;
			break;
		} else {
			curr[seg] = {};
			curr = curr[seg];
		}
	}
	return object;
}

Zesk.object_path = object_path;
Zesk.object_set_path = object_set_path;

function hook_path(hook) {
	hook = String(hook).toLowerCase();
	hook = to_list(hook, [], "::");
	if (hook.length === 1) {
		hook.push("*");
	}
	return hook;
}

Object.assign(Zesk, {
	d: d,
	settings: {}, // Place module data here!
	hooks: hooks, // Module hooks go here - use add_hook and hook to use
	w: W,
	url_parts: {
		path: L.pathname,
		host: L.host,
		query: L.search,
		scheme: L.protocol,
		url: d.URL,
		uri: L.pathname + L.search
	},
	page_scripts: null,
	query_get: function query_get(v, def) {
		def = def || null;
		var pair,
		    i,
		    u = d.URL.toString().right("?", null);
		if (!u) {
			return def;
		}
		u = u.split("&");
		for (i = 0; i < u.length; i++) {
			pair = u[i].split("=", 2);
			if (pair[0] === v) {
				return pair[1] || pair[0];
			}
		}
		return def;
	},
	/**
  * @param name string Name of cookie to set/get
  * @param value string Value of cookie to set
  * @param options object Extra options: ttl: integer (seconds), domain: string
  */
	cookie: function cookie(name, value, options) {
		var getcookie = function getcookie(n) {
			var c = d.cookie;
			var s = c.lastIndexOf(n + "=");
			if (s < 0) {
				return null;
			}
			s += n.length + 1;
			var e = c.indexOf(";", s);
			if (e < 0) {
				e = c.length;
			}
			return W.unescape(c.substring(s, e));
		},
		    setcookie = function setcookie(n, v, options) {
			var a = new Date(),
			    t = parseInt(options.ttl, 10) || -1,
			    m = options.domain || null;
			if (t <= 0) {
				a.setFullYear(2030);
			} else if (t > 0) {
				a.setTime(a.getTime() + t * 1000);
			}
			d.cookie = n + "=" + W.escape(v) + "; path=/; expires=" + a.toGMTString() + (m ? "; domain=" + m : "");
			return v;
		},
		    delete_cookie = function delete_cookie(name, dom) {
			var now = new Date(),
			    e = new Date(now.getTime() - 86400);
			d.cookie = name + "=; path=/; expires=" + e.toGMTString() + (dom ? "; domain=" + dom : "");
		};
		options = options || {};
		if (value === null) {
			delete_cookie(name, options.dom || null);
			return;
		}
		return arguments.length === 1 ? getcookie(name) : setcookie(name, value, options);
	},
	css: function css(p) {
		var css = d.createElement("link");
		css.rel = "stylesheet";
		css.href = p;
		css.media = arguments[1] || "all";
		d.getElementsByTagName("head")[0].appendChild(css);
	},
	log: function log() {
		if (W.console && W.console.log) {
			W.console.log(arguments);
		}
	},
	add_hook: function add_hook(hook, fun) {
		var path = hook_path(hook),
		    curr = object_path(hooks, path);
		if (curr) {
			curr.push(fun);
		} else {
			curr = [fun];
			object_set_path(hooks, path, curr);
		}
	},
	has_hook: function has_hook(hook) {
		var funcs = object_path(hooks, hook_path(hook), null);
		return funcs ? true : false;
	},
	hook: function hook(_hook) {
		var path = hook_path(_hook),
		    args = Zesk.clone(arguments),
		    funcs = object_path(hooks, path, null),
		    results = [],
		    i;
		if (!funcs) {
			return results;
		}
		if (args.length > 1) {
			args.shift();
		} else {
			args = [];
		}

		for (i = 0; i < funcs.length; i++) {
			results.push(funcs[i].apply(null, args));
		}
		return results;
	},
	get_path: function get_path(path, def) {
		return object_path(Zesk.settings, path, def);
	},
	set_path: function set_path(path, value) {
		return object_set_path(Zesk.settings, path, value);
	},
	get: function get(n) {
		var a = arguments;
		return avalue(Zesk.settings, n, a.length > 1 ? a[1] : null);
	},
	getb: function getb(n) {
		var a = arguments,
		    d = a.length > 1 ? a[1] : false;
		return to_bool(Zesk.get(n, d));
	},
	set: function set(n, v) {
		var a = arguments,
		    overwrite = a.length > 2 ? to_bool(a[2]) : true;
		if (!overwrite && typeof Zesk.settings[n] !== "undefined") {
			return Zesk.settings[n];
		}
		Zesk.settings[n] = v;
		return v;
	},
	inherit: function inherit(the_class, super_class, prototype) {
		// http://stackoverflow.com/questions/1114024/constructors-in-javascript-objects
		var method,
		    Construct = function Construct() {};
		super_class = super_class || Object;
		Construct.prototype = super_class.prototype;
		the_class.prototype = new Construct();
		the_class.prototype.constructor = the_class;
		the_class["super"] = super_class;
		if (prototype instanceof Object) {
			for (method in prototype) {
				if (prototype.hasOwnProperty(method)) {
					if (!the_class.prototype[method]) {
						the_class.prototype[method] = prototype[method];
					}
				}
			}
		}
		the_class.prototype.clone = function () {
			return Zesk.clone(this);
		};
		return the_class;
	},
	/**
  * Iterate over an object, calling a function once per element
  *
  * @param {object|array} x
  * @param {function} fn with signature (key, value, collection) "this" is set to the value as well
  * @param {boolean} term_false Set to true to terminate when function returns a false-ish value as opposed to a true-ish value
  */
	each: function each(x, fn, term_false) {
		var i, r;
		term_false = to_bool(term_false);
		if (is_array(x)) {
			for (i = 0; i < x.length; i++) {
				r = fn.call(x[i], i, x[i], x);
				if (term_false) {
					if (!r) {
						return r;
					}
				} else if (r) {
					return r;
				}
			}
		} else if (is_object(x)) {
			for (i in x) {
				if (x.hasOwnProperty(i)) {
					r = fn.call(x[i], i, x[i], x);
					if (term_false) {
						if (!r) {
							return r;
						}
					} else if (r) {
						return r;
					}
				}
			}
		} else {
			return fn.call(x, 0, x, x);
		}
	},
	tpl: function tpl(mixed, map) {
		return $(mixed).html().map(map, false);
	},
	script_src_normalize: function script_src_normalize(src) {
		var matches,
		    parts = Zesk.url_parts;
		src = src.unprefix(parts.scheme + "://" + parts.host);
		matches = src.match(/(.*)\?_ver=[0-9]+$/);
		if (matches !== null) {
			src = matches[1];
		}
		return src;
	},
	scripts_init: function scripts_init() {
		Zesk.page_scripts = {};
		$('script[type="text/javascript"][src]').each(function () {
			Zesk.script_add($(this).attr("src"));
		});
	},
	script_add: function script_add(src) {
		if (Zesk.page_scripts === null) {
			Zesk.scripts_init();
		}
		Zesk.page_scripts[src] = true;
		Zesk.page_scripts[Zesk.script_src_normalize(src)] = true;
	},
	scripts: function scripts() {
		if (Zesk.page_scripts === null) {
			Zesk.scripts_init();
		}
		return Zesk.page_scripts;
	},
	scripts_cached: function scripts_cached(srcs) {
		Zesk.each(srcs, function () {
			Zesk.script_add(this);
		});
	},
	script_loaded: function script_loaded(src) {
		var scripts = Zesk.scripts(),
		    result = scripts[src] || scripts[Zesk.script_src_normalize(src)] || false;
		// Zesk.log("Zesk.script_loaded(" + src + ") = " + (result ? "true":
		// "false"));
		return result;
	},
	stylesheet_loaded: function stylesheet_loaded(href, media) {
		return $('link[rel="stylesheet"][href="' + href + '"][media="' + media + '"').length > 0;
	},
	message: function message(_message, options) {
		if (is_string(options)) {
			options = { level: options };
		}
		Zesk.hook("message", _message, options);
		Zesk.log(_message, options);
	},
	regexp_quote: function regexp_quote(str, delimiter) {
		return String(str).replace(new RegExp("[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\" + (delimiter || "") + "-]", "g"), "\\$&");
	}
});

Zesk.clone = function (object) {
	var clone, prop, Constructor;
	if (object === null) {
		return object;
	}
	if (is_function(object)) {
		return object;
	}
	if (is_array(object) || Zesk.gettype(object) === "arguments") {
		clone = [];
		for (var i = 0; i < object.length; i++) {
			clone.push(Zesk.clone(object[i]));
		}
		return clone;
	}
	if (!is_object(object)) {
		return object;
	}
	Constructor = object.constructor;
	switch (Constructor) {
		case RegExp:
			clone = new Constructor(object.source, "g".substr(0, Number(object.global)) + "i".substr(0, Number(object.ignoreCase)) + "m".substr(0, Number(object.multiline)));
			break;
		case Date:
			clone = new Constructor(object.getTime());
			break;
		default:
			// Can not copy unknown objects
			return object;
	}
	for (prop in object) {
		if (object.hasOwnProperty(prop)) {
			clone[prop] = Zesk.clone(object[prop]);
		}
	}
	return clone;
};

Object.assign(Array.prototype, {
	contains: function contains(x) {
		for (var i = 0; i < this.length; i++) {
			if (this[i] === x) {
				return true;
			}
		}
		return false;
	},
	remove: function remove(x) {
		var temp = this.slice(0);
		temp.splice(x, 1);
		return temp;
	},
	/**
  * Join elements of an array by wrapping each one with a prefix/suffix
  *
  * @param string
  *            prefix
  * @param string
  *            suffix
  * @return string
  */
	join_wrap: function join_wrap(prefix, suffix) {
		prefix = String(prefix) || "";
		suffix = String(suffix) || "";
		return prefix + this.join(suffix + prefix) + suffix;
	}
});

Object.assign(Object, {
	fromCamelCase: function fromCamelCase(from) {
		var to = {};
		for (var i in from) {
			if (from.hasOwnProperty(i)) {
				to[i.fromCamelCase()] = from[i];
			}
		}
		return to;
	},
	toCamelCase: function toCamelCase(from) {
		var to = {};
		for (var i in this) {
			if (from.hasOwnProperty(i)) {
				to[i.toCamelCase()] = from[i];
			}
		}
		return to;
	}
});
Zesk.map = function (string, object) {
	var case_insensitive = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

	var k,
	    suffix = "",
	    self;
	case_insensitive = !!case_insensitive; // Convert to bool
	if (!is_object(object)) {
		return string;
	}
	self = string;
	if (case_insensitive) {
		object = Zesk.change_key_case(object);
		suffix = "i";
	}
	for (k in object) {
		if (object.hasOwnProperty(k)) {
			var value = object[k],
			    replace = value === null ? "" : String(object[k]);
			self = self.replace(new RegExp("\\{" + k + "\\}", "g" + suffix), replace);
		}
	}
	return self;
};

Object.assign(String.prototype, {
	compare: function compare(a) {
		return this < a ? -1 : this === a ? 0 : 1;
	},
	left: function left(delim, def) {
		var pos = this.indexOf(delim);
		return pos < 0 ? avalue(arguments, 1, def || this) : this.substr(0, pos);
	},
	rleft: function rleft(delim, def) {
		var pos = this.lastIndexOf(delim);
		return pos < 0 ? avalue(arguments, 1, def || this) : this.substr(0, pos);
	},
	right: function right(delim, def) {
		var pos = this.indexOf(delim);
		return pos < 0 ? avalue(arguments, 1, def || this) : this.substr(pos + delim.length);
	},
	rright: function rright(delim, def) {
		var pos = this.lastIndexOf(delim);
		return pos < 0 ? avalue(arguments, 1, def || this) : this.substr(pos + delim.length);
	},
	ltrim: function ltrim() {
		return this.replace(/^\s+/, "");
	},
	rtrim: function rtrim() {
		return this.replace(/\s+$/, "");
	},
	trim: function trim() {
		return this.replace(/^\s+/, "").replace(/\s+$/, "");
	},
	/**
  * @deprecated
  * @param x
  *            String to look at
  */
	ends_with: function ends_with(x) {
		return this.ends(x);
	},
	ends: function ends(x) {
		var xn = x.length,
		    n = this.length;
		if (xn > n) {
			return false;
		}
		return this.substring(n - xn, n) === x;
	},
	beginsi: function beginsi(string) {
		var len = string.length;
		if (len > this.length) {
			return false;
		}
		return this.substr(0, len).toLowerCase() === string.toLowerCase();
	},
	begins: function begins(string) {
		var len = string.length;
		if (len > this.length) {
			return false;
		}
		return this.substr(0, len) === string;
	},
	str_replace: function str_replace(s, r) {
		var str = this;
		var i;
		if (is_string(s)) {
			if (is_string(r)) {
				return this.split(s).join(r);
			}
			for (i = 0; i < r.length; i++) {
				str = str.str_replace(s, r[i]);
			}
			return str;
		}
		if (is_string(r)) {
			for (i = 0; i < s.length; i++) {
				str = str.str_replace(s[i], r);
			}
			return str;
		}
		var n = Math.min(s.length, r.length);
		for (i = 0; i < n; i++) {
			str = str.str_replace(s[i], r[i]);
		}
		return str;
	},
	tr: function tr(object) {
		var k,
		    self = this;
		for (k in object) {
			if (object.hasOwnProperty(k)) {
				self = self.str_replace(k, object[k]);
			}
		}
		return self;
	},
	map: function map(object) {
		var case_insensitive = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

		return Zesk.map(this, object, case_insensitive);
	},
	to_array: function to_array() {
		var i,
		    r = [];
		for (i = 0; i < this.length; i++) {
			r.push(this.charAt(i));
		}
		return r;
	},
	unquote: function unquote() {
		var n = this.length;
		var q = arguments[0] || "\"\"''";
		var p = q.indexOf(this.substring(0, 1));
		if (p < 0) {
			return this;
		}
		if (this.substring(n - 1, n) === q.charAt(p + 1)) {
			return this.substring(1, n - 1);
		}
		return this;
	},
	toCamelCase: function toCamelCase() {
		var result = "";
		Zesk.each(this.split("_"), function () {
			result += this.substr(0, 1).toUpperCase() + this.substr(1).toLowerCase();
		});
		return result;
	},
	fromCamelCase: function fromCamelCase() {
		return this.replace(/[A-Z]/g, function (v) {
			return "_" + v.toLowerCase();
		});
	},
	unprefix: function unprefix(string, def) {
		if (this.begins(string)) {
			return this.substr(string.length);
		}
		return def || this;
	}
});
Object.assign(String.prototype, {
	ends: String.prototype.ends_with
});

Zesk.to_integer = function (x) {
	var d = arguments.length > 1 ? arguments[1] : null;
	x = parseInt(x, 10);
	if (typeof x === "number") {
		return x;
	}
	return d;
};

Zesk.to_list = to_list;

Zesk.to_float = function (x) {
	var d = arguments.length > 1 ? arguments[1] : null;
	x = parseFloat(x);
	if (typeof x === "number") {
		return x;
	}
	return d;
};

Zesk.to_string = function (x) {
	return x.toString();
};

Zesk.to_bool = to_bool;

Zesk.empty = function (v) {
	return typeof v === "undefined" || v === null || v === "";
};

Zesk.ZObject = function (options) {
	options = options || {};
	this.options = Zesk.change_key_case(Object.assign({}, options));
	// this.constructor.super.call(this);
};
Zesk.inherit(Zesk.ZObject, null, {
	clone: function clone() {
		return Zesk.clone(this);
	}
});

Zesk.change_key_case = function (me) {
	var k,
	    newo = {};
	for (k in me) {
		if (me.hasOwnProperty(k)) {
			newo[k.toLowerCase()] = me[k];
		}
	}
	return newo;
};

if (typeof Math.sign !== "function") {
	Math.sign = function (x) {
		return x ? x < 0 ? -1 : 1 : 0;
	};
}

// TODO What's this for?
Zesk.ajax_form = function () {
	var $form = $(this),
	    target = $form.attr("target"),
	    $target = $("#" + target);
	Zesk.log($target.html());
};

/*
 * Compatibility
 */
// if (!Object.prototype.keys) {
// 	Object.prototype.keys = function(obj) {
// 		var keys = [], k;
// 		for (k in obj) {
// 			if (Object.prototype.hasOwnProperty.call(obj, k)) {
// 				keys.push(k);
// 			}
// 		}
// 		return keys;
// 	};
// }

$.fn.equalheight = function (selector) {
	$(this).each(function () {
		var h = null;
		$(selector, $(this)).each(function () {
			h = Math.max($(this).height(), h);
		});
		$(selector, $(this)).each(function () {
			$(this).height(h + "px");
		});
	});
};

Zesk.inited = true;

$(document).ready(function () {
	Zesk.hook("document::ready");
});
$(window).on("load", function () {
	Zesk.hook("window::load");
});

module.exports = Zesk;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9aZXNrLmpzIl0sIm5hbWVzIjpbIiQiLCJyZXF1aXJlIiwiWmVzayIsImhvb2tzIiwiVyIsImdsb2JhbCIsIndpbmRvdyIsImQiLCJkb2N1bWVudCIsIkwiLCJsb2NhdGlvbiIsImdldHR5cGUiLCJ4IiwiT2JqZWN0IiwicHJvdG90eXBlIiwidG9TdHJpbmciLCJjYWxsIiwic3BsaXQiLCJ0b0xvd2VyQ2FzZSIsImF2YWx1ZSIsIm9iaiIsImkiLCJkZWYiLCJ1bmRlZmluZWQiLCJpc19ib29sIiwiYSIsImlzX251bWVyaWMiLCJpc19zdHJpbmciLCJpc19hcnJheSIsImlzX29iamVjdCIsImlzX2ludGVnZXIiLCJwYXJzZUludCIsImlzX2Z1bmN0aW9uIiwiaXNfZmxvYXQiLCJpc191cmwiLCJleGVjIiwidHJpbSIsImZsaXAiLCJvYmplY3QiLCJyZXN1bHQiLCJoYXNPd25Qcm9wZXJ0eSIsIlN0cmluZyIsImlzX2RhdGUiLCJpc19udW1iZXIiLCJ0b19saXN0IiwiZGVsaW0iLCJ0b19ib29sIiwiYXJndW1lbnRzIiwibGVuZ3RoIiwiY29udGFpbnMiLCJvYmplY3RfcGF0aCIsInBhdGgiLCJjdXJyIiwiayIsIm9iamVjdF9zZXRfcGF0aCIsInZhbHVlIiwic2VnIiwiaG9va19wYXRoIiwiaG9vayIsInB1c2giLCJhc3NpZ24iLCJzZXR0aW5ncyIsInciLCJ1cmxfcGFydHMiLCJwYXRobmFtZSIsImhvc3QiLCJxdWVyeSIsInNlYXJjaCIsInNjaGVtZSIsInByb3RvY29sIiwidXJsIiwiVVJMIiwidXJpIiwicGFnZV9zY3JpcHRzIiwicXVlcnlfZ2V0IiwidiIsInBhaXIiLCJ1IiwicmlnaHQiLCJjb29raWUiLCJuYW1lIiwib3B0aW9ucyIsImdldGNvb2tpZSIsIm4iLCJjIiwicyIsImxhc3RJbmRleE9mIiwiZSIsImluZGV4T2YiLCJ1bmVzY2FwZSIsInN1YnN0cmluZyIsInNldGNvb2tpZSIsIkRhdGUiLCJ0IiwidHRsIiwibSIsImRvbWFpbiIsInNldEZ1bGxZZWFyIiwic2V0VGltZSIsImdldFRpbWUiLCJlc2NhcGUiLCJ0b0dNVFN0cmluZyIsImRlbGV0ZV9jb29raWUiLCJkb20iLCJub3ciLCJjc3MiLCJwIiwiY3JlYXRlRWxlbWVudCIsInJlbCIsImhyZWYiLCJtZWRpYSIsImdldEVsZW1lbnRzQnlUYWdOYW1lIiwiYXBwZW5kQ2hpbGQiLCJsb2ciLCJjb25zb2xlIiwiYWRkX2hvb2siLCJmdW4iLCJoYXNfaG9vayIsImZ1bmNzIiwiYXJncyIsImNsb25lIiwicmVzdWx0cyIsInNoaWZ0IiwiYXBwbHkiLCJnZXRfcGF0aCIsInNldF9wYXRoIiwiZ2V0IiwiZ2V0YiIsInNldCIsIm92ZXJ3cml0ZSIsImluaGVyaXQiLCJ0aGVfY2xhc3MiLCJzdXBlcl9jbGFzcyIsIm1ldGhvZCIsIkNvbnN0cnVjdCIsImNvbnN0cnVjdG9yIiwiZWFjaCIsImZuIiwidGVybV9mYWxzZSIsInIiLCJ0cGwiLCJtaXhlZCIsIm1hcCIsImh0bWwiLCJzY3JpcHRfc3JjX25vcm1hbGl6ZSIsInNyYyIsIm1hdGNoZXMiLCJwYXJ0cyIsInVucHJlZml4IiwibWF0Y2giLCJzY3JpcHRzX2luaXQiLCJzY3JpcHRfYWRkIiwiYXR0ciIsInNjcmlwdHMiLCJzY3JpcHRzX2NhY2hlZCIsInNyY3MiLCJzY3JpcHRfbG9hZGVkIiwic3R5bGVzaGVldF9sb2FkZWQiLCJtZXNzYWdlIiwibGV2ZWwiLCJyZWdleHBfcXVvdGUiLCJzdHIiLCJkZWxpbWl0ZXIiLCJyZXBsYWNlIiwiUmVnRXhwIiwicHJvcCIsIkNvbnN0cnVjdG9yIiwic291cmNlIiwic3Vic3RyIiwiTnVtYmVyIiwiaWdub3JlQ2FzZSIsIm11bHRpbGluZSIsIkFycmF5IiwicmVtb3ZlIiwidGVtcCIsInNsaWNlIiwic3BsaWNlIiwiam9pbl93cmFwIiwicHJlZml4Iiwic3VmZml4Iiwiam9pbiIsImZyb21DYW1lbENhc2UiLCJmcm9tIiwidG8iLCJ0b0NhbWVsQ2FzZSIsInN0cmluZyIsImNhc2VfaW5zZW5zaXRpdmUiLCJzZWxmIiwiY2hhbmdlX2tleV9jYXNlIiwiY29tcGFyZSIsImxlZnQiLCJwb3MiLCJybGVmdCIsInJyaWdodCIsImx0cmltIiwicnRyaW0iLCJlbmRzX3dpdGgiLCJlbmRzIiwieG4iLCJiZWdpbnNpIiwibGVuIiwiYmVnaW5zIiwic3RyX3JlcGxhY2UiLCJNYXRoIiwibWluIiwidHIiLCJ0b19hcnJheSIsImNoYXJBdCIsInVucXVvdGUiLCJxIiwidG9VcHBlckNhc2UiLCJ0b19pbnRlZ2VyIiwidG9fZmxvYXQiLCJwYXJzZUZsb2F0IiwidG9fc3RyaW5nIiwiZW1wdHkiLCJaT2JqZWN0IiwibWUiLCJuZXdvIiwic2lnbiIsImFqYXhfZm9ybSIsIiRmb3JtIiwidGFyZ2V0IiwiJHRhcmdldCIsImVxdWFsaGVpZ2h0Iiwic2VsZWN0b3IiLCJoIiwibWF4IiwiaGVpZ2h0IiwiaW5pdGVkIiwicmVhZHkiLCJvbiIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTs7O0FBR0EsSUFBSUEsSUFBSUMsUUFBUSxRQUFSLENBQVI7O0FBRUEsSUFBSUMsT0FBTyxFQUFYO0FBQ0EsSUFBSUMsUUFBUSxFQUFaO0FBQ0EsSUFBSUMsSUFBSUMsT0FBT0MsTUFBUCxJQUFpQixFQUF6QjtBQUNBLElBQUlDLElBQUlILEVBQUVJLFFBQUYsSUFBYyxFQUF0QjtBQUNBLElBQUlDLElBQUlMLEVBQUVNLFFBQUYsSUFBYyxFQUF0Qjs7QUFFQSxTQUFTQyxPQUFULENBQWlCQyxDQUFqQixFQUFvQjtBQUNuQixLQUFJQSxNQUFNLElBQVYsRUFBZ0I7QUFDZixTQUFPLE1BQVA7QUFDQTtBQUNELFFBQU9DLE9BQU9DLFNBQVAsQ0FBaUJDLFFBQWpCLENBQ0xDLElBREssQ0FDQUosQ0FEQSxFQUVMSyxLQUZLLENBRUMsR0FGRCxFQUVNLENBRk4sRUFHTEEsS0FISyxDQUdDLEdBSEQsRUFHTSxDQUhOLEVBSUxDLFdBSkssRUFBUDtBQUtBOztBQUVELFNBQVNDLE1BQVQsQ0FBZ0JDLEdBQWhCLEVB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QUFSO0FBQ0FsTyxJQUFFaU8sUUFBRixFQUFZak8sRUFBRSxJQUFGLENBQVosRUFBcUJ3SSxJQUFyQixDQUEwQixZQUFXO0FBQ3BDMEYsT0FBSXZCLEtBQUt3QixHQUFMLENBQVNuTyxFQUFFLElBQUYsRUFBUW9PLE1BQVIsRUFBVCxFQUEyQkYsQ0FBM0IsQ0FBSjtBQUNBLEdBRkQ7QUFHQWxPLElBQUVpTyxRQUFGLEVBQVlqTyxFQUFFLElBQUYsQ0FBWixFQUFxQndJLElBQXJCLENBQTBCLFlBQVc7QUFDcEN4SSxLQUFFLElBQUYsRUFBUW9PLE1BQVIsQ0FBZUYsSUFBSSxJQUFuQjtBQUNBLEdBRkQ7QUFHQSxFQVJEO0FBU0EsQ0FWRDs7QUFZQWhPLEtBQUttTyxNQUFMLEdBQWMsSUFBZDs7QUFFQXJPLEVBQUVRLFFBQUYsRUFBWThOLEtBQVosQ0FBa0IsWUFBVztBQUM1QnBPLE1BQUt3RCxJQUFMLENBQVUsaUJBQVY7QUFDQSxDQUZEO0FBR0ExRCxFQUFFTSxNQUFGLEVBQVVpTyxFQUFWLENBQWEsTUFBYixFQUFxQixZQUFXO0FBQy9Cck8sTUFBS3dELElBQUwsQ0FBVSxjQUFWO0FBQ0EsQ0FGRDs7QUFJQThLLE9BQU9DLE9BQVAsR0FBaUJ2TyxJQUFqQiIsImZpbGUiOiJaZXNrLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgJmNvcHk7IDIwMTcgTWFya2V0IEFjdW1lbiwgSW5jLlxuICovXG52YXIgJCA9IHJlcXVpcmUoXCJqcXVlcnlcIik7XG5cbnZhciBaZXNrID0ge307XG52YXIgaG9va3MgPSB7fTtcbnZhciBXID0gZ2xvYmFsLndpbmRvdyB8fCB7fTtcbnZhciBkID0gVy5kb2N1bWVudCB8fCB7fTtcbnZhciBMID0gVy5sb2NhdGlvbiB8fCB7fTtcblxuZnVuY3Rpb24gZ2V0dHlwZSh4KSB7XG5cdGlmICh4ID09PSBudWxsKSB7XG5cdFx0cmV0dXJuIFwibnVsbFwiO1xuXHR9XG5cdHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nXG5cdFx0LmNhbGwoeClcblx0XHQuc3BsaXQoXCIgXCIpWzFdXG5cdFx0LnNwbGl0KFwiXVwiKVswXVxuXHRcdC50b0xvd2VyQ2FzZSgpO1xufVxuXG5mdW5jdGlvbiBhdmFsdWUob2JqLCBpLCBkZWYpIHtcblx0aWYgKGRlZiA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0ZGVmID0gbnVsbDtcblx0fVxuXHRpZiAodHlwZW9mIG9iaiA9PT0gXCJvYmplY3RcIikge1xuXHRcdGlmICh0eXBlb2Ygb2JqW2ldICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cdFx0XHRyZXR1cm4gb2JqW2ldO1xuXHRcdH1cblx0XHRyZXR1cm4gZGVmO1xuXHR9XG5cdHJldHVybiBkZWY7XG59XG5aZXNrLmF2YWx1ZSA9IGF2YWx1ZTtcblxuZnVuY3Rpb24gaXNfYm9vbChhKSB7XG5cdHJldHVybiBnZXR0eXBlKGEpID09PSBcImJvb2xlYW5cIjtcbn1cbmZ1bmN0aW9uIGlzX251bWVyaWMoYSkge1xuXHRyZXR1cm4gZ2V0dHlwZShhKSA9PT0gXCJudW1iZXJcIjtcbn1cbmZ1bmN0aW9uIGlzX3N0cmluZyhhKSB7XG5cdHJldHVybiBnZXR0eXBlKGEpID09PSBcInN0cmluZ1wiO1xufVxuZnVuY3Rpb24gaXNfYXJyYXkoYSkge1xuXHRyZXR1cm4gZ2V0dHlwZShhKSA9PT0gXCJhcnJheVwiO1xufVxuZnVuY3Rpb24gaXNfb2JqZWN0KGEpIHtcblx0cmV0dXJuIGdldHR5cGUoYSkgPT09IFwib2JqZWN0XCI7XG59XG5mdW5jdGlvbiBpc19pbnRlZ2VyKGEpIHtcblx0cmV0dXJuIGlzX251bWVyaWMoYSkgJiYgcGFyc2VJbnQoYSwgMTApID09PSBhO1xufVxuZnVuY3Rpb24gaXNfZnVuY3Rpb24oYSkge1xuXHRyZXR1cm4gZ2V0dHlwZShhKSA9PT0gXCJmdW5jdGlvblwiO1xufVxuZnVuY3Rpb24gaXNfZmxvYXQoYSkge1xuXHRyZXR1cm4gdHlwZW9mIGEgPT09IFwibnVtYmVyXCIgJiYgcGFyc2VJbnQoYSwgMTApICE9PSBhO1xufVxuZnVuY3Rpb24gaXNfdXJsKHgpIHtcblx0cmV0dXJuIC9eaHR0cDpcXC9cXC8uK3xeaHR0cHM6XFwvXFwvLit8Xm1haWx0bzouK0AuK3xeZnRwOlxcL1xcLy4rfF5maWxlOlxcL1xcLy4rfF5uZXdzOlxcL1xcLy4rLy5leGVjKFxuXHRcdHgudG9Mb3dlckNhc2UoKS50cmltKClcblx0KTtcbn1cblxuWmVzay5mbGlwID0gZnVuY3Rpb24ob2JqZWN0KSB7XG5cdHZhciBpLFxuXHRcdHJlc3VsdCA9IHt9O1xuXHRmb3IgKGkgaW4gb2JqZWN0KSB7XG5cdFx0aWYgKG9iamVjdC5oYXNPd25Qcm9wZXJ0eShpKSkge1xuXHRcdFx0cmVzdWx0W1N0cmluZyhvYmplY3RbaV0pXSA9IGk7XG5cdFx0fVxuXHR9XG5cdHJldHVybiByZXN1bHQ7XG59O1xuXG4vKiBLZXJuZWwgKi9cblxuWmVzay5pc19kYXRlID0gZnVuY3Rpb24oYSkge1xuXHRyZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGEpID09PSBcIltvYmplY3QgRGF0ZV1cIjtcbn07XG5cblplc2suZ2V0dHlwZSA9IGdldHR5cGU7XG5cblplc2suaXNfYXJyYXkgPSBpc19hcnJheTtcblplc2suaXNfb2JqZWN0ID0gaXNfb2JqZWN0O1xuWmVzay5pc19hcnJheSA9IGlzX2FycmF5O1xuWmVzay5pc19udW1iZXIgPSBpc19udW1lcmljO1xuWmVzay5pc19udW1lcmljID0gaXNfbnVtZXJpYztcblplc2suaXNfYm9vbCA9IGlzX2Jvb2w7XG5aZXNrLmlzX3N0cmluZyA9IGlzX3N0cmluZztcblplc2suaXNfaW50ZWdlciA9IGlzX2ludGVnZXI7XG5aZXNrLmlzX2Z1bmN0aW9uID0gaXNfZnVuY3Rpb247XG5aZXNrLmlzX2Zsb2F0ID0gaXNfZmxvYXQ7XG5aZXNrLmlzX3VybCA9IGlzX3VybDtcblxuZnVuY3Rpb24gdG9fbGlzdCh4LCBkZWYsIGRlbGltKSB7XG5cdGRlZiA9IGRlZiB8fCBbXTtcblx0ZGVsaW0gPSBkZWxpbSB8fCBcIi5cIjtcblx0aWYgKGlzX2FycmF5KHgpKSB7XG5cdFx0cmV0dXJuIHg7XG5cdH1cblx0aWYgKHggPT09IG51bGwpIHtcblx0XHRyZXR1cm4gZGVmO1xuXHR9XG5cdHJldHVybiB4LnRvU3RyaW5nKCkuc3BsaXQoZGVsaW0pO1xufVxuXG5mdW5jdGlvbiB0b19ib29sKHgpIHtcblx0dmFyIGQgPSBhcmd1bWVudHMubGVuZ3RoID4gMSA/IGFyZ3VtZW50c1sxXSA6IGZhbHNlO1xuXHRpZiAoaXNfYm9vbCh4KSkge1xuXHRcdHJldHVybiB4O1xuXHR9XG5cdGlmIChpc19udW1lcmljKHgpKSB7XG5cdFx0cmV0dXJuIHBhcnNlSW50KHgsIDEwKSAhPT0gMDtcblx0fVxuXHRpZiAoaXNfc3RyaW5nKHgpKSB7XG5cdFx0aWYgKFtcInRcIiwgXCJ0cnVlXCIsIFwiMVwiLCBcImVuYWJsZWRcIiwgXCJ5XCIsIFwieWVzXCJdLmNvbnRhaW5zKHgpKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdFx0aWYgKFtcImZcIiwgXCJmYWxzZVwiLCBcIjBcIiwgXCJkaXNhYmxlZFwiLCBcIm5cIiwgXCJub1wiXS5jb250YWlucyh4KSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gZDtcbn1cblxuZnVuY3Rpb24gb2JqZWN0X3BhdGgob2JqZWN0LCBwYXRoLCBkZWYpIHtcblx0dmFyIGN1cnIgPSBvYmplY3QsXG5cdFx0aztcblx0cGF0aCA9IHRvX2xpc3QocGF0aCwgW10sIFwiLlwiKTtcblx0Zm9yIChrID0gMDsgayA8IHBhdGgubGVuZ3RoOyBrKyspIHtcblx0XHRpZiAoayA9PT0gcGF0aC5sZW5ndGggLSAxKSB7XG5cdFx0XHRyZXR1cm4gYXZhbHVlKGN1cnIsIHBhdGhba10sIGRlZik7XG5cdFx0fVxuXHRcdGN1cnIgPSBhdmFsdWUoY3VyciwgcGF0aFtrXSk7XG5cdFx0aWYgKGN1cnIgPT09IG51bGwpIHtcblx0XHRcdHJldHVybiBkZWY7XG5cdFx0fVxuXHRcdGlmICghaXNfb2JqZWN0KGN1cnIpKSB7XG5cdFx0XHRyZXR1cm4gZGVmO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gY3Vycjtcbn1cblxuZnVuY3Rpb24gb2JqZWN0X3NldF9wYXRoKG9iamVjdCwgcGF0aCwgdmFsdWUpIHtcblx0dmFyIGN1cnIgPSBvYmplY3QsXG5cdFx0ayxcblx0XHRzZWc7XG5cdHBhdGggPSB0b19saXN0KHBhdGgsIFtdLCBcIi5cIik7XG5cdGZvciAoayA9IDA7IGsgPCBwYXRoLmxlbmd0aDsgaysrKSB7XG5cdFx0c2VnID0gcGF0aFtrXTtcblx0XHRpZiAodHlwZW9mIGN1cnJbc2VnXSA9PT0gXCJvYmplY3RcIikge1xuXHRcdFx0Y3VyciA9IGN1cnJbc2VnXTtcblx0XHR9IGVsc2UgaWYgKGsgPT09IHBhdGgubGVuZ3RoIC0gMSkge1xuXHRcdFx0Y3VycltzZWddID0gdmFsdWU7XG5cdFx0XHRicmVhaztcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y3VycltzZWddID0ge307XG5cdFx0XHRjdXJyID0gY3VycltzZWddO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gb2JqZWN0O1xufVxuXG5aZXNrLm9iamVjdF9wYXRoID0gb2JqZWN0X3BhdGg7XG5aZXNrLm9iamVjdF9zZXRfcGF0aCA9IG9iamVjdF9zZXRfcGF0aDtcblxuZnVuY3Rpb24gaG9va19wYXRoKGhvb2spIHtcblx0aG9vayA9IFN0cmluZyhob29rKS50b0xvd2VyQ2FzZSgpO1xuXHRob29rID0gdG9fbGlzdChob29rLCBbXSwgXCI6OlwiKTtcblx0aWYgKGhvb2subGVuZ3RoID09PSAxKSB7XG5cdFx0aG9vay5wdXNoKFwiKlwiKTtcblx0fVxuXHRyZXR1cm4gaG9vaztcbn1cblxuT2JqZWN0LmFzc2lnbihaZXNrLCB7XG5cdGQ6IGQsXG5cdHNldHRpbmdzOiB7fSwgLy8gUGxhY2UgbW9kdWxlIGRhdGEgaGVyZSFcblx0aG9va3M6IGhvb2tzLCAvLyBNb2R1bGUgaG9va3MgZ28gaGVyZSAtIHVzZSBhZGRfaG9vayBhbmQgaG9vayB0byB1c2Vcblx0dzogVyxcblx0dXJsX3BhcnRzOiB7XG5cdFx0cGF0aDogTC5wYXRobmFtZSxcblx0XHRob3N0OiBMLmhvc3QsXG5cdFx0cXVlcnk6IEwuc2VhcmNoLFxuXHRcdHNjaGVtZTogTC5wcm90b2NvbCxcblx0XHR1cmw6IGQuVVJMLFxuXHRcdHVyaTogTC5wYXRobmFtZSArIEwuc2VhcmNoLFxuXHR9LFxuXHRwYWdlX3NjcmlwdHM6IG51bGwsXG5cdHF1ZXJ5X2dldDogZnVuY3Rpb24odiwgZGVmKSB7XG5cdFx0ZGVmID0gZGVmIHx8IG51bGw7XG5cdFx0dmFyIHBhaXIsXG5cdFx0XHRpLFxuXHRcdFx0dSA9IGQuVVJMLnRvU3RyaW5nKCkucmlnaHQoXCI/XCIsIG51bGwpO1xuXHRcdGlmICghdSkge1xuXHRcdFx0cmV0dXJuIGRlZjtcblx0XHR9XG5cdFx0dSA9IHUuc3BsaXQoXCImXCIpO1xuXHRcdGZvciAoaSA9IDA7IGkgPCB1Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRwYWlyID0gdVtpXS5zcGxpdChcIj1cIiwgMik7XG5cdFx0XHRpZiAocGFpclswXSA9PT0gdikge1xuXHRcdFx0XHRyZXR1cm4gcGFpclsxXSB8fCBwYWlyWzBdO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gZGVmO1xuXHR9LFxuXHQvKipcblx0ICogQHBhcmFtIG5hbWUgc3RyaW5nIE5hbWUgb2YgY29va2llIHRvIHNldC9nZXRcblx0ICogQHBhcmFtIHZhbHVlIHN0cmluZyBWYWx1ZSBvZiBjb29raWUgdG8gc2V0XG5cdCAqIEBwYXJhbSBvcHRpb25zIG9iamVjdCBFeHRyYSBvcHRpb25zOiB0dGw6IGludGVnZXIgKHNlY29uZHMpLCBkb21haW46IHN0cmluZ1xuXHQgKi9cblx0Y29va2llOiBmdW5jdGlvbihuYW1lLCB2YWx1ZSwgb3B0aW9ucykge1xuXHRcdHZhciBnZXRjb29raWUgPSBmdW5jdGlvbihuKSB7XG5cdFx0XHRcdHZhciBjID0gZC5jb29raWU7XG5cdFx0XHRcdHZhciBzID0gYy5sYXN0SW5kZXhPZihuICsgXCI9XCIpO1xuXHRcdFx0XHRpZiAocyA8IDApIHtcblx0XHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdFx0fVxuXHRcdFx0XHRzICs9IG4ubGVuZ3RoICsgMTtcblx0XHRcdFx0dmFyIGUgPSBjLmluZGV4T2YoXCI7XCIsIHMpO1xuXHRcdFx0XHRpZiAoZSA8IDApIHtcblx0XHRcdFx0XHRlID0gYy5sZW5ndGg7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIFcudW5lc2NhcGUoYy5zdWJzdHJpbmcocywgZSkpO1xuXHRcdFx0fSxcblx0XHRcdHNldGNvb2tpZSA9IGZ1bmN0aW9uKG4sIHYsIG9wdGlvbnMpIHtcblx0XHRcdFx0dmFyIGEgPSBuZXcgRGF0ZSgpLFxuXHRcdFx0XHRcdHQgPSBwYXJzZUludChvcHRpb25zLnR0bCwgMTApIHx8IC0xLFxuXHRcdFx0XHRcdG0gPSBvcHRpb25zLmRvbWFpbiB8fCBudWxsO1xuXHRcdFx0XHRpZiAodCA8PSAwKSB7XG5cdFx0XHRcdFx0YS5zZXRGdWxsWWVhcigyMDMwKTtcblx0XHRcdFx0fSBlbHNlIGlmICh0ID4gMCkge1xuXHRcdFx0XHRcdGEuc2V0VGltZShhLmdldFRpbWUoKSArIHQgKiAxMDAwKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRkLmNvb2tpZSA9IG4gKyBcIj1cIiArIFcuZXNjYXBlKHYpICsgXCI7IHBhdGg9LzsgZXhwaXJlcz1cIiArIGEudG9HTVRTdHJpbmcoKSArIChtID8gXCI7IGRvbWFpbj1cIiArIG0gOiBcIlwiKTtcblx0XHRcdFx0cmV0dXJuIHY7XG5cdFx0XHR9LFxuXHRcdFx0ZGVsZXRlX2Nvb2tpZSA9IGZ1bmN0aW9uKG5hbWUsIGRvbSkge1xuXHRcdFx0XHR2YXIgbm93ID0gbmV3IERhdGUoKSxcblx0XHRcdFx0XHRlID0gbmV3IERhdGUobm93LmdldFRpbWUoKSAtIDg2NDAwKTtcblx0XHRcdFx0ZC5jb29raWUgPSBuYW1lICsgXCI9OyBwYXRoPS87IGV4cGlyZXM9XCIgKyBlLnRvR01UU3RyaW5nKCkgKyAoZG9tID8gXCI7IGRvbWFpbj1cIiArIGRvbSA6IFwiXCIpO1xuXHRcdFx0fTtcblx0XHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblx0XHRpZiAodmFsdWUgPT09IG51bGwpIHtcblx0XHRcdGRlbGV0ZV9jb29raWUobmFtZSwgb3B0aW9ucy5kb20gfHwgbnVsbCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHJldHVybiBhcmd1bWVudHMubGVuZ3RoID09PSAxID8gZ2V0Y29va2llKG5hbWUpIDogc2V0Y29va2llKG5hbWUsIHZhbHVlLCBvcHRpb25zKTtcblx0fSxcblx0Y3NzOiBmdW5jdGlvbihwKSB7XG5cdFx0dmFyIGNzcyA9IGQuY3JlYXRlRWxlbWVudChcImxpbmtcIik7XG5cdFx0Y3NzLnJlbCA9IFwic3R5bGVzaGVldFwiO1xuXHRcdGNzcy5ocmVmID0gcDtcblx0XHRjc3MubWVkaWEgPSBhcmd1bWVudHNbMV0gfHwgXCJhbGxcIjtcblx0XHRkLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaGVhZFwiKVswXS5hcHBlbmRDaGlsZChjc3MpO1xuXHR9LFxuXHRsb2c6IGZ1bmN0aW9uKCkge1xuXHRcdGlmIChXLmNvbnNvbGUgJiYgVy5jb25zb2xlLmxvZykge1xuXHRcdFx0Vy5jb25zb2xlLmxvZyhhcmd1bWVudHMpO1xuXHRcdH1cblx0fSxcblx0YWRkX2hvb2s6IGZ1bmN0aW9uKGhvb2ssIGZ1bikge1xuXHRcdHZhciBwYXRoID0gaG9va19wYXRoKGhvb2spLFxuXHRcdFx0Y3VyciA9IG9iamVjdF9wYXRoKGhvb2tzLCBwYXRoKTtcblx0XHRpZiAoY3Vycikge1xuXHRcdFx0Y3Vyci5wdXNoKGZ1bik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGN1cnIgPSBbZnVuXTtcblx0XHRcdG9iamVjdF9zZXRfcGF0aChob29rcywgcGF0aCwgY3Vycik7XG5cdFx0fVxuXHR9LFxuXHRoYXNfaG9vazogZnVuY3Rpb24oaG9vaykge1xuXHRcdHZhciBmdW5jcyA9IG9iamVjdF9wYXRoKGhvb2tzLCBob29rX3BhdGgoaG9vayksIG51bGwpO1xuXHRcdHJldHVybiBmdW5jcyA/IHRydWUgOiBmYWxzZTtcblx0fSxcblx0aG9vazogZnVuY3Rpb24oaG9vaykge1xuXHRcdHZhciBwYXRoID0gaG9va19wYXRoKGhvb2spLFxuXHRcdFx0YXJncyA9IFplc2suY2xvbmUoYXJndW1lbnRzKSxcblx0XHRcdGZ1bmNzID0gb2JqZWN0X3BhdGgoaG9va3MsIHBhdGgsIG51bGwpLFxuXHRcdFx0cmVzdWx0cyA9IFtdLFxuXHRcdFx0aTtcblx0XHRpZiAoIWZ1bmNzKSB7XG5cdFx0XHRyZXR1cm4gcmVzdWx0cztcblx0XHR9XG5cdFx0aWYgKGFyZ3MubGVuZ3RoID4gMSkge1xuXHRcdFx0YXJncy5zaGlmdCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRhcmdzID0gW107XG5cdFx0fVxuXG5cdFx0Zm9yIChpID0gMDsgaSA8IGZ1bmNzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRyZXN1bHRzLnB1c2goZnVuY3NbaV0uYXBwbHkobnVsbCwgYXJncykpO1xuXHRcdH1cblx0XHRyZXR1cm4gcmVzdWx0cztcblx0fSxcblx0Z2V0X3BhdGg6IGZ1bmN0aW9uKHBhdGgsIGRlZikge1xuXHRcdHJldHVybiBvYmplY3RfcGF0aChaZXNrLnNldHRpbmdzLCBwYXRoLCBkZWYpO1xuXHR9LFxuXHRzZXRfcGF0aDogZnVuY3Rpb24ocGF0aCwgdmFsdWUpIHtcblx0XHRyZXR1cm4gb2JqZWN0X3NldF9wYXRoKFplc2suc2V0dGluZ3MsIHBhdGgsIHZhbHVlKTtcblx0fSxcblx0Z2V0OiBmdW5jdGlvbihuKSB7XG5cdFx0dmFyIGEgPSBhcmd1bWVudHM7XG5cdFx0cmV0dXJuIGF2YWx1ZShaZXNrLnNldHRpbmdzLCBuLCBhLmxlbmd0aCA+IDEgPyBhWzFdIDogbnVsbCk7XG5cdH0sXG5cdGdldGI6IGZ1bmN0aW9uKG4pIHtcblx0XHR2YXIgYSA9IGFyZ3VtZW50cyxcblx0XHRcdGQgPSBhLmxlbmd0aCA+IDEgPyBhWzFdIDogZmFsc2U7XG5cdFx0cmV0dXJuIHRvX2Jvb2woWmVzay5nZXQobiwgZCkpO1xuXHR9LFxuXHRzZXQ6IGZ1bmN0aW9uKG4sIHYpIHtcblx0XHR2YXIgYSA9IGFyZ3VtZW50cyxcblx0XHRcdG92ZXJ3cml0ZSA9IGEubGVuZ3RoID4gMiA/IHRvX2Jvb2woYVsyXSkgOiB0cnVlO1xuXHRcdGlmICghb3ZlcndyaXRlICYmIHR5cGVvZiBaZXNrLnNldHRpbmdzW25dICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cdFx0XHRyZXR1cm4gWmVzay5zZXR0aW5nc1tuXTtcblx0XHR9XG5cdFx0WmVzay5zZXR0aW5nc1tuXSA9IHY7XG5cdFx0cmV0dXJuIHY7XG5cdH0sXG5cdGluaGVyaXQ6IGZ1bmN0aW9uKHRoZV9jbGFzcywgc3VwZXJfY2xhc3MsIHByb3RvdHlwZSkge1xuXHRcdC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTExNDAyNC9jb25zdHJ1Y3RvcnMtaW4tamF2YXNjcmlwdC1vYmplY3RzXG5cdFx0dmFyIG1ldGhvZCxcblx0XHRcdENvbnN0cnVjdCA9IGZ1bmN0aW9uKCkge307XG5cdFx0c3VwZXJfY2xhc3MgPSBzdXBlcl9jbGFzcyB8fCBPYmplY3Q7XG5cdFx0Q29uc3RydWN0LnByb3RvdHlwZSA9IHN1cGVyX2NsYXNzLnByb3RvdHlwZTtcblx0XHR0aGVfY2xhc3MucHJvdG90eXBlID0gbmV3IENvbnN0cnVjdCgpO1xuXHRcdHRoZV9jbGFzcy5wcm90b3R5cGUuY29uc3RydWN0b3IgPSB0aGVfY2xhc3M7XG5cdFx0dGhlX2NsYXNzW1wic3VwZXJcIl0gPSBzdXBlcl9jbGFzcztcblx0XHRpZiAocHJvdG90eXBlIGluc3RhbmNlb2YgT2JqZWN0KSB7XG5cdFx0XHRmb3IgKG1ldGhvZCBpbiBwcm90b3R5cGUpIHtcblx0XHRcdFx0aWYgKHByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eShtZXRob2QpKSB7XG5cdFx0XHRcdFx0aWYgKCF0aGVfY2xhc3MucHJvdG90eXBlW21ldGhvZF0pIHtcblx0XHRcdFx0XHRcdHRoZV9jbGFzcy5wcm90b3R5cGVbbWV0aG9kXSA9IHByb3RvdHlwZVttZXRob2RdO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHR0aGVfY2xhc3MucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gWmVzay5jbG9uZSh0aGlzKTtcblx0XHR9O1xuXHRcdHJldHVybiB0aGVfY2xhc3M7XG5cdH0sXG5cdC8qKlxuXHQgKiBJdGVyYXRlIG92ZXIgYW4gb2JqZWN0LCBjYWxsaW5nIGEgZnVuY3Rpb24gb25jZSBwZXIgZWxlbWVudFxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdHxhcnJheX0geFxuXHQgKiBAcGFyYW0ge2Z1bmN0aW9ufSBmbiB3aXRoIHNpZ25hdHVyZSAoa2V5LCB2YWx1ZSwgY29sbGVjdGlvbikgXCJ0aGlzXCIgaXMgc2V0IHRvIHRoZSB2YWx1ZSBhcyB3ZWxsXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gdGVybV9mYWxzZSBTZXQgdG8gdHJ1ZSB0byB0ZXJtaW5hdGUgd2hlbiBmdW5jdGlvbiByZXR1cm5zIGEgZmFsc2UtaXNoIHZhbHVlIGFzIG9wcG9zZWQgdG8gYSB0cnVlLWlzaCB2YWx1ZVxuXHQgKi9cblx0ZWFjaDogZnVuY3Rpb24oeCwgZm4sIHRlcm1fZmFsc2UpIHtcblx0XHR2YXIgaSwgcjtcblx0XHR0ZXJtX2ZhbHNlID0gdG9fYm9vbCh0ZXJtX2ZhbHNlKTtcblx0XHRpZiAoaXNfYXJyYXkoeCkpIHtcblx0XHRcdGZvciAoaSA9IDA7IGkgPCB4Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdHIgPSBmbi5jYWxsKHhbaV0sIGksIHhbaV0sIHgpO1xuXHRcdFx0XHRpZiAodGVybV9mYWxzZSkge1xuXHRcdFx0XHRcdGlmICghcikge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHI7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2UgaWYgKHIpIHtcblx0XHRcdFx0XHRyZXR1cm4gcjtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAoaXNfb2JqZWN0KHgpKSB7XG5cdFx0XHRmb3IgKGkgaW4geCkge1xuXHRcdFx0XHRpZiAoeC5oYXNPd25Qcm9wZXJ0eShpKSkge1xuXHRcdFx0XHRcdHIgPSBmbi5jYWxsKHhbaV0sIGksIHhbaV0sIHgpO1xuXHRcdFx0XHRcdGlmICh0ZXJtX2ZhbHNlKSB7XG5cdFx0XHRcdFx0XHRpZiAoIXIpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHI7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSBlbHNlIGlmIChyKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gcjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIGZuLmNhbGwoeCwgMCwgeCwgeCk7XG5cdFx0fVxuXHR9LFxuXHR0cGw6IGZ1bmN0aW9uKG1peGVkLCBtYXApIHtcblx0XHRyZXR1cm4gJChtaXhlZClcblx0XHRcdC5odG1sKClcblx0XHRcdC5tYXAobWFwLCBmYWxzZSk7XG5cdH0sXG5cdHNjcmlwdF9zcmNfbm9ybWFsaXplOiBmdW5jdGlvbihzcmMpIHtcblx0XHR2YXIgbWF0Y2hlcyxcblx0XHRcdHBhcnRzID0gWmVzay51cmxfcGFydHM7XG5cdFx0c3JjID0gc3JjLnVucHJlZml4KHBhcnRzLnNjaGVtZSArIFwiOi8vXCIgKyBwYXJ0cy5ob3N0KTtcblx0XHRtYXRjaGVzID0gc3JjLm1hdGNoKC8oLiopXFw/X3Zlcj1bMC05XSskLyk7XG5cdFx0aWYgKG1hdGNoZXMgIT09IG51bGwpIHtcblx0XHRcdHNyYyA9IG1hdGNoZXNbMV07XG5cdFx0fVxuXHRcdHJldHVybiBzcmM7XG5cdH0sXG5cdHNjcmlwdHNfaW5pdDogZnVuY3Rpb24oKSB7XG5cdFx0WmVzay5wYWdlX3NjcmlwdHMgPSB7fTtcblx0XHQkKCdzY3JpcHRbdHlwZT1cInRleHQvamF2YXNjcmlwdFwiXVtzcmNdJykuZWFjaChmdW5jdGlvbigpIHtcblx0XHRcdFplc2suc2NyaXB0X2FkZCgkKHRoaXMpLmF0dHIoXCJzcmNcIikpO1xuXHRcdH0pO1xuXHR9LFxuXHRzY3JpcHRfYWRkOiBmdW5jdGlvbihzcmMpIHtcblx0XHRpZiAoWmVzay5wYWdlX3NjcmlwdHMgPT09IG51bGwpIHtcblx0XHRcdFplc2suc2NyaXB0c19pbml0KCk7XG5cdFx0fVxuXHRcdFplc2sucGFnZV9zY3JpcHRzW3NyY10gPSB0cnVlO1xuXHRcdFplc2sucGFnZV9zY3JpcHRzW1plc2suc2NyaXB0X3NyY19ub3JtYWxpemUoc3JjKV0gPSB0cnVlO1xuXHR9LFxuXHRzY3JpcHRzOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoWmVzay5wYWdlX3NjcmlwdHMgPT09IG51bGwpIHtcblx0XHRcdFplc2suc2NyaXB0c19pbml0KCk7XG5cdFx0fVxuXHRcdHJldHVybiBaZXNrLnBhZ2Vfc2NyaXB0cztcblx0fSxcblx0c2NyaXB0c19jYWNoZWQ6IGZ1bmN0aW9uKHNyY3MpIHtcblx0XHRaZXNrLmVhY2goc3JjcywgZnVuY3Rpb24oKSB7XG5cdFx0XHRaZXNrLnNjcmlwdF9hZGQodGhpcyk7XG5cdFx0fSk7XG5cdH0sXG5cdHNjcmlwdF9sb2FkZWQ6IGZ1bmN0aW9uKHNyYykge1xuXHRcdHZhciBzY3JpcHRzID0gWmVzay5zY3JpcHRzKCksXG5cdFx0XHRyZXN1bHQgPSBzY3JpcHRzW3NyY10gfHwgc2NyaXB0c1taZXNrLnNjcmlwdF9zcmNfbm9ybWFsaXplKHNyYyldIHx8IGZhbHNlO1xuXHRcdC8vIFplc2subG9nKFwiWmVzay5zY3JpcHRfbG9hZGVkKFwiICsgc3JjICsgXCIpID0gXCIgKyAocmVzdWx0ID8gXCJ0cnVlXCI6XG5cdFx0Ly8gXCJmYWxzZVwiKSk7XG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fSxcblx0c3R5bGVzaGVldF9sb2FkZWQ6IGZ1bmN0aW9uKGhyZWYsIG1lZGlhKSB7XG5cdFx0cmV0dXJuICQoJ2xpbmtbcmVsPVwic3R5bGVzaGVldFwiXVtocmVmPVwiJyArIGhyZWYgKyAnXCJdW21lZGlhPVwiJyArIG1lZGlhICsgJ1wiJykubGVuZ3RoID4gMDtcblx0fSxcblx0bWVzc2FnZTogZnVuY3Rpb24obWVzc2FnZSwgb3B0aW9ucykge1xuXHRcdGlmIChpc19zdHJpbmcob3B0aW9ucykpIHtcblx0XHRcdG9wdGlvbnMgPSB7IGxldmVsOiBvcHRpb25zIH07XG5cdFx0fVxuXHRcdFplc2suaG9vayhcIm1lc3NhZ2VcIiwgbWVzc2FnZSwgb3B0aW9ucyk7XG5cdFx0WmVzay5sb2cobWVzc2FnZSwgb3B0aW9ucyk7XG5cdH0sXG5cdHJlZ2V4cF9xdW90ZTogZnVuY3Rpb24oc3RyLCBkZWxpbWl0ZXIpIHtcblx0XHRyZXR1cm4gU3RyaW5nKHN0cikucmVwbGFjZShcblx0XHRcdG5ldyBSZWdFeHAoXCJbLlxcXFxcXFxcKyo/XFxcXFtcXFxcXlxcXFxdJCgpe309ITw+fDpcXFxcXCIgKyAoZGVsaW1pdGVyIHx8IFwiXCIpICsgXCItXVwiLCBcImdcIiksXG5cdFx0XHRcIlxcXFwkJlwiXG5cdFx0KTtcblx0fSxcbn0pO1xuXG5aZXNrLmNsb25lID0gZnVuY3Rpb24ob2JqZWN0KSB7XG5cdHZhciBjbG9uZSwgcHJvcCwgQ29uc3RydWN0b3I7XG5cdGlmIChvYmplY3QgPT09IG51bGwpIHtcblx0XHRyZXR1cm4gb2JqZWN0O1xuXHR9XG5cdGlmIChpc19mdW5jdGlvbihvYmplY3QpKSB7XG5cdFx0cmV0dXJuIG9iamVjdDtcblx0fVxuXHRpZiAoaXNfYXJyYXkob2JqZWN0KSB8fCBaZXNrLmdldHR5cGUob2JqZWN0KSA9PT0gXCJhcmd1bWVudHNcIikge1xuXHRcdGNsb25lID0gW107XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBvYmplY3QubGVuZ3RoOyBpKyspIHtcblx0XHRcdGNsb25lLnB1c2goWmVzay5jbG9uZShvYmplY3RbaV0pKTtcblx0XHR9XG5cdFx0cmV0dXJuIGNsb25lO1xuXHR9XG5cdGlmICghaXNfb2JqZWN0KG9iamVjdCkpIHtcblx0XHRyZXR1cm4gb2JqZWN0O1xuXHR9XG5cdENvbnN0cnVjdG9yID0gb2JqZWN0LmNvbnN0cnVjdG9yO1xuXHRzd2l0Y2ggKENvbnN0cnVjdG9yKSB7XG5cdFx0Y2FzZSBSZWdFeHA6XG5cdFx0XHRjbG9uZSA9IG5ldyBDb25zdHJ1Y3Rvcihcblx0XHRcdFx0b2JqZWN0LnNvdXJjZSxcblx0XHRcdFx0XCJnXCIuc3Vic3RyKDAsIE51bWJlcihvYmplY3QuZ2xvYmFsKSkgK1xuXHRcdFx0XHRcdFwiaVwiLnN1YnN0cigwLCBOdW1iZXIob2JqZWN0Lmlnbm9yZUNhc2UpKSArXG5cdFx0XHRcdFx0XCJtXCIuc3Vic3RyKDAsIE51bWJlcihvYmplY3QubXVsdGlsaW5lKSlcblx0XHRcdCk7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlIERhdGU6XG5cdFx0XHRjbG9uZSA9IG5ldyBDb25zdHJ1Y3RvcihvYmplY3QuZ2V0VGltZSgpKTtcblx0XHRcdGJyZWFrO1xuXHRcdGRlZmF1bHQ6XG5cdFx0XHQvLyBDYW4gbm90IGNvcHkgdW5rbm93biBvYmplY3RzXG5cdFx0XHRyZXR1cm4gb2JqZWN0O1xuXHR9XG5cdGZvciAocHJvcCBpbiBvYmplY3QpIHtcblx0XHRpZiAob2JqZWN0Lmhhc093blByb3BlcnR5KHByb3ApKSB7XG5cdFx0XHRjbG9uZVtwcm9wXSA9IFplc2suY2xvbmUob2JqZWN0W3Byb3BdKTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIGNsb25lO1xufTtcblxuT2JqZWN0LmFzc2lnbihBcnJheS5wcm90b3R5cGUsIHtcblx0Y29udGFpbnM6IGZ1bmN0aW9uKHgpIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmICh0aGlzW2ldID09PSB4KSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH0sXG5cdHJlbW92ZTogZnVuY3Rpb24oeCkge1xuXHRcdHZhciB0ZW1wID0gdGhpcy5zbGljZSgwKTtcblx0XHR0ZW1wLnNwbGljZSh4LCAxKTtcblx0XHRyZXR1cm4gdGVtcDtcblx0fSxcblx0LyoqXG5cdCAqIEpvaW4gZWxlbWVudHMgb2YgYW4gYXJyYXkgYnkgd3JhcHBpbmcgZWFjaCBvbmUgd2l0aCBhIHByZWZpeC9zdWZmaXhcblx0ICpcblx0ICogQHBhcmFtIHN0cmluZ1xuXHQgKiAgICAgICAgICAgIHByZWZpeFxuXHQgKiBAcGFyYW0gc3RyaW5nXG5cdCAqICAgICAgICAgICAgc3VmZml4XG5cdCAqIEByZXR1cm4gc3RyaW5nXG5cdCAqL1xuXHRqb2luX3dyYXA6IGZ1bmN0aW9uKHByZWZpeCwgc3VmZml4KSB7XG5cdFx0cHJlZml4ID0gU3RyaW5nKHByZWZpeCkgfHwgXCJcIjtcblx0XHRzdWZmaXggPSBTdHJpbmcoc3VmZml4KSB8fCBcIlwiO1xuXHRcdHJldHVybiBwcmVmaXggKyB0aGlzLmpvaW4oc3VmZml4ICsgcHJlZml4KSArIHN1ZmZpeDtcblx0fSxcbn0pO1xuXG5PYmplY3QuYXNzaWduKE9iamVjdCwge1xuXHRmcm9tQ2FtZWxDYXNlOiBmdW5jdGlvbihmcm9tKSB7XG5cdFx0dmFyIHRvID0ge307XG5cdFx0Zm9yICh2YXIgaSBpbiBmcm9tKSB7XG5cdFx0XHRpZiAoZnJvbS5oYXNPd25Qcm9wZXJ0eShpKSkge1xuXHRcdFx0XHR0b1tpLmZyb21DYW1lbENhc2UoKV0gPSBmcm9tW2ldO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gdG87XG5cdH0sXG5cdHRvQ2FtZWxDYXNlOiBmdW5jdGlvbihmcm9tKSB7XG5cdFx0dmFyIHRvID0ge307XG5cdFx0Zm9yICh2YXIgaSBpbiB0aGlzKSB7XG5cdFx0XHRpZiAoZnJvbS5oYXNPd25Qcm9wZXJ0eShpKSkge1xuXHRcdFx0XHR0b1tpLnRvQ2FtZWxDYXNlKCldID0gZnJvbVtpXTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIHRvO1xuXHR9LFxufSk7XG5aZXNrLm1hcCA9IGZ1bmN0aW9uKHN0cmluZywgb2JqZWN0LCBjYXNlX2luc2Vuc2l0aXZlID0gZmFsc2UpIHtcblx0dmFyIGssXG5cdFx0c3VmZml4ID0gXCJcIixcblx0XHRzZWxmO1xuXHRjYXNlX2luc2Vuc2l0aXZlID0gISFjYXNlX2luc2Vuc2l0aXZlOyAvLyBDb252ZXJ0IHRvIGJvb2xcblx0aWYgKCFpc19vYmplY3Qob2JqZWN0KSkge1xuXHRcdHJldHVybiBzdHJpbmc7XG5cdH1cblx0c2VsZiA9IHN0cmluZztcblx0aWYgKGNhc2VfaW5zZW5zaXRpdmUpIHtcblx0XHRvYmplY3QgPSBaZXNrLmNoYW5nZV9rZXlfY2FzZShvYmplY3QpO1xuXHRcdHN1ZmZpeCA9IFwiaVwiO1xuXHR9XG5cdGZvciAoayBpbiBvYmplY3QpIHtcblx0XHRpZiAob2JqZWN0Lmhhc093blByb3BlcnR5KGspKSB7XG5cdFx0XHR2YXIgdmFsdWUgPSBvYmplY3Rba10sXG5cdFx0XHRcdHJlcGxhY2UgPSB2YWx1ZSA9PT0gbnVsbCA/IFwiXCIgOiBTdHJpbmcob2JqZWN0W2tdKTtcblx0XHRcdHNlbGYgPSBzZWxmLnJlcGxhY2UobmV3IFJlZ0V4cChcIlxcXFx7XCIgKyBrICsgXCJcXFxcfVwiLCBcImdcIiArIHN1ZmZpeCksIHJlcGxhY2UpO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gc2VsZjtcbn07XG5cbk9iamVjdC5hc3NpZ24oU3RyaW5nLnByb3RvdHlwZSwge1xuXHRjb21wYXJlOiBmdW5jdGlvbihhKSB7XG5cdFx0cmV0dXJuIHRoaXMgPCBhID8gLTEgOiB0aGlzID09PSBhID8gMCA6IDE7XG5cdH0sXG5cdGxlZnQ6IGZ1bmN0aW9uKGRlbGltLCBkZWYpIHtcblx0XHR2YXIgcG9zID0gdGhpcy5pbmRleE9mKGRlbGltKTtcblx0XHRyZXR1cm4gcG9zIDwgMCA/IGF2YWx1ZShhcmd1bWVudHMsIDEsIGRlZiB8fCB0aGlzKSA6IHRoaXMuc3Vic3RyKDAsIHBvcyk7XG5cdH0sXG5cdHJsZWZ0OiBmdW5jdGlvbihkZWxpbSwgZGVmKSB7XG5cdFx0dmFyIHBvcyA9IHRoaXMubGFzdEluZGV4T2YoZGVsaW0pO1xuXHRcdHJldHVybiBwb3MgPCAwID8gYXZhbHVlKGFyZ3VtZW50cywgMSwgZGVmIHx8IHRoaXMpIDogdGhpcy5zdWJzdHIoMCwgcG9zKTtcblx0fSxcblx0cmlnaHQ6IGZ1bmN0aW9uKGRlbGltLCBkZWYpIHtcblx0XHR2YXIgcG9zID0gdGhpcy5pbmRleE9mKGRlbGltKTtcblx0XHRyZXR1cm4gcG9zIDwgMCA/IGF2YWx1ZShhcmd1bWVudHMsIDEsIGRlZiB8fCB0aGlzKSA6IHRoaXMuc3Vic3RyKHBvcyArIGRlbGltLmxlbmd0aCk7XG5cdH0sXG5cdHJyaWdodDogZnVuY3Rpb24oZGVsaW0sIGRlZikge1xuXHRcdHZhciBwb3MgPSB0aGlzLmxhc3RJbmRleE9mKGRlbGltKTtcblx0XHRyZXR1cm4gcG9zIDwgMCA/IGF2YWx1ZShhcmd1bWVudHMsIDEsIGRlZiB8fCB0aGlzKSA6IHRoaXMuc3Vic3RyKHBvcyArIGRlbGltLmxlbmd0aCk7XG5cdH0sXG5cdGx0cmltOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5yZXBsYWNlKC9eXFxzKy8sIFwiXCIpO1xuXHR9LFxuXHRydHJpbTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMucmVwbGFjZSgvXFxzKyQvLCBcIlwiKTtcblx0fSxcblx0dHJpbTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMucmVwbGFjZSgvXlxccysvLCBcIlwiKS5yZXBsYWNlKC9cXHMrJC8sIFwiXCIpO1xuXHR9LFxuXHQvKipcblx0ICogQGRlcHJlY2F0ZWRcblx0ICogQHBhcmFtIHhcblx0ICogICAgICAgICAgICBTdHJpbmcgdG8gbG9vayBhdFxuXHQgKi9cblx0ZW5kc193aXRoOiBmdW5jdGlvbih4KSB7XG5cdFx0cmV0dXJuIHRoaXMuZW5kcyh4KTtcblx0fSxcblx0ZW5kczogZnVuY3Rpb24oeCkge1xuXHRcdHZhciB4biA9IHgubGVuZ3RoLFxuXHRcdFx0biA9IHRoaXMubGVuZ3RoO1xuXHRcdGlmICh4biA+IG4pIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMuc3Vic3RyaW5nKG4gLSB4biwgbikgPT09IHg7XG5cdH0sXG5cdGJlZ2luc2k6IGZ1bmN0aW9uKHN0cmluZykge1xuXHRcdHZhciBsZW4gPSBzdHJpbmcubGVuZ3RoO1xuXHRcdGlmIChsZW4gPiB0aGlzLmxlbmd0aCkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5zdWJzdHIoMCwgbGVuKS50b0xvd2VyQ2FzZSgpID09PSBzdHJpbmcudG9Mb3dlckNhc2UoKTtcblx0fSxcblx0YmVnaW5zOiBmdW5jdGlvbihzdHJpbmcpIHtcblx0XHR2YXIgbGVuID0gc3RyaW5nLmxlbmd0aDtcblx0XHRpZiAobGVuID4gdGhpcy5sZW5ndGgpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMuc3Vic3RyKDAsIGxlbikgPT09IHN0cmluZztcblx0fSxcblx0c3RyX3JlcGxhY2U6IGZ1bmN0aW9uKHMsIHIpIHtcblx0XHR2YXIgc3RyID0gdGhpcztcblx0XHR2YXIgaTtcblx0XHRpZiAoaXNfc3RyaW5nKHMpKSB7XG5cdFx0XHRpZiAoaXNfc3RyaW5nKHIpKSB7XG5cdFx0XHRcdHJldHVybiB0aGlzLnNwbGl0KHMpLmpvaW4ocik7XG5cdFx0XHR9XG5cdFx0XHRmb3IgKGkgPSAwOyBpIDwgci5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRzdHIgPSBzdHIuc3RyX3JlcGxhY2UocywgcltpXSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gc3RyO1xuXHRcdH1cblx0XHRpZiAoaXNfc3RyaW5nKHIpKSB7XG5cdFx0XHRmb3IgKGkgPSAwOyBpIDwgcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRzdHIgPSBzdHIuc3RyX3JlcGxhY2Uoc1tpXSwgcik7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gc3RyO1xuXHRcdH1cblx0XHR2YXIgbiA9IE1hdGgubWluKHMubGVuZ3RoLCByLmxlbmd0aCk7XG5cdFx0Zm9yIChpID0gMDsgaSA8IG47IGkrKykge1xuXHRcdFx0c3RyID0gc3RyLnN0cl9yZXBsYWNlKHNbaV0sIHJbaV0pO1xuXHRcdH1cblx0XHRyZXR1cm4gc3RyO1xuXHR9LFxuXHR0cjogZnVuY3Rpb24ob2JqZWN0KSB7XG5cdFx0dmFyIGssXG5cdFx0XHRzZWxmID0gdGhpcztcblx0XHRmb3IgKGsgaW4gb2JqZWN0KSB7XG5cdFx0XHRpZiAob2JqZWN0Lmhhc093blByb3BlcnR5KGspKSB7XG5cdFx0XHRcdHNlbGYgPSBzZWxmLnN0cl9yZXBsYWNlKGssIG9iamVjdFtrXSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBzZWxmO1xuXHR9LFxuXHRtYXA6IGZ1bmN0aW9uKG9iamVjdCwgY2FzZV9pbnNlbnNpdGl2ZSA9IGZhbHNlKSB7XG5cdFx0cmV0dXJuIFplc2subWFwKHRoaXMsIG9iamVjdCwgY2FzZV9pbnNlbnNpdGl2ZSk7XG5cdH0sXG5cdHRvX2FycmF5OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgaSxcblx0XHRcdHIgPSBbXTtcblx0XHRmb3IgKGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0ci5wdXNoKHRoaXMuY2hhckF0KGkpKTtcblx0XHR9XG5cdFx0cmV0dXJuIHI7XG5cdH0sXG5cdHVucXVvdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBuID0gdGhpcy5sZW5ndGg7XG5cdFx0dmFyIHEgPSBhcmd1bWVudHNbMF0gfHwgXCJcXFwiXFxcIicnXCI7XG5cdFx0dmFyIHAgPSBxLmluZGV4T2YodGhpcy5zdWJzdHJpbmcoMCwgMSkpO1xuXHRcdGlmIChwIDwgMCkge1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXHRcdGlmICh0aGlzLnN1YnN0cmluZyhuIC0gMSwgbikgPT09IHEuY2hhckF0KHAgKyAxKSkge1xuXHRcdFx0cmV0dXJuIHRoaXMuc3Vic3RyaW5nKDEsIG4gLSAxKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cdHRvQ2FtZWxDYXNlOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgcmVzdWx0ID0gXCJcIjtcblx0XHRaZXNrLmVhY2godGhpcy5zcGxpdChcIl9cIiksIGZ1bmN0aW9uKCkge1xuXHRcdFx0cmVzdWx0ICs9IHRoaXMuc3Vic3RyKDAsIDEpLnRvVXBwZXJDYXNlKCkgKyB0aGlzLnN1YnN0cigxKS50b0xvd2VyQ2FzZSgpO1xuXHRcdH0pO1xuXHRcdHJldHVybiByZXN1bHQ7XG5cdH0sXG5cdGZyb21DYW1lbENhc2U6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLnJlcGxhY2UoL1tBLVpdL2csIGZ1bmN0aW9uKHYpIHtcblx0XHRcdHJldHVybiBcIl9cIiArIHYudG9Mb3dlckNhc2UoKTtcblx0XHR9KTtcblx0fSxcblx0dW5wcmVmaXg6IGZ1bmN0aW9uKHN0cmluZywgZGVmKSB7XG5cdFx0aWYgKHRoaXMuYmVnaW5zKHN0cmluZykpIHtcblx0XHRcdHJldHVybiB0aGlzLnN1YnN0cihzdHJpbmcubGVuZ3RoKTtcblx0XHR9XG5cdFx0cmV0dXJuIGRlZiB8fCB0aGlzO1xuXHR9LFxufSk7XG5PYmplY3QuYXNzaWduKFN0cmluZy5wcm90b3R5cGUsIHtcblx0ZW5kczogU3RyaW5nLnByb3RvdHlwZS5lbmRzX3dpdGgsXG59KTtcblxuWmVzay50b19pbnRlZ2VyID0gZnVuY3Rpb24oeCkge1xuXHR2YXIgZCA9IGFyZ3VtZW50cy5sZW5ndGggPiAxID8gYXJndW1lbnRzWzFdIDogbnVsbDtcblx0eCA9IHBhcnNlSW50KHgsIDEwKTtcblx0aWYgKHR5cGVvZiB4ID09PSBcIm51bWJlclwiKSB7XG5cdFx0cmV0dXJuIHg7XG5cdH1cblx0cmV0dXJuIGQ7XG59O1xuXG5aZXNrLnRvX2xpc3QgPSB0b19saXN0O1xuXG5aZXNrLnRvX2Zsb2F0ID0gZnVuY3Rpb24oeCkge1xuXHR2YXIgZCA9IGFyZ3VtZW50cy5sZW5ndGggPiAxID8gYXJndW1lbnRzWzFdIDogbnVsbDtcblx0eCA9IHBhcnNlRmxvYXQoeCk7XG5cdGlmICh0eXBlb2YgeCA9PT0gXCJudW1iZXJcIikge1xuXHRcdHJldHVybiB4O1xuXHR9XG5cdHJldHVybiBkO1xufTtcblxuWmVzay50b19zdHJpbmcgPSBmdW5jdGlvbih4KSB7XG5cdHJldHVybiB4LnRvU3RyaW5nKCk7XG59O1xuXG5aZXNrLnRvX2Jvb2wgPSB0b19ib29sO1xuXG5aZXNrLmVtcHR5ID0gZnVuY3Rpb24odikge1xuXHRyZXR1cm4gdHlwZW9mIHYgPT09IFwidW5kZWZpbmVkXCIgfHwgdiA9PT0gbnVsbCB8fCB2ID09PSBcIlwiO1xufTtcblxuWmVzay5aT2JqZWN0ID0gZnVuY3Rpb24ob3B0aW9ucykge1xuXHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblx0dGhpcy5vcHRpb25zID0gWmVzay5jaGFuZ2Vfa2V5X2Nhc2UoT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucykpO1xuXHQvLyB0aGlzLmNvbnN0cnVjdG9yLnN1cGVyLmNhbGwodGhpcyk7XG59O1xuWmVzay5pbmhlcml0KFplc2suWk9iamVjdCwgbnVsbCwge1xuXHRjbG9uZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIFplc2suY2xvbmUodGhpcyk7XG5cdH0sXG59KTtcblxuWmVzay5jaGFuZ2Vfa2V5X2Nhc2UgPSBmdW5jdGlvbihtZSkge1xuXHR2YXIgayxcblx0XHRuZXdvID0ge307XG5cdGZvciAoayBpbiBtZSkge1xuXHRcdGlmIChtZS5oYXNPd25Qcm9wZXJ0eShrKSkge1xuXHRcdFx0bmV3b1trLnRvTG93ZXJDYXNlKCldID0gbWVba107XG5cdFx0fVxuXHR9XG5cdHJldHVybiBuZXdvO1xufTtcblxuaWYgKHR5cGVvZiBNYXRoLnNpZ24gIT09IFwiZnVuY3Rpb25cIikge1xuXHRNYXRoLnNpZ24gPSBmdW5jdGlvbih4KSB7XG5cdFx0cmV0dXJuIHggPyAoeCA8IDAgPyAtMSA6IDEpIDogMDtcblx0fTtcbn1cblxuLy8gVE9ETyBXaGF0J3MgdGhpcyBmb3I/XG5aZXNrLmFqYXhfZm9ybSA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgJGZvcm0gPSAkKHRoaXMpLFxuXHRcdHRhcmdldCA9ICRmb3JtLmF0dHIoXCJ0YXJnZXRcIiksXG5cdFx0JHRhcmdldCA9ICQoXCIjXCIgKyB0YXJnZXQpO1xuXHRaZXNrLmxvZygkdGFyZ2V0Lmh0bWwoKSk7XG59O1xuXG4vKlxuICogQ29tcGF0aWJpbGl0eVxuICovXG4vLyBpZiAoIU9iamVjdC5wcm90b3R5cGUua2V5cykge1xuLy8gXHRPYmplY3QucHJvdG90eXBlLmtleXMgPSBmdW5jdGlvbihvYmopIHtcbi8vIFx0XHR2YXIga2V5cyA9IFtdLCBrO1xuLy8gXHRcdGZvciAoayBpbiBvYmopIHtcbi8vIFx0XHRcdGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrKSkge1xuLy8gXHRcdFx0XHRrZXlzLnB1c2goayk7XG4vLyBcdFx0XHR9XG4vLyBcdFx0fVxuLy8gXHRcdHJldHVybiBrZXlzO1xuLy8gXHR9O1xuLy8gfVxuXG4kLmZuLmVxdWFsaGVpZ2h0ID0gZnVuY3Rpb24oc2VsZWN0b3IpIHtcblx0JCh0aGlzKS5lYWNoKGZ1bmN0aW9uKCkge1xuXHRcdHZhciBoID0gbnVsbDtcblx0XHQkKHNlbGVjdG9yLCAkKHRoaXMpKS5lYWNoKGZ1bmN0aW9uKCkge1xuXHRcdFx0aCA9IE1hdGgubWF4KCQodGhpcykuaGVpZ2h0KCksIGgpO1xuXHRcdH0pO1xuXHRcdCQoc2VsZWN0b3IsICQodGhpcykpLmVhY2goZnVuY3Rpb24oKSB7XG5cdFx0XHQkKHRoaXMpLmhlaWdodChoICsgXCJweFwiKTtcblx0XHR9KTtcblx0fSk7XG59O1xuXG5aZXNrLmluaXRlZCA9IHRydWU7XG5cbiQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCkge1xuXHRaZXNrLmhvb2soXCJkb2N1bWVudDo6cmVhZHlcIik7XG59KTtcbiQod2luZG93KS5vbihcImxvYWRcIiwgZnVuY3Rpb24oKSB7XG5cdFplc2suaG9vayhcIndpbmRvdzo6bG9hZFwiKTtcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFplc2s7XG4iXX0=