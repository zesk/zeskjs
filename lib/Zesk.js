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

Zesk.each = Zesk.each;

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
	map: function map(object, case_insensitive) {
		var k,
		    suffix = "",
		    self;
		case_insensitive = !!case_insensitive; // Convert to bool
		if (!is_object(object)) {
			return this;
		}
		self = this;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9aZXNrLmpzIl0sIm5hbWVzIjpbIiQiLCJyZXF1aXJlIiwiWmVzayIsImhvb2tzIiwiVyIsImdsb2JhbCIsIndpbmRvdyIsImQiLCJkb2N1bWVudCIsIkwiLCJsb2NhdGlvbiIsImdldHR5cGUiLCJ4IiwiT2JqZWN0IiwicHJvdG90eXBlIiwidG9TdHJpbmciLCJjYWxsIiwic3BsaXQiLCJ0b0xvd2VyQ2FzZSIsImF2YWx1ZSIsIm9iaiIsImkiLCJkZWYiLCJ1bmRlZmluZWQiLCJpc19ib29sIiwiYSIsImlzX251bWVyaWMiLCJpc19zdHJpbmciLCJpc19hcnJheSIsImlzX29iamVjdCIsImlzX2ludGVnZXIiLCJwYXJzZUludCIsImlzX2Z1bmN0aW9uIiwiaXNfZmxvYXQiLCJpc191cmwiLCJleGVjIiwidHJpbSIsImZsaXAiLCJvYmplY3QiLCJyZXN1bHQiLCJoYXNPd25Qcm9wZXJ0eSIsIlN0cmluZyIsImlzX2RhdGUiLCJlYWNoIiwiaXNfbnVtYmVyIiwidG9fbGlzdCIsImRlbGltIiwidG9fYm9vbCIsImFyZ3VtZW50cyIsImxlbmd0aCIsImNvbnRhaW5zIiwib2JqZWN0X3BhdGgiLCJwYXRoIiwiY3VyciIsImsiLCJvYmplY3Rfc2V0X3BhdGgiLCJ2YWx1ZSIsInNlZyIsImhvb2tfcGF0aCIsImhvb2siLCJwdXNoIiwiYXNzaWduIiwic2V0dGluZ3MiLCJ3IiwidXJsX3BhcnRzIiwicGF0aG5hbWUiLCJob3N0IiwicXVlcnkiLCJzZWFyY2giLCJzY2hlbWUiLCJwcm90b2NvbCIsInVybCIsIlVSTCIsInVyaSIsInBhZ2Vfc2NyaXB0cyIsInF1ZXJ5X2dldCIsInYiLCJwYWlyIiwidSIsInJpZ2h0IiwiY29va2llIiwibmFtZSIsIm9wdGlvbnMiLCJnZXRjb29raWUiLCJuIiwiYyIsInMiLCJsYXN0SW5kZXhPZiIsImUiLCJpbmRleE9mIiwidW5lc2NhcGUiLCJzdWJzdHJpbmciLCJzZXRjb29raWUiLCJEYXRlIiwidCIsInR0bCIsIm0iLCJkb21haW4iLCJzZXRGdWxsWWVhciIsInNldFRpbWUiLCJnZXRUaW1lIiwiZXNjYXBlIiwidG9HTVRTdHJpbmciLCJkZWxldGVfY29va2llIiwiZG9tIiwibm93IiwiY3NzIiwicCIsImNyZWF0ZUVsZW1lbnQiLCJyZWwiLCJocmVmIiwibWVkaWEiLCJnZXRFbGVtZW50c0J5VGFnTmFtZSIsImFwcGVuZENoaWxkIiwibG9nIiwiY29uc29sZSIsImFkZF9ob29rIiwiZnVuIiwiaGFzX2hvb2siLCJmdW5jcyIsImFyZ3MiLCJjbG9uZSIsInJlc3VsdHMiLCJzaGlmdCIsImFwcGx5IiwiZ2V0X3BhdGgiLCJzZXRfcGF0aCIsImdldCIsImdldGIiLCJzZXQiLCJvdmVyd3JpdGUiLCJpbmhlcml0IiwidGhlX2NsYXNzIiwic3VwZXJfY2xhc3MiLCJtZXRob2QiLCJDb25zdHJ1Y3QiLCJjb25zdHJ1Y3RvciIsImZuIiwidGVybV9mYWxzZSIsInIiLCJ0cGwiLCJtaXhlZCIsIm1hcCIsImh0bWwiLCJzY3JpcHRfc3JjX25vcm1hbGl6ZSIsInNyYyIsIm1hdGNoZXMiLCJwYXJ0cyIsInVucHJlZml4IiwibWF0Y2giLCJzY3JpcHRzX2luaXQiLCJzY3JpcHRfYWRkIiwiYXR0ciIsInNjcmlwdHMiLCJzY3JpcHRzX2NhY2hlZCIsInNyY3MiLCJzY3JpcHRfbG9hZGVkIiwic3R5bGVzaGVldF9sb2FkZWQiLCJtZXNzYWdlIiwibGV2ZWwiLCJyZWdleHBfcXVvdGUiLCJzdHIiLCJkZWxpbWl0ZXIiLCJyZXBsYWNlIiwiUmVnRXhwIiwicHJvcCIsIkNvbnN0cnVjdG9yIiwic291cmNlIiwic3Vic3RyIiwiTnVtYmVyIiwiaWdub3JlQ2FzZSIsIm11bHRpbGluZSIsIkFycmF5IiwicmVtb3ZlIiwidGVtcCIsInNsaWNlIiwic3BsaWNlIiwiam9pbl93cmFwIiwicHJlZml4Iiwic3VmZml4Iiwiam9pbiIsImZyb21DYW1lbENhc2UiLCJmcm9tIiwidG8iLCJ0b0NhbWVsQ2FzZSIsImNvbXBhcmUiLCJsZWZ0IiwicG9zIiwicmxlZnQiLCJycmlnaHQiLCJsdHJpbSIsInJ0cmltIiwiZW5kc193aXRoIiwiZW5kcyIsInhuIiwiYmVnaW5zaSIsInN0cmluZyIsImxlbiIsImJlZ2lucyIsInN0cl9yZXBsYWNlIiwiTWF0aCIsIm1pbiIsInRyIiwic2VsZiIsImNhc2VfaW5zZW5zaXRpdmUiLCJjaGFuZ2Vfa2V5X2Nhc2UiLCJ0b19hcnJheSIsImNoYXJBdCIsInVucXVvdGUiLCJxIiwidG9VcHBlckNhc2UiLCJ0b19pbnRlZ2VyIiwidG9fZmxvYXQiLCJwYXJzZUZsb2F0IiwidG9fc3RyaW5nIiwiZW1wdHkiLCJaT2JqZWN0IiwibWUiLCJuZXdvIiwic2lnbiIsImFqYXhfZm9ybSIsIiRmb3JtIiwidGFyZ2V0IiwiJHRhcmdldCIsImVxdWFsaGVpZ2h0Iiwic2VsZWN0b3IiLCJoIiwibWF4IiwiaGVpZ2h0IiwiaW5pdGVkIiwicmVhZHkiLCJvbiIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTs7O0FBR0EsSUFBSUEsSUFBSUMsUUFBUSxRQUFSLENBQVI7O0FBRUEsSUFBSUMsT0FBTyxFQUFYO0FBQ0EsSUFBSUMsUUFBUSxFQUFaO0FBQ0EsSUFBSUMsSUFBSUMsT0FBT0MsTUFBUCxJQUFpQixFQUF6QjtBQUNBLElBQUlDLElBQUlILEVBQUVJLFFBQUYsSUFBYyxFQUF0QjtBQUNBLElBQUlDLElBQUlMLEVBQUVNLFFBQUYsSUFBYyxFQUF0Qjs7QUFFQSxTQUFTQyxPQUFULENBQWlCQyxDQUFqQixFQUFvQjtBQUNuQixLQUFJQSxNQUFNLElBQVYsRUFBZ0I7QUFDZixTQUFPLE1BQVA7QUFDQTtBQUNELFFBQU9DLE9BQU9DLFNBQVAsQ0FBaUJDLFFBQWpCLENBQ0xDLElBREssQ0FDQUosQ0FEQSxFQUVMSyxLQUZLLENBRUMsR0FGRCxFQUVNLENBRk4sRUFHTEEsS0FISyxDQUdDLEdBSEQsRUFHTSxDQUhOLEVBSUxDLFdBSkssRUFBUDtBQUtBOztBQUVELFNBQVNDLE1BQVQsQ0FBZ0JDLEdBQWhCLEVB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QTNCLENBQUo7QUFDQSxHQUZEO0FBR0FsTyxJQUFFaU8sUUFBRixFQUFZak8sRUFBRSxJQUFGLENBQVosRUFBcUIyQyxJQUFyQixDQUEwQixZQUFXO0FBQ3BDM0MsS0FBRSxJQUFGLEVBQVFvTyxNQUFSLENBQWVGLElBQUksSUFBbkI7QUFDQSxHQUZEO0FBR0EsRUFSRDtBQVNBLENBVkQ7O0FBWUFoTyxLQUFLbU8sTUFBTCxHQUFjLElBQWQ7O0FBRUFyTyxFQUFFUSxRQUFGLEVBQVk4TixLQUFaLENBQWtCLFlBQVc7QUFDNUJwTyxNQUFLeUQsSUFBTCxDQUFVLGlCQUFWO0FBQ0EsQ0FGRDtBQUdBM0QsRUFBRU0sTUFBRixFQUFVaU8sRUFBVixDQUFhLE1BQWIsRUFBcUIsWUFBVztBQUMvQnJPLE1BQUt5RCxJQUFMLENBQVUsY0FBVjtBQUNBLENBRkQ7O0FBSUE2SyxPQUFPQyxPQUFQLEdBQWlCdk8sSUFBakIiLCJmaWxlIjoiWmVzay5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0ICZjb3B5OyAyMDE3IE1hcmtldCBBY3VtZW4sIEluYy5cbiAqL1xudmFyICQgPSByZXF1aXJlKFwianF1ZXJ5XCIpO1xuXG52YXIgWmVzayA9IHt9O1xudmFyIGhvb2tzID0ge307XG52YXIgVyA9IGdsb2JhbC53aW5kb3cgfHwge307XG52YXIgZCA9IFcuZG9jdW1lbnQgfHwge307XG52YXIgTCA9IFcubG9jYXRpb24gfHwge307XG5cbmZ1bmN0aW9uIGdldHR5cGUoeCkge1xuXHRpZiAoeCA9PT0gbnVsbCkge1xuXHRcdHJldHVybiBcIm51bGxcIjtcblx0fVxuXHRyZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZ1xuXHRcdC5jYWxsKHgpXG5cdFx0LnNwbGl0KFwiIFwiKVsxXVxuXHRcdC5zcGxpdChcIl1cIilbMF1cblx0XHQudG9Mb3dlckNhc2UoKTtcbn1cblxuZnVuY3Rpb24gYXZhbHVlKG9iaiwgaSwgZGVmKSB7XG5cdGlmIChkZWYgPT09IHVuZGVmaW5lZCkge1xuXHRcdGRlZiA9IG51bGw7XG5cdH1cblx0aWYgKHR5cGVvZiBvYmogPT09IFwib2JqZWN0XCIpIHtcblx0XHRpZiAodHlwZW9mIG9ialtpXSAhPT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdFx0cmV0dXJuIG9ialtpXTtcblx0XHR9XG5cdFx0cmV0dXJuIGRlZjtcblx0fVxuXHRyZXR1cm4gZGVmO1xufVxuWmVzay5hdmFsdWUgPSBhdmFsdWU7XG5cbmZ1bmN0aW9uIGlzX2Jvb2woYSkge1xuXHRyZXR1cm4gZ2V0dHlwZShhKSA9PT0gXCJib29sZWFuXCI7XG59XG5mdW5jdGlvbiBpc19udW1lcmljKGEpIHtcblx0cmV0dXJuIGdldHR5cGUoYSkgPT09IFwibnVtYmVyXCI7XG59XG5mdW5jdGlvbiBpc19zdHJpbmcoYSkge1xuXHRyZXR1cm4gZ2V0dHlwZShhKSA9PT0gXCJzdHJpbmdcIjtcbn1cbmZ1bmN0aW9uIGlzX2FycmF5KGEpIHtcblx0cmV0dXJuIGdldHR5cGUoYSkgPT09IFwiYXJyYXlcIjtcbn1cbmZ1bmN0aW9uIGlzX29iamVjdChhKSB7XG5cdHJldHVybiBnZXR0eXBlKGEpID09PSBcIm9iamVjdFwiO1xufVxuZnVuY3Rpb24gaXNfaW50ZWdlcihhKSB7XG5cdHJldHVybiBpc19udW1lcmljKGEpICYmIHBhcnNlSW50KGEsIDEwKSA9PT0gYTtcbn1cbmZ1bmN0aW9uIGlzX2Z1bmN0aW9uKGEpIHtcblx0cmV0dXJuIGdldHR5cGUoYSkgPT09IFwiZnVuY3Rpb25cIjtcbn1cbmZ1bmN0aW9uIGlzX2Zsb2F0KGEpIHtcblx0cmV0dXJuIHR5cGVvZiBhID09PSBcIm51bWJlclwiICYmIHBhcnNlSW50KGEsIDEwKSAhPT0gYTtcbn1cbmZ1bmN0aW9uIGlzX3VybCh4KSB7XG5cdHJldHVybiAvXmh0dHA6XFwvXFwvLit8Xmh0dHBzOlxcL1xcLy4rfF5tYWlsdG86LitALit8XmZ0cDpcXC9cXC8uK3xeZmlsZTpcXC9cXC8uK3xebmV3czpcXC9cXC8uKy8uZXhlYyhcblx0XHR4LnRvTG93ZXJDYXNlKCkudHJpbSgpXG5cdCk7XG59XG5cblplc2suZmxpcCA9IGZ1bmN0aW9uKG9iamVjdCkge1xuXHR2YXIgaSxcblx0XHRyZXN1bHQgPSB7fTtcblx0Zm9yIChpIGluIG9iamVjdCkge1xuXHRcdGlmIChvYmplY3QuaGFzT3duUHJvcGVydHkoaSkpIHtcblx0XHRcdHJlc3VsdFtTdHJpbmcob2JqZWN0W2ldKV0gPSBpO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gcmVzdWx0O1xufTtcblxuLyogS2VybmVsICovXG5cblplc2suaXNfZGF0ZSA9IGZ1bmN0aW9uKGEpIHtcblx0cmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhKSA9PT0gXCJbb2JqZWN0IERhdGVdXCI7XG59O1xuXG5aZXNrLmdldHR5cGUgPSBnZXR0eXBlO1xuXG5aZXNrLmVhY2ggPSBaZXNrLmVhY2g7XG5cblplc2suaXNfYXJyYXkgPSBpc19hcnJheTtcblplc2suaXNfb2JqZWN0ID0gaXNfb2JqZWN0O1xuWmVzay5pc19hcnJheSA9IGlzX2FycmF5O1xuWmVzay5pc19udW1iZXIgPSBpc19udW1lcmljO1xuWmVzay5pc19udW1lcmljID0gaXNfbnVtZXJpYztcblplc2suaXNfYm9vbCA9IGlzX2Jvb2w7XG5aZXNrLmlzX3N0cmluZyA9IGlzX3N0cmluZztcblplc2suaXNfaW50ZWdlciA9IGlzX2ludGVnZXI7XG5aZXNrLmlzX2Z1bmN0aW9uID0gaXNfZnVuY3Rpb247XG5aZXNrLmlzX2Zsb2F0ID0gaXNfZmxvYXQ7XG5aZXNrLmlzX3VybCA9IGlzX3VybDtcblxuZnVuY3Rpb24gdG9fbGlzdCh4LCBkZWYsIGRlbGltKSB7XG5cdGRlZiA9IGRlZiB8fCBbXTtcblx0ZGVsaW0gPSBkZWxpbSB8fCBcIi5cIjtcblx0aWYgKGlzX2FycmF5KHgpKSB7XG5cdFx0cmV0dXJuIHg7XG5cdH1cblx0aWYgKHggPT09IG51bGwpIHtcblx0XHRyZXR1cm4gZGVmO1xuXHR9XG5cdHJldHVybiB4LnRvU3RyaW5nKCkuc3BsaXQoZGVsaW0pO1xufVxuXG5mdW5jdGlvbiB0b19ib29sKHgpIHtcblx0dmFyIGQgPSBhcmd1bWVudHMubGVuZ3RoID4gMSA/IGFyZ3VtZW50c1sxXSA6IGZhbHNlO1xuXHRpZiAoaXNfYm9vbCh4KSkge1xuXHRcdHJldHVybiB4O1xuXHR9XG5cdGlmIChpc19udW1lcmljKHgpKSB7XG5cdFx0cmV0dXJuIHBhcnNlSW50KHgsIDEwKSAhPT0gMDtcblx0fVxuXHRpZiAoaXNfc3RyaW5nKHgpKSB7XG5cdFx0aWYgKFtcInRcIiwgXCJ0cnVlXCIsIFwiMVwiLCBcImVuYWJsZWRcIiwgXCJ5XCIsIFwieWVzXCJdLmNvbnRhaW5zKHgpKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdFx0aWYgKFtcImZcIiwgXCJmYWxzZVwiLCBcIjBcIiwgXCJkaXNhYmxlZFwiLCBcIm5cIiwgXCJub1wiXS5jb250YWlucyh4KSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gZDtcbn1cblxuZnVuY3Rpb24gb2JqZWN0X3BhdGgob2JqZWN0LCBwYXRoLCBkZWYpIHtcblx0dmFyIGN1cnIgPSBvYmplY3QsXG5cdFx0aztcblx0cGF0aCA9IHRvX2xpc3QocGF0aCwgW10sIFwiLlwiKTtcblx0Zm9yIChrID0gMDsgayA8IHBhdGgubGVuZ3RoOyBrKyspIHtcblx0XHRpZiAoayA9PT0gcGF0aC5sZW5ndGggLSAxKSB7XG5cdFx0XHRyZXR1cm4gYXZhbHVlKGN1cnIsIHBhdGhba10sIGRlZik7XG5cdFx0fVxuXHRcdGN1cnIgPSBhdmFsdWUoY3VyciwgcGF0aFtrXSk7XG5cdFx0aWYgKGN1cnIgPT09IG51bGwpIHtcblx0XHRcdHJldHVybiBkZWY7XG5cdFx0fVxuXHRcdGlmICghaXNfb2JqZWN0KGN1cnIpKSB7XG5cdFx0XHRyZXR1cm4gZGVmO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gY3Vycjtcbn1cblxuZnVuY3Rpb24gb2JqZWN0X3NldF9wYXRoKG9iamVjdCwgcGF0aCwgdmFsdWUpIHtcblx0dmFyIGN1cnIgPSBvYmplY3QsXG5cdFx0ayxcblx0XHRzZWc7XG5cdHBhdGggPSB0b19saXN0KHBhdGgsIFtdLCBcIi5cIik7XG5cdGZvciAoayA9IDA7IGsgPCBwYXRoLmxlbmd0aDsgaysrKSB7XG5cdFx0c2VnID0gcGF0aFtrXTtcblx0XHRpZiAodHlwZW9mIGN1cnJbc2VnXSA9PT0gXCJvYmplY3RcIikge1xuXHRcdFx0Y3VyciA9IGN1cnJbc2VnXTtcblx0XHR9IGVsc2UgaWYgKGsgPT09IHBhdGgubGVuZ3RoIC0gMSkge1xuXHRcdFx0Y3VycltzZWddID0gdmFsdWU7XG5cdFx0XHRicmVhaztcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y3VycltzZWddID0ge307XG5cdFx0XHRjdXJyID0gY3VycltzZWddO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gb2JqZWN0O1xufVxuXG5aZXNrLm9iamVjdF9wYXRoID0gb2JqZWN0X3BhdGg7XG5aZXNrLm9iamVjdF9zZXRfcGF0aCA9IG9iamVjdF9zZXRfcGF0aDtcblxuZnVuY3Rpb24gaG9va19wYXRoKGhvb2spIHtcblx0aG9vayA9IFN0cmluZyhob29rKS50b0xvd2VyQ2FzZSgpO1xuXHRob29rID0gdG9fbGlzdChob29rLCBbXSwgXCI6OlwiKTtcblx0aWYgKGhvb2subGVuZ3RoID09PSAxKSB7XG5cdFx0aG9vay5wdXNoKFwiKlwiKTtcblx0fVxuXHRyZXR1cm4gaG9vaztcbn1cblxuT2JqZWN0LmFzc2lnbihaZXNrLCB7XG5cdGQ6IGQsXG5cdHNldHRpbmdzOiB7fSwgLy8gUGxhY2UgbW9kdWxlIGRhdGEgaGVyZSFcblx0aG9va3M6IGhvb2tzLCAvLyBNb2R1bGUgaG9va3MgZ28gaGVyZSAtIHVzZSBhZGRfaG9vayBhbmQgaG9vayB0byB1c2Vcblx0dzogVyxcblx0dXJsX3BhcnRzOiB7XG5cdFx0cGF0aDogTC5wYXRobmFtZSxcblx0XHRob3N0OiBMLmhvc3QsXG5cdFx0cXVlcnk6IEwuc2VhcmNoLFxuXHRcdHNjaGVtZTogTC5wcm90b2NvbCxcblx0XHR1cmw6IGQuVVJMLFxuXHRcdHVyaTogTC5wYXRobmFtZSArIEwuc2VhcmNoLFxuXHR9LFxuXHRwYWdlX3NjcmlwdHM6IG51bGwsXG5cdHF1ZXJ5X2dldDogZnVuY3Rpb24odiwgZGVmKSB7XG5cdFx0ZGVmID0gZGVmIHx8IG51bGw7XG5cdFx0dmFyIHBhaXIsXG5cdFx0XHRpLFxuXHRcdFx0dSA9IGQuVVJMLnRvU3RyaW5nKCkucmlnaHQoXCI/XCIsIG51bGwpO1xuXHRcdGlmICghdSkge1xuXHRcdFx0cmV0dXJuIGRlZjtcblx0XHR9XG5cdFx0dSA9IHUuc3BsaXQoXCImXCIpO1xuXHRcdGZvciAoaSA9IDA7IGkgPCB1Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRwYWlyID0gdVtpXS5zcGxpdChcIj1cIiwgMik7XG5cdFx0XHRpZiAocGFpclswXSA9PT0gdikge1xuXHRcdFx0XHRyZXR1cm4gcGFpclsxXSB8fCBwYWlyWzBdO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gZGVmO1xuXHR9LFxuXHQvKipcblx0ICogQHBhcmFtIG5hbWUgc3RyaW5nIE5hbWUgb2YgY29va2llIHRvIHNldC9nZXRcblx0ICogQHBhcmFtIHZhbHVlIHN0cmluZyBWYWx1ZSBvZiBjb29raWUgdG8gc2V0XG5cdCAqIEBwYXJhbSBvcHRpb25zIG9iamVjdCBFeHRyYSBvcHRpb25zOiB0dGw6IGludGVnZXIgKHNlY29uZHMpLCBkb21haW46IHN0cmluZ1xuXHQgKi9cblx0Y29va2llOiBmdW5jdGlvbihuYW1lLCB2YWx1ZSwgb3B0aW9ucykge1xuXHRcdHZhciBnZXRjb29raWUgPSBmdW5jdGlvbihuKSB7XG5cdFx0XHRcdHZhciBjID0gZC5jb29raWU7XG5cdFx0XHRcdHZhciBzID0gYy5sYXN0SW5kZXhPZihuICsgXCI9XCIpO1xuXHRcdFx0XHRpZiAocyA8IDApIHtcblx0XHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdFx0fVxuXHRcdFx0XHRzICs9IG4ubGVuZ3RoICsgMTtcblx0XHRcdFx0dmFyIGUgPSBjLmluZGV4T2YoXCI7XCIsIHMpO1xuXHRcdFx0XHRpZiAoZSA8IDApIHtcblx0XHRcdFx0XHRlID0gYy5sZW5ndGg7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIFcudW5lc2NhcGUoYy5zdWJzdHJpbmcocywgZSkpO1xuXHRcdFx0fSxcblx0XHRcdHNldGNvb2tpZSA9IGZ1bmN0aW9uKG4sIHYsIG9wdGlvbnMpIHtcblx0XHRcdFx0dmFyIGEgPSBuZXcgRGF0ZSgpLFxuXHRcdFx0XHRcdHQgPSBwYXJzZUludChvcHRpb25zLnR0bCwgMTApIHx8IC0xLFxuXHRcdFx0XHRcdG0gPSBvcHRpb25zLmRvbWFpbiB8fCBudWxsO1xuXHRcdFx0XHRpZiAodCA8PSAwKSB7XG5cdFx0XHRcdFx0YS5zZXRGdWxsWWVhcigyMDMwKTtcblx0XHRcdFx0fSBlbHNlIGlmICh0ID4gMCkge1xuXHRcdFx0XHRcdGEuc2V0VGltZShhLmdldFRpbWUoKSArIHQgKiAxMDAwKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRkLmNvb2tpZSA9IG4gKyBcIj1cIiArIFcuZXNjYXBlKHYpICsgXCI7IHBhdGg9LzsgZXhwaXJlcz1cIiArIGEudG9HTVRTdHJpbmcoKSArIChtID8gXCI7IGRvbWFpbj1cIiArIG0gOiBcIlwiKTtcblx0XHRcdFx0cmV0dXJuIHY7XG5cdFx0XHR9LFxuXHRcdFx0ZGVsZXRlX2Nvb2tpZSA9IGZ1bmN0aW9uKG5hbWUsIGRvbSkge1xuXHRcdFx0XHR2YXIgbm93ID0gbmV3IERhdGUoKSxcblx0XHRcdFx0XHRlID0gbmV3IERhdGUobm93LmdldFRpbWUoKSAtIDg2NDAwKTtcblx0XHRcdFx0ZC5jb29raWUgPSBuYW1lICsgXCI9OyBwYXRoPS87IGV4cGlyZXM9XCIgKyBlLnRvR01UU3RyaW5nKCkgKyAoZG9tID8gXCI7IGRvbWFpbj1cIiArIGRvbSA6IFwiXCIpO1xuXHRcdFx0fTtcblx0XHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblx0XHRpZiAodmFsdWUgPT09IG51bGwpIHtcblx0XHRcdGRlbGV0ZV9jb29raWUobmFtZSwgb3B0aW9ucy5kb20gfHwgbnVsbCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHJldHVybiBhcmd1bWVudHMubGVuZ3RoID09PSAxID8gZ2V0Y29va2llKG5hbWUpIDogc2V0Y29va2llKG5hbWUsIHZhbHVlLCBvcHRpb25zKTtcblx0fSxcblx0Y3NzOiBmdW5jdGlvbihwKSB7XG5cdFx0dmFyIGNzcyA9IGQuY3JlYXRlRWxlbWVudChcImxpbmtcIik7XG5cdFx0Y3NzLnJlbCA9IFwic3R5bGVzaGVldFwiO1xuXHRcdGNzcy5ocmVmID0gcDtcblx0XHRjc3MubWVkaWEgPSBhcmd1bWVudHNbMV0gfHwgXCJhbGxcIjtcblx0XHRkLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaGVhZFwiKVswXS5hcHBlbmRDaGlsZChjc3MpO1xuXHR9LFxuXHRsb2c6IGZ1bmN0aW9uKCkge1xuXHRcdGlmIChXLmNvbnNvbGUgJiYgVy5jb25zb2xlLmxvZykge1xuXHRcdFx0Vy5jb25zb2xlLmxvZyhhcmd1bWVudHMpO1xuXHRcdH1cblx0fSxcblx0YWRkX2hvb2s6IGZ1bmN0aW9uKGhvb2ssIGZ1bikge1xuXHRcdHZhciBwYXRoID0gaG9va19wYXRoKGhvb2spLFxuXHRcdFx0Y3VyciA9IG9iamVjdF9wYXRoKGhvb2tzLCBwYXRoKTtcblx0XHRpZiAoY3Vycikge1xuXHRcdFx0Y3Vyci5wdXNoKGZ1bik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGN1cnIgPSBbZnVuXTtcblx0XHRcdG9iamVjdF9zZXRfcGF0aChob29rcywgcGF0aCwgY3Vycik7XG5cdFx0fVxuXHR9LFxuXHRoYXNfaG9vazogZnVuY3Rpb24oaG9vaykge1xuXHRcdHZhciBmdW5jcyA9IG9iamVjdF9wYXRoKGhvb2tzLCBob29rX3BhdGgoaG9vayksIG51bGwpO1xuXHRcdHJldHVybiBmdW5jcyA/IHRydWUgOiBmYWxzZTtcblx0fSxcblx0aG9vazogZnVuY3Rpb24oaG9vaykge1xuXHRcdHZhciBwYXRoID0gaG9va19wYXRoKGhvb2spLFxuXHRcdFx0YXJncyA9IFplc2suY2xvbmUoYXJndW1lbnRzKSxcblx0XHRcdGZ1bmNzID0gb2JqZWN0X3BhdGgoaG9va3MsIHBhdGgsIG51bGwpLFxuXHRcdFx0cmVzdWx0cyA9IFtdLFxuXHRcdFx0aTtcblx0XHRpZiAoIWZ1bmNzKSB7XG5cdFx0XHRyZXR1cm4gcmVzdWx0cztcblx0XHR9XG5cdFx0aWYgKGFyZ3MubGVuZ3RoID4gMSkge1xuXHRcdFx0YXJncy5zaGlmdCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRhcmdzID0gW107XG5cdFx0fVxuXG5cdFx0Zm9yIChpID0gMDsgaSA8IGZ1bmNzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRyZXN1bHRzLnB1c2goZnVuY3NbaV0uYXBwbHkobnVsbCwgYXJncykpO1xuXHRcdH1cblx0XHRyZXR1cm4gcmVzdWx0cztcblx0fSxcblx0Z2V0X3BhdGg6IGZ1bmN0aW9uKHBhdGgsIGRlZikge1xuXHRcdHJldHVybiBvYmplY3RfcGF0aChaZXNrLnNldHRpbmdzLCBwYXRoLCBkZWYpO1xuXHR9LFxuXHRzZXRfcGF0aDogZnVuY3Rpb24ocGF0aCwgdmFsdWUpIHtcblx0XHRyZXR1cm4gb2JqZWN0X3NldF9wYXRoKFplc2suc2V0dGluZ3MsIHBhdGgsIHZhbHVlKTtcblx0fSxcblx0Z2V0OiBmdW5jdGlvbihuKSB7XG5cdFx0dmFyIGEgPSBhcmd1bWVudHM7XG5cdFx0cmV0dXJuIGF2YWx1ZShaZXNrLnNldHRpbmdzLCBuLCBhLmxlbmd0aCA+IDEgPyBhWzFdIDogbnVsbCk7XG5cdH0sXG5cdGdldGI6IGZ1bmN0aW9uKG4pIHtcblx0XHR2YXIgYSA9IGFyZ3VtZW50cyxcblx0XHRcdGQgPSBhLmxlbmd0aCA+IDEgPyBhWzFdIDogZmFsc2U7XG5cdFx0cmV0dXJuIHRvX2Jvb2woWmVzay5nZXQobiwgZCkpO1xuXHR9LFxuXHRzZXQ6IGZ1bmN0aW9uKG4sIHYpIHtcblx0XHR2YXIgYSA9IGFyZ3VtZW50cyxcblx0XHRcdG92ZXJ3cml0ZSA9IGEubGVuZ3RoID4gMiA/IHRvX2Jvb2woYVsyXSkgOiB0cnVlO1xuXHRcdGlmICghb3ZlcndyaXRlICYmIHR5cGVvZiBaZXNrLnNldHRpbmdzW25dICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cdFx0XHRyZXR1cm4gWmVzay5zZXR0aW5nc1tuXTtcblx0XHR9XG5cdFx0WmVzay5zZXR0aW5nc1tuXSA9IHY7XG5cdFx0cmV0dXJuIHY7XG5cdH0sXG5cdGluaGVyaXQ6IGZ1bmN0aW9uKHRoZV9jbGFzcywgc3VwZXJfY2xhc3MsIHByb3RvdHlwZSkge1xuXHRcdC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTExNDAyNC9jb25zdHJ1Y3RvcnMtaW4tamF2YXNjcmlwdC1vYmplY3RzXG5cdFx0dmFyIG1ldGhvZCxcblx0XHRcdENvbnN0cnVjdCA9IGZ1bmN0aW9uKCkge307XG5cdFx0c3VwZXJfY2xhc3MgPSBzdXBlcl9jbGFzcyB8fCBPYmplY3Q7XG5cdFx0Q29uc3RydWN0LnByb3RvdHlwZSA9IHN1cGVyX2NsYXNzLnByb3RvdHlwZTtcblx0XHR0aGVfY2xhc3MucHJvdG90eXBlID0gbmV3IENvbnN0cnVjdCgpO1xuXHRcdHRoZV9jbGFzcy5wcm90b3R5cGUuY29uc3RydWN0b3IgPSB0aGVfY2xhc3M7XG5cdFx0dGhlX2NsYXNzW1wic3VwZXJcIl0gPSBzdXBlcl9jbGFzcztcblx0XHRpZiAocHJvdG90eXBlIGluc3RhbmNlb2YgT2JqZWN0KSB7XG5cdFx0XHRmb3IgKG1ldGhvZCBpbiBwcm90b3R5cGUpIHtcblx0XHRcdFx0aWYgKHByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eShtZXRob2QpKSB7XG5cdFx0XHRcdFx0aWYgKCF0aGVfY2xhc3MucHJvdG90eXBlW21ldGhvZF0pIHtcblx0XHRcdFx0XHRcdHRoZV9jbGFzcy5wcm90b3R5cGVbbWV0aG9kXSA9IHByb3RvdHlwZVttZXRob2RdO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHR0aGVfY2xhc3MucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gWmVzay5jbG9uZSh0aGlzKTtcblx0XHR9O1xuXHRcdHJldHVybiB0aGVfY2xhc3M7XG5cdH0sXG5cdC8qKlxuXHQgKiBJdGVyYXRlIG92ZXIgYW4gb2JqZWN0LCBjYWxsaW5nIGEgZnVuY3Rpb24gb25jZSBwZXIgZWxlbWVudFxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdHxhcnJheX0geFxuXHQgKiBAcGFyYW0ge2Z1bmN0aW9ufSBmbiB3aXRoIHNpZ25hdHVyZSAoa2V5LCB2YWx1ZSwgY29sbGVjdGlvbikgXCJ0aGlzXCIgaXMgc2V0IHRvIHRoZSB2YWx1ZSBhcyB3ZWxsXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gdGVybV9mYWxzZSBTZXQgdG8gdHJ1ZSB0byB0ZXJtaW5hdGUgd2hlbiBmdW5jdGlvbiByZXR1cm5zIGEgZmFsc2UtaXNoIHZhbHVlIGFzIG9wcG9zZWQgdG8gYSB0cnVlLWlzaCB2YWx1ZVxuXHQgKi9cblx0ZWFjaDogZnVuY3Rpb24oeCwgZm4sIHRlcm1fZmFsc2UpIHtcblx0XHR2YXIgaSwgcjtcblx0XHR0ZXJtX2ZhbHNlID0gdG9fYm9vbCh0ZXJtX2ZhbHNlKTtcblx0XHRpZiAoaXNfYXJyYXkoeCkpIHtcblx0XHRcdGZvciAoaSA9IDA7IGkgPCB4Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdHIgPSBmbi5jYWxsKHhbaV0sIGksIHhbaV0sIHgpO1xuXHRcdFx0XHRpZiAodGVybV9mYWxzZSkge1xuXHRcdFx0XHRcdGlmICghcikge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHI7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2UgaWYgKHIpIHtcblx0XHRcdFx0XHRyZXR1cm4gcjtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAoaXNfb2JqZWN0KHgpKSB7XG5cdFx0XHRmb3IgKGkgaW4geCkge1xuXHRcdFx0XHRpZiAoeC5oYXNPd25Qcm9wZXJ0eShpKSkge1xuXHRcdFx0XHRcdHIgPSBmbi5jYWxsKHhbaV0sIGksIHhbaV0sIHgpO1xuXHRcdFx0XHRcdGlmICh0ZXJtX2ZhbHNlKSB7XG5cdFx0XHRcdFx0XHRpZiAoIXIpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHI7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSBlbHNlIGlmIChyKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gcjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIGZuLmNhbGwoeCwgMCwgeCwgeCk7XG5cdFx0fVxuXHR9LFxuXHR0cGw6IGZ1bmN0aW9uKG1peGVkLCBtYXApIHtcblx0XHRyZXR1cm4gJChtaXhlZClcblx0XHRcdC5odG1sKClcblx0XHRcdC5tYXAobWFwLCBmYWxzZSk7XG5cdH0sXG5cdHNjcmlwdF9zcmNfbm9ybWFsaXplOiBmdW5jdGlvbihzcmMpIHtcblx0XHR2YXIgbWF0Y2hlcyxcblx0XHRcdHBhcnRzID0gWmVzay51cmxfcGFydHM7XG5cdFx0c3JjID0gc3JjLnVucHJlZml4KHBhcnRzLnNjaGVtZSArIFwiOi8vXCIgKyBwYXJ0cy5ob3N0KTtcblx0XHRtYXRjaGVzID0gc3JjLm1hdGNoKC8oLiopXFw/X3Zlcj1bMC05XSskLyk7XG5cdFx0aWYgKG1hdGNoZXMgIT09IG51bGwpIHtcblx0XHRcdHNyYyA9IG1hdGNoZXNbMV07XG5cdFx0fVxuXHRcdHJldHVybiBzcmM7XG5cdH0sXG5cdHNjcmlwdHNfaW5pdDogZnVuY3Rpb24oKSB7XG5cdFx0WmVzay5wYWdlX3NjcmlwdHMgPSB7fTtcblx0XHQkKCdzY3JpcHRbdHlwZT1cInRleHQvamF2YXNjcmlwdFwiXVtzcmNdJykuZWFjaChmdW5jdGlvbigpIHtcblx0XHRcdFplc2suc2NyaXB0X2FkZCgkKHRoaXMpLmF0dHIoXCJzcmNcIikpO1xuXHRcdH0pO1xuXHR9LFxuXHRzY3JpcHRfYWRkOiBmdW5jdGlvbihzcmMpIHtcblx0XHRpZiAoWmVzay5wYWdlX3NjcmlwdHMgPT09IG51bGwpIHtcblx0XHRcdFplc2suc2NyaXB0c19pbml0KCk7XG5cdFx0fVxuXHRcdFplc2sucGFnZV9zY3JpcHRzW3NyY10gPSB0cnVlO1xuXHRcdFplc2sucGFnZV9zY3JpcHRzW1plc2suc2NyaXB0X3NyY19ub3JtYWxpemUoc3JjKV0gPSB0cnVlO1xuXHR9LFxuXHRzY3JpcHRzOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoWmVzay5wYWdlX3NjcmlwdHMgPT09IG51bGwpIHtcblx0XHRcdFplc2suc2NyaXB0c19pbml0KCk7XG5cdFx0fVxuXHRcdHJldHVybiBaZXNrLnBhZ2Vfc2NyaXB0cztcblx0fSxcblx0c2NyaXB0c19jYWNoZWQ6IGZ1bmN0aW9uKHNyY3MpIHtcblx0XHRaZXNrLmVhY2goc3JjcywgZnVuY3Rpb24oKSB7XG5cdFx0XHRaZXNrLnNjcmlwdF9hZGQodGhpcyk7XG5cdFx0fSk7XG5cdH0sXG5cdHNjcmlwdF9sb2FkZWQ6IGZ1bmN0aW9uKHNyYykge1xuXHRcdHZhciBzY3JpcHRzID0gWmVzay5zY3JpcHRzKCksXG5cdFx0XHRyZXN1bHQgPSBzY3JpcHRzW3NyY10gfHwgc2NyaXB0c1taZXNrLnNjcmlwdF9zcmNfbm9ybWFsaXplKHNyYyldIHx8IGZhbHNlO1xuXHRcdC8vIFplc2subG9nKFwiWmVzay5zY3JpcHRfbG9hZGVkKFwiICsgc3JjICsgXCIpID0gXCIgKyAocmVzdWx0ID8gXCJ0cnVlXCI6XG5cdFx0Ly8gXCJmYWxzZVwiKSk7XG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fSxcblx0c3R5bGVzaGVldF9sb2FkZWQ6IGZ1bmN0aW9uKGhyZWYsIG1lZGlhKSB7XG5cdFx0cmV0dXJuICQoJ2xpbmtbcmVsPVwic3R5bGVzaGVldFwiXVtocmVmPVwiJyArIGhyZWYgKyAnXCJdW21lZGlhPVwiJyArIG1lZGlhICsgJ1wiJykubGVuZ3RoID4gMDtcblx0fSxcblx0bWVzc2FnZTogZnVuY3Rpb24obWVzc2FnZSwgb3B0aW9ucykge1xuXHRcdGlmIChpc19zdHJpbmcob3B0aW9ucykpIHtcblx0XHRcdG9wdGlvbnMgPSB7IGxldmVsOiBvcHRpb25zIH07XG5cdFx0fVxuXHRcdFplc2suaG9vayhcIm1lc3NhZ2VcIiwgbWVzc2FnZSwgb3B0aW9ucyk7XG5cdFx0WmVzay5sb2cobWVzc2FnZSwgb3B0aW9ucyk7XG5cdH0sXG5cdHJlZ2V4cF9xdW90ZTogZnVuY3Rpb24oc3RyLCBkZWxpbWl0ZXIpIHtcblx0XHRyZXR1cm4gU3RyaW5nKHN0cikucmVwbGFjZShcblx0XHRcdG5ldyBSZWdFeHAoXCJbLlxcXFxcXFxcKyo/XFxcXFtcXFxcXlxcXFxdJCgpe309ITw+fDpcXFxcXCIgKyAoZGVsaW1pdGVyIHx8IFwiXCIpICsgXCItXVwiLCBcImdcIiksXG5cdFx0XHRcIlxcXFwkJlwiXG5cdFx0KTtcblx0fSxcbn0pO1xuXG5aZXNrLmNsb25lID0gZnVuY3Rpb24ob2JqZWN0KSB7XG5cdHZhciBjbG9uZSwgcHJvcCwgQ29uc3RydWN0b3I7XG5cdGlmIChvYmplY3QgPT09IG51bGwpIHtcblx0XHRyZXR1cm4gb2JqZWN0O1xuXHR9XG5cdGlmIChpc19mdW5jdGlvbihvYmplY3QpKSB7XG5cdFx0cmV0dXJuIG9iamVjdDtcblx0fVxuXHRpZiAoaXNfYXJyYXkob2JqZWN0KSB8fCBaZXNrLmdldHR5cGUob2JqZWN0KSA9PT0gXCJhcmd1bWVudHNcIikge1xuXHRcdGNsb25lID0gW107XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBvYmplY3QubGVuZ3RoOyBpKyspIHtcblx0XHRcdGNsb25lLnB1c2goWmVzay5jbG9uZShvYmplY3RbaV0pKTtcblx0XHR9XG5cdFx0cmV0dXJuIGNsb25lO1xuXHR9XG5cdGlmICghaXNfb2JqZWN0KG9iamVjdCkpIHtcblx0XHRyZXR1cm4gb2JqZWN0O1xuXHR9XG5cdENvbnN0cnVjdG9yID0gb2JqZWN0LmNvbnN0cnVjdG9yO1xuXHRzd2l0Y2ggKENvbnN0cnVjdG9yKSB7XG5cdFx0Y2FzZSBSZWdFeHA6XG5cdFx0XHRjbG9uZSA9IG5ldyBDb25zdHJ1Y3Rvcihcblx0XHRcdFx0b2JqZWN0LnNvdXJjZSxcblx0XHRcdFx0XCJnXCIuc3Vic3RyKDAsIE51bWJlcihvYmplY3QuZ2xvYmFsKSkgK1xuXHRcdFx0XHRcdFwiaVwiLnN1YnN0cigwLCBOdW1iZXIob2JqZWN0Lmlnbm9yZUNhc2UpKSArXG5cdFx0XHRcdFx0XCJtXCIuc3Vic3RyKDAsIE51bWJlcihvYmplY3QubXVsdGlsaW5lKSlcblx0XHRcdCk7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlIERhdGU6XG5cdFx0XHRjbG9uZSA9IG5ldyBDb25zdHJ1Y3RvcihvYmplY3QuZ2V0VGltZSgpKTtcblx0XHRcdGJyZWFrO1xuXHRcdGRlZmF1bHQ6XG5cdFx0XHQvLyBDYW4gbm90IGNvcHkgdW5rbm93biBvYmplY3RzXG5cdFx0XHRyZXR1cm4gb2JqZWN0O1xuXHR9XG5cdGZvciAocHJvcCBpbiBvYmplY3QpIHtcblx0XHRpZiAob2JqZWN0Lmhhc093blByb3BlcnR5KHByb3ApKSB7XG5cdFx0XHRjbG9uZVtwcm9wXSA9IFplc2suY2xvbmUob2JqZWN0W3Byb3BdKTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIGNsb25lO1xufTtcblxuT2JqZWN0LmFzc2lnbihBcnJheS5wcm90b3R5cGUsIHtcblx0Y29udGFpbnM6IGZ1bmN0aW9uKHgpIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmICh0aGlzW2ldID09PSB4KSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH0sXG5cdHJlbW92ZTogZnVuY3Rpb24oeCkge1xuXHRcdHZhciB0ZW1wID0gdGhpcy5zbGljZSgwKTtcblx0XHR0ZW1wLnNwbGljZSh4LCAxKTtcblx0XHRyZXR1cm4gdGVtcDtcblx0fSxcblx0LyoqXG5cdCAqIEpvaW4gZWxlbWVudHMgb2YgYW4gYXJyYXkgYnkgd3JhcHBpbmcgZWFjaCBvbmUgd2l0aCBhIHByZWZpeC9zdWZmaXhcblx0ICpcblx0ICogQHBhcmFtIHN0cmluZ1xuXHQgKiAgICAgICAgICAgIHByZWZpeFxuXHQgKiBAcGFyYW0gc3RyaW5nXG5cdCAqICAgICAgICAgICAgc3VmZml4XG5cdCAqIEByZXR1cm4gc3RyaW5nXG5cdCAqL1xuXHRqb2luX3dyYXA6IGZ1bmN0aW9uKHByZWZpeCwgc3VmZml4KSB7XG5cdFx0cHJlZml4ID0gU3RyaW5nKHByZWZpeCkgfHwgXCJcIjtcblx0XHRzdWZmaXggPSBTdHJpbmcoc3VmZml4KSB8fCBcIlwiO1xuXHRcdHJldHVybiBwcmVmaXggKyB0aGlzLmpvaW4oc3VmZml4ICsgcHJlZml4KSArIHN1ZmZpeDtcblx0fSxcbn0pO1xuXG5PYmplY3QuYXNzaWduKE9iamVjdCwge1xuXHRmcm9tQ2FtZWxDYXNlOiBmdW5jdGlvbihmcm9tKSB7XG5cdFx0dmFyIHRvID0ge307XG5cdFx0Zm9yICh2YXIgaSBpbiBmcm9tKSB7XG5cdFx0XHRpZiAoZnJvbS5oYXNPd25Qcm9wZXJ0eShpKSkge1xuXHRcdFx0XHR0b1tpLmZyb21DYW1lbENhc2UoKV0gPSBmcm9tW2ldO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gdG87XG5cdH0sXG5cdHRvQ2FtZWxDYXNlOiBmdW5jdGlvbihmcm9tKSB7XG5cdFx0dmFyIHRvID0ge307XG5cdFx0Zm9yICh2YXIgaSBpbiB0aGlzKSB7XG5cdFx0XHRpZiAoZnJvbS5oYXNPd25Qcm9wZXJ0eShpKSkge1xuXHRcdFx0XHR0b1tpLnRvQ2FtZWxDYXNlKCldID0gZnJvbVtpXTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIHRvO1xuXHR9LFxufSk7XG5cbk9iamVjdC5hc3NpZ24oU3RyaW5nLnByb3RvdHlwZSwge1xuXHRjb21wYXJlOiBmdW5jdGlvbihhKSB7XG5cdFx0cmV0dXJuIHRoaXMgPCBhID8gLTEgOiB0aGlzID09PSBhID8gMCA6IDE7XG5cdH0sXG5cdGxlZnQ6IGZ1bmN0aW9uKGRlbGltLCBkZWYpIHtcblx0XHR2YXIgcG9zID0gdGhpcy5pbmRleE9mKGRlbGltKTtcblx0XHRyZXR1cm4gcG9zIDwgMCA/IGF2YWx1ZShhcmd1bWVudHMsIDEsIGRlZiB8fCB0aGlzKSA6IHRoaXMuc3Vic3RyKDAsIHBvcyk7XG5cdH0sXG5cdHJsZWZ0OiBmdW5jdGlvbihkZWxpbSwgZGVmKSB7XG5cdFx0dmFyIHBvcyA9IHRoaXMubGFzdEluZGV4T2YoZGVsaW0pO1xuXHRcdHJldHVybiBwb3MgPCAwID8gYXZhbHVlKGFyZ3VtZW50cywgMSwgZGVmIHx8IHRoaXMpIDogdGhpcy5zdWJzdHIoMCwgcG9zKTtcblx0fSxcblx0cmlnaHQ6IGZ1bmN0aW9uKGRlbGltLCBkZWYpIHtcblx0XHR2YXIgcG9zID0gdGhpcy5pbmRleE9mKGRlbGltKTtcblx0XHRyZXR1cm4gcG9zIDwgMCA/IGF2YWx1ZShhcmd1bWVudHMsIDEsIGRlZiB8fCB0aGlzKSA6IHRoaXMuc3Vic3RyKHBvcyArIGRlbGltLmxlbmd0aCk7XG5cdH0sXG5cdHJyaWdodDogZnVuY3Rpb24oZGVsaW0sIGRlZikge1xuXHRcdHZhciBwb3MgPSB0aGlzLmxhc3RJbmRleE9mKGRlbGltKTtcblx0XHRyZXR1cm4gcG9zIDwgMCA/IGF2YWx1ZShhcmd1bWVudHMsIDEsIGRlZiB8fCB0aGlzKSA6IHRoaXMuc3Vic3RyKHBvcyArIGRlbGltLmxlbmd0aCk7XG5cdH0sXG5cdGx0cmltOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5yZXBsYWNlKC9eXFxzKy8sIFwiXCIpO1xuXHR9LFxuXHRydHJpbTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMucmVwbGFjZSgvXFxzKyQvLCBcIlwiKTtcblx0fSxcblx0dHJpbTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMucmVwbGFjZSgvXlxccysvLCBcIlwiKS5yZXBsYWNlKC9cXHMrJC8sIFwiXCIpO1xuXHR9LFxuXHQvKipcblx0ICogQGRlcHJlY2F0ZWRcblx0ICogQHBhcmFtIHhcblx0ICogICAgICAgICAgICBTdHJpbmcgdG8gbG9vayBhdFxuXHQgKi9cblx0ZW5kc193aXRoOiBmdW5jdGlvbih4KSB7XG5cdFx0cmV0dXJuIHRoaXMuZW5kcyh4KTtcblx0fSxcblx0ZW5kczogZnVuY3Rpb24oeCkge1xuXHRcdHZhciB4biA9IHgubGVuZ3RoLFxuXHRcdFx0biA9IHRoaXMubGVuZ3RoO1xuXHRcdGlmICh4biA+IG4pIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMuc3Vic3RyaW5nKG4gLSB4biwgbikgPT09IHg7XG5cdH0sXG5cdGJlZ2luc2k6IGZ1bmN0aW9uKHN0cmluZykge1xuXHRcdHZhciBsZW4gPSBzdHJpbmcubGVuZ3RoO1xuXHRcdGlmIChsZW4gPiB0aGlzLmxlbmd0aCkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5zdWJzdHIoMCwgbGVuKS50b0xvd2VyQ2FzZSgpID09PSBzdHJpbmcudG9Mb3dlckNhc2UoKTtcblx0fSxcblx0YmVnaW5zOiBmdW5jdGlvbihzdHJpbmcpIHtcblx0XHR2YXIgbGVuID0gc3RyaW5nLmxlbmd0aDtcblx0XHRpZiAobGVuID4gdGhpcy5sZW5ndGgpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMuc3Vic3RyKDAsIGxlbikgPT09IHN0cmluZztcblx0fSxcblx0c3RyX3JlcGxhY2U6IGZ1bmN0aW9uKHMsIHIpIHtcblx0XHR2YXIgc3RyID0gdGhpcztcblx0XHR2YXIgaTtcblx0XHRpZiAoaXNfc3RyaW5nKHMpKSB7XG5cdFx0XHRpZiAoaXNfc3RyaW5nKHIpKSB7XG5cdFx0XHRcdHJldHVybiB0aGlzLnNwbGl0KHMpLmpvaW4ocik7XG5cdFx0XHR9XG5cdFx0XHRmb3IgKGkgPSAwOyBpIDwgci5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRzdHIgPSBzdHIuc3RyX3JlcGxhY2UocywgcltpXSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gc3RyO1xuXHRcdH1cblx0XHRpZiAoaXNfc3RyaW5nKHIpKSB7XG5cdFx0XHRmb3IgKGkgPSAwOyBpIDwgcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRzdHIgPSBzdHIuc3RyX3JlcGxhY2Uoc1tpXSwgcik7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gc3RyO1xuXHRcdH1cblx0XHR2YXIgbiA9IE1hdGgubWluKHMubGVuZ3RoLCByLmxlbmd0aCk7XG5cdFx0Zm9yIChpID0gMDsgaSA8IG47IGkrKykge1xuXHRcdFx0c3RyID0gc3RyLnN0cl9yZXBsYWNlKHNbaV0sIHJbaV0pO1xuXHRcdH1cblx0XHRyZXR1cm4gc3RyO1xuXHR9LFxuXHR0cjogZnVuY3Rpb24ob2JqZWN0KSB7XG5cdFx0dmFyIGssXG5cdFx0XHRzZWxmID0gdGhpcztcblx0XHRmb3IgKGsgaW4gb2JqZWN0KSB7XG5cdFx0XHRpZiAob2JqZWN0Lmhhc093blByb3BlcnR5KGspKSB7XG5cdFx0XHRcdHNlbGYgPSBzZWxmLnN0cl9yZXBsYWNlKGssIG9iamVjdFtrXSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBzZWxmO1xuXHR9LFxuXHRtYXA6IGZ1bmN0aW9uKG9iamVjdCwgY2FzZV9pbnNlbnNpdGl2ZSkge1xuXHRcdHZhciBrLFxuXHRcdFx0c3VmZml4ID0gXCJcIixcblx0XHRcdHNlbGY7XG5cdFx0Y2FzZV9pbnNlbnNpdGl2ZSA9ICEhY2FzZV9pbnNlbnNpdGl2ZTsgLy8gQ29udmVydCB0byBib29sXG5cdFx0aWYgKCFpc19vYmplY3Qob2JqZWN0KSkge1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXHRcdHNlbGYgPSB0aGlzO1xuXHRcdGlmIChjYXNlX2luc2Vuc2l0aXZlKSB7XG5cdFx0XHRvYmplY3QgPSBaZXNrLmNoYW5nZV9rZXlfY2FzZShvYmplY3QpO1xuXHRcdFx0c3VmZml4ID0gXCJpXCI7XG5cdFx0fVxuXHRcdGZvciAoayBpbiBvYmplY3QpIHtcblx0XHRcdGlmIChvYmplY3QuaGFzT3duUHJvcGVydHkoaykpIHtcblx0XHRcdFx0dmFyIHZhbHVlID0gb2JqZWN0W2tdLFxuXHRcdFx0XHRcdHJlcGxhY2UgPSB2YWx1ZSA9PT0gbnVsbCA/IFwiXCIgOiBTdHJpbmcob2JqZWN0W2tdKTtcblx0XHRcdFx0c2VsZiA9IHNlbGYucmVwbGFjZShuZXcgUmVnRXhwKFwiXFxcXHtcIiArIGsgKyBcIlxcXFx9XCIsIFwiZ1wiICsgc3VmZml4KSwgcmVwbGFjZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBzZWxmO1xuXHR9LFxuXHR0b19hcnJheTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGksXG5cdFx0XHRyID0gW107XG5cdFx0Zm9yIChpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHIucHVzaCh0aGlzLmNoYXJBdChpKSk7XG5cdFx0fVxuXHRcdHJldHVybiByO1xuXHR9LFxuXHR1bnF1b3RlOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgbiA9IHRoaXMubGVuZ3RoO1xuXHRcdHZhciBxID0gYXJndW1lbnRzWzBdIHx8IFwiXFxcIlxcXCInJ1wiO1xuXHRcdHZhciBwID0gcS5pbmRleE9mKHRoaXMuc3Vic3RyaW5nKDAsIDEpKTtcblx0XHRpZiAocCA8IDApIHtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH1cblx0XHRpZiAodGhpcy5zdWJzdHJpbmcobiAtIDEsIG4pID09PSBxLmNoYXJBdChwICsgMSkpIHtcblx0XHRcdHJldHVybiB0aGlzLnN1YnN0cmluZygxLCBuIC0gMSk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHR0b0NhbWVsQ2FzZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHJlc3VsdCA9IFwiXCI7XG5cdFx0WmVzay5lYWNoKHRoaXMuc3BsaXQoXCJfXCIpLCBmdW5jdGlvbigpIHtcblx0XHRcdHJlc3VsdCArPSB0aGlzLnN1YnN0cigwLCAxKS50b1VwcGVyQ2FzZSgpICsgdGhpcy5zdWJzdHIoMSkudG9Mb3dlckNhc2UoKTtcblx0XHR9KTtcblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9LFxuXHRmcm9tQ2FtZWxDYXNlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5yZXBsYWNlKC9bQS1aXS9nLCBmdW5jdGlvbih2KSB7XG5cdFx0XHRyZXR1cm4gXCJfXCIgKyB2LnRvTG93ZXJDYXNlKCk7XG5cdFx0fSk7XG5cdH0sXG5cdHVucHJlZml4OiBmdW5jdGlvbihzdHJpbmcsIGRlZikge1xuXHRcdGlmICh0aGlzLmJlZ2lucyhzdHJpbmcpKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5zdWJzdHIoc3RyaW5nLmxlbmd0aCk7XG5cdFx0fVxuXHRcdHJldHVybiBkZWYgfHwgdGhpcztcblx0fSxcbn0pO1xuT2JqZWN0LmFzc2lnbihTdHJpbmcucHJvdG90eXBlLCB7XG5cdGVuZHM6IFN0cmluZy5wcm90b3R5cGUuZW5kc193aXRoLFxufSk7XG5cblplc2sudG9faW50ZWdlciA9IGZ1bmN0aW9uKHgpIHtcblx0dmFyIGQgPSBhcmd1bWVudHMubGVuZ3RoID4gMSA/IGFyZ3VtZW50c1sxXSA6IG51bGw7XG5cdHggPSBwYXJzZUludCh4LCAxMCk7XG5cdGlmICh0eXBlb2YgeCA9PT0gXCJudW1iZXJcIikge1xuXHRcdHJldHVybiB4O1xuXHR9XG5cdHJldHVybiBkO1xufTtcblxuWmVzay50b19saXN0ID0gdG9fbGlzdDtcblxuWmVzay50b19mbG9hdCA9IGZ1bmN0aW9uKHgpIHtcblx0dmFyIGQgPSBhcmd1bWVudHMubGVuZ3RoID4gMSA/IGFyZ3VtZW50c1sxXSA6IG51bGw7XG5cdHggPSBwYXJzZUZsb2F0KHgpO1xuXHRpZiAodHlwZW9mIHggPT09IFwibnVtYmVyXCIpIHtcblx0XHRyZXR1cm4geDtcblx0fVxuXHRyZXR1cm4gZDtcbn07XG5cblplc2sudG9fc3RyaW5nID0gZnVuY3Rpb24oeCkge1xuXHRyZXR1cm4geC50b1N0cmluZygpO1xufTtcblxuWmVzay50b19ib29sID0gdG9fYm9vbDtcblxuWmVzay5lbXB0eSA9IGZ1bmN0aW9uKHYpIHtcblx0cmV0dXJuIHR5cGVvZiB2ID09PSBcInVuZGVmaW5lZFwiIHx8IHYgPT09IG51bGwgfHwgdiA9PT0gXCJcIjtcbn07XG5cblplc2suWk9iamVjdCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cdHRoaXMub3B0aW9ucyA9IFplc2suY2hhbmdlX2tleV9jYXNlKE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMpKTtcblx0Ly8gdGhpcy5jb25zdHJ1Y3Rvci5zdXBlci5jYWxsKHRoaXMpO1xufTtcblplc2suaW5oZXJpdChaZXNrLlpPYmplY3QsIG51bGwsIHtcblx0Y2xvbmU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBaZXNrLmNsb25lKHRoaXMpO1xuXHR9LFxufSk7XG5cblplc2suY2hhbmdlX2tleV9jYXNlID0gZnVuY3Rpb24obWUpIHtcblx0dmFyIGssXG5cdFx0bmV3byA9IHt9O1xuXHRmb3IgKGsgaW4gbWUpIHtcblx0XHRpZiAobWUuaGFzT3duUHJvcGVydHkoaykpIHtcblx0XHRcdG5ld29bay50b0xvd2VyQ2FzZSgpXSA9IG1lW2tdO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gbmV3bztcbn07XG5cbmlmICh0eXBlb2YgTWF0aC5zaWduICE9PSBcImZ1bmN0aW9uXCIpIHtcblx0TWF0aC5zaWduID0gZnVuY3Rpb24oeCkge1xuXHRcdHJldHVybiB4ID8gKHggPCAwID8gLTEgOiAxKSA6IDA7XG5cdH07XG59XG5cbi8vIFRPRE8gV2hhdCdzIHRoaXMgZm9yP1xuWmVzay5hamF4X2Zvcm0gPSBmdW5jdGlvbigpIHtcblx0dmFyICRmb3JtID0gJCh0aGlzKSxcblx0XHR0YXJnZXQgPSAkZm9ybS5hdHRyKFwidGFyZ2V0XCIpLFxuXHRcdCR0YXJnZXQgPSAkKFwiI1wiICsgdGFyZ2V0KTtcblx0WmVzay5sb2coJHRhcmdldC5odG1sKCkpO1xufTtcblxuLypcbiAqIENvbXBhdGliaWxpdHlcbiAqL1xuLy8gaWYgKCFPYmplY3QucHJvdG90eXBlLmtleXMpIHtcbi8vIFx0T2JqZWN0LnByb3RvdHlwZS5rZXlzID0gZnVuY3Rpb24ob2JqKSB7XG4vLyBcdFx0dmFyIGtleXMgPSBbXSwgaztcbi8vIFx0XHRmb3IgKGsgaW4gb2JqKSB7XG4vLyBcdFx0XHRpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgaykpIHtcbi8vIFx0XHRcdFx0a2V5cy5wdXNoKGspO1xuLy8gXHRcdFx0fVxuLy8gXHRcdH1cbi8vIFx0XHRyZXR1cm4ga2V5cztcbi8vIFx0fTtcbi8vIH1cblxuJC5mbi5lcXVhbGhlaWdodCA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XG5cdCQodGhpcykuZWFjaChmdW5jdGlvbigpIHtcblx0XHR2YXIgaCA9IG51bGw7XG5cdFx0JChzZWxlY3RvciwgJCh0aGlzKSkuZWFjaChmdW5jdGlvbigpIHtcblx0XHRcdGggPSBNYXRoLm1heCgkKHRoaXMpLmhlaWdodCgpLCBoKTtcblx0XHR9KTtcblx0XHQkKHNlbGVjdG9yLCAkKHRoaXMpKS5lYWNoKGZ1bmN0aW9uKCkge1xuXHRcdFx0JCh0aGlzKS5oZWlnaHQoaCArIFwicHhcIik7XG5cdFx0fSk7XG5cdH0pO1xufTtcblxuWmVzay5pbml0ZWQgPSB0cnVlO1xuXG4kKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpIHtcblx0WmVzay5ob29rKFwiZG9jdW1lbnQ6OnJlYWR5XCIpO1xufSk7XG4kKHdpbmRvdykub24oXCJsb2FkXCIsIGZ1bmN0aW9uKCkge1xuXHRaZXNrLmhvb2soXCJ3aW5kb3c6OmxvYWRcIik7XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBaZXNrO1xuIl19