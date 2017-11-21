"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * Copyright &copy; 2017 Market Acumen, Inc.
 */
var $ = require("jquery");
var HTML = require("./HTML");

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
  * @param object|array
  *            x
  * @param function
  *            fn
  * @param boolean
  *            term_false Set to true to terminate when function returns
  *            a false-ish value as opposed to a true-ish value
  */
	each: function each(x, fn, term_false) {
		var i, r;
		term_false = to_bool(term_false);
		if (is_array(x)) {
			for (i = 0; i < x.length; i++) {
				r = fn.call(x[i], i, x[i]);
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
					r = fn.call(x[i], i, x[i]);
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
			return fn.call(x, 0, x);
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
		options = is_string(options) ? {
			level: options
		} : options;
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

function to_bool(x) {
	var d = arguments.length > 1 ? arguments[1] : false;
	if (is_bool(x)) {
		return x;
	}
	if (is_numeric(x)) {
		return x !== 0;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9aZXNrLmpzIl0sIm5hbWVzIjpbIiQiLCJyZXF1aXJlIiwiSFRNTCIsIlplc2siLCJob29rcyIsIlciLCJnbG9iYWwiLCJ3aW5kb3ciLCJkIiwiZG9jdW1lbnQiLCJMIiwibG9jYXRpb24iLCJnZXR0eXBlIiwieCIsIk9iamVjdCIsInByb3RvdHlwZSIsInRvU3RyaW5nIiwiY2FsbCIsInNwbGl0IiwidG9Mb3dlckNhc2UiLCJhdmFsdWUiLCJvYmoiLCJpIiwiZGVmIiwidW5kZWZpbmVkIiwiaXNfYm9vbCIsImEiLCJpc19udW1lcmljIiwiaXNfc3RyaW5nIiwiaXNfYXJyYXkiLCJpc19vYmplY3QiLCJpc19pbnRlZ2VyIiwicGFyc2VJbnQiLCJpc19mdW5jdGlvbiIsImlzX2Zsb2F0IiwiaXNfdXJsIiwiZXhlYyIsInRyaW0iLCJmbGlwIiwib2JqZWN0IiwicmVzdWx0IiwiaGFzT3duUHJvcGVydHkiLCJTdHJpbmciLCJpc19kYXRlIiwiZWFjaCIsImlzX251bWJlciIsIm9iamVjdF9wYXRoIiwicGF0aCIsImN1cnIiLCJrIiwidG9fbGlzdCIsImxlbmd0aCIsIm9iamVjdF9zZXRfcGF0aCIsInZhbHVlIiwic2VnIiwiaG9va19wYXRoIiwiaG9vayIsInB1c2giLCJhc3NpZ24iLCJzZXR0aW5ncyIsInciLCJ1cmxfcGFydHMiLCJwYXRobmFtZSIsImhvc3QiLCJxdWVyeSIsInNlYXJjaCIsInNjaGVtZSIsInByb3RvY29sIiwidXJsIiwiVVJMIiwidXJpIiwicGFnZV9zY3JpcHRzIiwicXVlcnlfZ2V0IiwidiIsInBhaXIiLCJ1IiwicmlnaHQiLCJjb29raWUiLCJuYW1lIiwib3B0aW9ucyIsImdldGNvb2tpZSIsIm4iLCJjIiwicyIsImxhc3RJbmRleE9mIiwiZSIsImluZGV4T2YiLCJ1bmVzY2FwZSIsInN1YnN0cmluZyIsInNldGNvb2tpZSIsIkRhdGUiLCJ0IiwidHRsIiwibSIsImRvbWFpbiIsInNldEZ1bGxZZWFyIiwic2V0VGltZSIsImdldFRpbWUiLCJlc2NhcGUiLCJ0b0dNVFN0cmluZyIsImRlbGV0ZV9jb29raWUiLCJkb20iLCJub3ciLCJhcmd1bWVudHMiLCJjc3MiLCJwIiwiY3JlYXRlRWxlbWVudCIsInJlbCIsImhyZWYiLCJtZWRpYSIsImdldEVsZW1lbnRzQnlUYWdOYW1lIiwiYXBwZW5kQ2hpbGQiLCJsb2ciLCJjb25zb2xlIiwiYWRkX2hvb2siLCJmdW4iLCJoYXNfaG9vayIsImZ1bmNzIiwiYXJncyIsImNsb25lIiwicmVzdWx0cyIsInNoaWZ0IiwiYXBwbHkiLCJnZXRfcGF0aCIsInNldF9wYXRoIiwiZ2V0IiwiZ2V0YiIsInRvX2Jvb2wiLCJzZXQiLCJvdmVyd3JpdGUiLCJpbmhlcml0IiwidGhlX2NsYXNzIiwic3VwZXJfY2xhc3MiLCJtZXRob2QiLCJDb25zdHJ1Y3QiLCJjb25zdHJ1Y3RvciIsImZuIiwidGVybV9mYWxzZSIsInIiLCJ0cGwiLCJtaXhlZCIsIm1hcCIsImh0bWwiLCJzY3JpcHRfc3JjX25vcm1hbGl6ZSIsInNyYyIsIm1hdGNoZXMiLCJwYXJ0cyIsInVucHJlZml4IiwibWF0Y2giLCJzY3JpcHRzX2luaXQiLCJzY3JpcHRfYWRkIiwiYXR0ciIsInNjcmlwdHMiLCJzY3JpcHRzX2NhY2hlZCIsInNyY3MiLCJzY3JpcHRfbG9hZGVkIiwic3R5bGVzaGVldF9sb2FkZWQiLCJtZXNzYWdlIiwibGV2ZWwiLCJyZWdleHBfcXVvdGUiLCJzdHIiLCJkZWxpbWl0ZXIiLCJyZXBsYWNlIiwiUmVnRXhwIiwicHJvcCIsIkNvbnN0cnVjdG9yIiwic291cmNlIiwic3Vic3RyIiwiTnVtYmVyIiwiaWdub3JlQ2FzZSIsIm11bHRpbGluZSIsIkFycmF5IiwiY29udGFpbnMiLCJyZW1vdmUiLCJ0ZW1wIiwic2xpY2UiLCJzcGxpY2UiLCJqb2luX3dyYXAiLCJwcmVmaXgiLCJzdWZmaXgiLCJqb2luIiwiZnJvbUNhbWVsQ2FzZSIsImZyb20iLCJ0byIsInRvQ2FtZWxDYXNlIiwiY29tcGFyZSIsImxlZnQiLCJkZWxpbSIsInBvcyIsInJsZWZ0IiwicnJpZ2h0IiwibHRyaW0iLCJydHJpbSIsImVuZHNfd2l0aCIsImVuZHMiLCJ4biIsImJlZ2luc2kiLCJzdHJpbmciLCJsZW4iLCJiZWdpbnMiLCJzdHJfcmVwbGFjZSIsIk1hdGgiLCJtaW4iLCJ0ciIsInNlbGYiLCJjYXNlX2luc2Vuc2l0aXZlIiwiY2hhbmdlX2tleV9jYXNlIiwidG9fYXJyYXkiLCJjaGFyQXQiLCJ1bnF1b3RlIiwicSIsInRvVXBwZXJDYXNlIiwidG9faW50ZWdlciIsInRvX2Zsb2F0IiwicGFyc2VGbG9hdCIsInRvX3N0cmluZyIsImVtcHR5IiwiWk9iamVjdCIsIm1lIiwibmV3byIsInNpZ24iLCJhamF4X2Zvcm0iLCIkZm9ybSIsInRhcmdldCIsIiR0YXJnZXQiLCJlcXVhbGhlaWdodCIsInNlbGVjdG9yIiwiaCIsIm1heCIsImhlaWdodCIsImluaXRlZCIsInJlYWR5Iiwib24iLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUE7OztBQUdBLElBQUlBLElBQUlDLFFBQVEsUUFBUixDQUFSO0FBQ0EsSUFBSUMsT0FBT0QsUUFBUSxRQUFSLENBQVg7O0FBRUEsSUFBSUUsT0FBTyxFQUFYO0FBQ0EsSUFBSUMsUUFBUSxFQUFaO0FBQ0EsSUFBSUMsSUFBSUMsT0FBT0MsTUFBUCxJQUFpQixFQUF6QjtBQUNBLElBQUlDLElBQUlILEVBQUVJLFFBQUYsSUFBYyxFQUF0QjtBQUNBLElBQUlDLElBQUlMLEVBQUVNLFFBQUYsSUFBYyxFQUF0Qjs7QUFFQSxTQUFTQyxPQUFULENBQWlCQyxDQUFqQixFQUFvQjtBQUNuQixLQUFJQSxNQUFNLElBQVYsRUFBZ0I7QUFDZixTQUFPLE1BQVA7QUFDQTtBQUNELFFBQU9DLE9BQU9DLFNBQVAsQ0FBaUJDLFFBQWpCLENBQ0xDLElBREssQ0FDQUosQ0FEQSxFQUVMSyxLQUZLLENBRUMsR0FGRCxFQUVNLENBRk4sRUFHTEEsS0FISyxDQUdDLEdBSEQsRUFHTSxDQUhOLEVBSUxDLFdBSkssRUFB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QUYsQ0FBWixFQUFxQjRDLElBQXJCLENBQTBCLFlBQVc7QUFDcEM1QyxLQUFFLElBQUYsRUFBUXFPLE1BQVIsQ0FBZUYsSUFBSSxJQUFuQjtBQUNBLEdBRkQ7QUFHQSxFQVJEO0FBU0EsQ0FWRDs7QUFZQWhPLEtBQUttTyxNQUFMLEdBQWMsSUFBZDs7QUFFQXRPLEVBQUVTLFFBQUYsRUFBWThOLEtBQVosQ0FBa0IsWUFBVztBQUM1QnBPLE1BQUtxRCxJQUFMLENBQVUsaUJBQVY7QUFDQSxDQUZEO0FBR0F4RCxFQUFFTyxNQUFGLEVBQVVpTyxFQUFWLENBQWEsTUFBYixFQUFxQixZQUFXO0FBQy9Cck8sTUFBS3FELElBQUwsQ0FBVSxjQUFWO0FBQ0EsQ0FGRDs7QUFJQWlMLE9BQU9DLE9BQVAsR0FBaUJ2TyxJQUFqQiIsImZpbGUiOiJaZXNrLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgJmNvcHk7IDIwMTcgTWFya2V0IEFjdW1lbiwgSW5jLlxuICovXG52YXIgJCA9IHJlcXVpcmUoXCJqcXVlcnlcIik7XG5sZXQgSFRNTCA9IHJlcXVpcmUoXCIuL0hUTUxcIik7XG5cbnZhciBaZXNrID0ge307XG52YXIgaG9va3MgPSB7fTtcbnZhciBXID0gZ2xvYmFsLndpbmRvdyB8fCB7fTtcbnZhciBkID0gVy5kb2N1bWVudCB8fCB7fTtcbnZhciBMID0gVy5sb2NhdGlvbiB8fCB7fTtcblxuZnVuY3Rpb24gZ2V0dHlwZSh4KSB7XG5cdGlmICh4ID09PSBudWxsKSB7XG5cdFx0cmV0dXJuIFwibnVsbFwiO1xuXHR9XG5cdHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nXG5cdFx0LmNhbGwoeClcblx0XHQuc3BsaXQoXCIgXCIpWzFdXG5cdFx0LnNwbGl0KFwiXVwiKVswXVxuXHRcdC50b0xvd2VyQ2FzZSgpO1xufVxuXG5mdW5jdGlvbiBhdmFsdWUob2JqLCBpLCBkZWYpIHtcblx0aWYgKGRlZiA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0ZGVmID0gbnVsbDtcblx0fVxuXHRpZiAodHlwZW9mIG9iaiA9PT0gXCJvYmplY3RcIikge1xuXHRcdGlmICh0eXBlb2Ygb2JqW2ldICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cdFx0XHRyZXR1cm4gb2JqW2ldO1xuXHRcdH1cblx0XHRyZXR1cm4gZGVmO1xuXHR9XG5cdHJldHVybiBkZWY7XG59XG5aZXNrLmF2YWx1ZSA9IGF2YWx1ZTtcblxuZnVuY3Rpb24gaXNfYm9vbChhKSB7XG5cdHJldHVybiBnZXR0eXBlKGEpID09PSBcImJvb2xlYW5cIjtcbn1cbmZ1bmN0aW9uIGlzX251bWVyaWMoYSkge1xuXHRyZXR1cm4gZ2V0dHlwZShhKSA9PT0gXCJudW1iZXJcIjtcbn1cbmZ1bmN0aW9uIGlzX3N0cmluZyhhKSB7XG5cdHJldHVybiBnZXR0eXBlKGEpID09PSBcInN0cmluZ1wiO1xufVxuZnVuY3Rpb24gaXNfYXJyYXkoYSkge1xuXHRyZXR1cm4gZ2V0dHlwZShhKSA9PT0gXCJhcnJheVwiO1xufVxuZnVuY3Rpb24gaXNfb2JqZWN0KGEpIHtcblx0cmV0dXJuIGdldHR5cGUoYSkgPT09IFwib2JqZWN0XCI7XG59XG5mdW5jdGlvbiBpc19pbnRlZ2VyKGEpIHtcblx0cmV0dXJuIGlzX251bWVyaWMoYSkgJiYgcGFyc2VJbnQoYSwgMTApID09PSBhO1xufVxuZnVuY3Rpb24gaXNfZnVuY3Rpb24oYSkge1xuXHRyZXR1cm4gZ2V0dHlwZShhKSA9PT0gXCJmdW5jdGlvblwiO1xufVxuZnVuY3Rpb24gaXNfZmxvYXQoYSkge1xuXHRyZXR1cm4gdHlwZW9mIGEgPT09IFwibnVtYmVyXCIgJiYgcGFyc2VJbnQoYSwgMTApICE9PSBhO1xufVxuZnVuY3Rpb24gaXNfdXJsKHgpIHtcblx0cmV0dXJuIC9eaHR0cDpcXC9cXC8uK3xeaHR0cHM6XFwvXFwvLit8Xm1haWx0bzouK0AuK3xeZnRwOlxcL1xcLy4rfF5maWxlOlxcL1xcLy4rfF5uZXdzOlxcL1xcLy4rLy5leGVjKFxuXHRcdHgudG9Mb3dlckNhc2UoKS50cmltKClcblx0KTtcbn1cblxuWmVzay5mbGlwID0gZnVuY3Rpb24ob2JqZWN0KSB7XG5cdHZhciBpLFxuXHRcdHJlc3VsdCA9IHt9O1xuXHRmb3IgKGkgaW4gb2JqZWN0KSB7XG5cdFx0aWYgKG9iamVjdC5oYXNPd25Qcm9wZXJ0eShpKSkge1xuXHRcdFx0cmVzdWx0W1N0cmluZyhvYmplY3RbaV0pXSA9IGk7XG5cdFx0fVxuXHR9XG5cdHJldHVybiByZXN1bHQ7XG59O1xuXG4vKiBLZXJuZWwgKi9cblxuWmVzay5pc19kYXRlID0gZnVuY3Rpb24oYSkge1xuXHRyZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGEpID09PSBcIltvYmplY3QgRGF0ZV1cIjtcbn07XG5cblplc2suZ2V0dHlwZSA9IGdldHR5cGU7XG5cblplc2suZWFjaCA9IFplc2suZWFjaDtcblxuWmVzay5pc19hcnJheSA9IGlzX2FycmF5O1xuWmVzay5pc19vYmplY3QgPSBpc19vYmplY3Q7XG5aZXNrLmlzX2FycmF5ID0gaXNfYXJyYXk7XG5aZXNrLmlzX251bWJlciA9IGlzX251bWVyaWM7XG5aZXNrLmlzX251bWVyaWMgPSBpc19udW1lcmljO1xuWmVzay5pc19ib29sID0gaXNfYm9vbDtcblplc2suaXNfc3RyaW5nID0gaXNfc3RyaW5nO1xuWmVzay5pc19pbnRlZ2VyID0gaXNfaW50ZWdlcjtcblplc2suaXNfZnVuY3Rpb24gPSBpc19mdW5jdGlvbjtcblplc2suaXNfZmxvYXQgPSBpc19mbG9hdDtcblplc2suaXNfdXJsID0gaXNfdXJsO1xuXG5mdW5jdGlvbiBvYmplY3RfcGF0aChvYmplY3QsIHBhdGgsIGRlZikge1xuXHR2YXIgY3VyciA9IG9iamVjdCxcblx0XHRrO1xuXHRwYXRoID0gdG9fbGlzdChwYXRoLCBbXSwgXCIuXCIpO1xuXHRmb3IgKGsgPSAwOyBrIDwgcGF0aC5sZW5ndGg7IGsrKykge1xuXHRcdGlmIChrID09PSBwYXRoLmxlbmd0aCAtIDEpIHtcblx0XHRcdHJldHVybiBhdmFsdWUoY3VyciwgcGF0aFtrXSwgZGVmKTtcblx0XHR9XG5cdFx0Y3VyciA9IGF2YWx1ZShjdXJyLCBwYXRoW2tdKTtcblx0XHRpZiAoY3VyciA9PT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuIGRlZjtcblx0XHR9XG5cdFx0aWYgKCFpc19vYmplY3QoY3VycikpIHtcblx0XHRcdHJldHVybiBkZWY7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBjdXJyO1xufVxuXG5mdW5jdGlvbiBvYmplY3Rfc2V0X3BhdGgob2JqZWN0LCBwYXRoLCB2YWx1ZSkge1xuXHR2YXIgY3VyciA9IG9iamVjdCxcblx0XHRrLFxuXHRcdHNlZztcblx0cGF0aCA9IHRvX2xpc3QocGF0aCwgW10sIFwiLlwiKTtcblx0Zm9yIChrID0gMDsgayA8IHBhdGgubGVuZ3RoOyBrKyspIHtcblx0XHRzZWcgPSBwYXRoW2tdO1xuXHRcdGlmICh0eXBlb2YgY3VycltzZWddID09PSBcIm9iamVjdFwiKSB7XG5cdFx0XHRjdXJyID0gY3VycltzZWddO1xuXHRcdH0gZWxzZSBpZiAoayA9PT0gcGF0aC5sZW5ndGggLSAxKSB7XG5cdFx0XHRjdXJyW3NlZ10gPSB2YWx1ZTtcblx0XHRcdGJyZWFrO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjdXJyW3NlZ10gPSB7fTtcblx0XHRcdGN1cnIgPSBjdXJyW3NlZ107XG5cdFx0fVxuXHR9XG5cdHJldHVybiBvYmplY3Q7XG59XG5cblplc2sub2JqZWN0X3BhdGggPSBvYmplY3RfcGF0aDtcblplc2sub2JqZWN0X3NldF9wYXRoID0gb2JqZWN0X3NldF9wYXRoO1xuXG5mdW5jdGlvbiBob29rX3BhdGgoaG9vaykge1xuXHRob29rID0gU3RyaW5nKGhvb2spLnRvTG93ZXJDYXNlKCk7XG5cdGhvb2sgPSB0b19saXN0KGhvb2ssIFtdLCBcIjo6XCIpO1xuXHRpZiAoaG9vay5sZW5ndGggPT09IDEpIHtcblx0XHRob29rLnB1c2goXCIqXCIpO1xuXHR9XG5cdHJldHVybiBob29rO1xufVxuXG5PYmplY3QuYXNzaWduKFplc2ssIHtcblx0ZDogZCxcblx0c2V0dGluZ3M6IHt9LCAvLyBQbGFjZSBtb2R1bGUgZGF0YSBoZXJlIVxuXHRob29rczogaG9va3MsIC8vIE1vZHVsZSBob29rcyBnbyBoZXJlIC0gdXNlIGFkZF9ob29rIGFuZCBob29rIHRvIHVzZVxuXHR3OiBXLFxuXHR1cmxfcGFydHM6IHtcblx0XHRwYXRoOiBMLnBhdGhuYW1lLFxuXHRcdGhvc3Q6IEwuaG9zdCxcblx0XHRxdWVyeTogTC5zZWFyY2gsXG5cdFx0c2NoZW1lOiBMLnByb3RvY29sLFxuXHRcdHVybDogZC5VUkwsXG5cdFx0dXJpOiBMLnBhdGhuYW1lICsgTC5zZWFyY2gsXG5cdH0sXG5cdHBhZ2Vfc2NyaXB0czogbnVsbCxcblx0cXVlcnlfZ2V0OiBmdW5jdGlvbih2LCBkZWYpIHtcblx0XHRkZWYgPSBkZWYgfHwgbnVsbDtcblx0XHR2YXIgcGFpcixcblx0XHRcdGksXG5cdFx0XHR1ID0gZC5VUkwudG9TdHJpbmcoKS5yaWdodChcIj9cIiwgbnVsbCk7XG5cdFx0aWYgKCF1KSB7XG5cdFx0XHRyZXR1cm4gZGVmO1xuXHRcdH1cblx0XHR1ID0gdS5zcGxpdChcIiZcIik7XG5cdFx0Zm9yIChpID0gMDsgaSA8IHUubGVuZ3RoOyBpKyspIHtcblx0XHRcdHBhaXIgPSB1W2ldLnNwbGl0KFwiPVwiLCAyKTtcblx0XHRcdGlmIChwYWlyWzBdID09PSB2KSB7XG5cdFx0XHRcdHJldHVybiBwYWlyWzFdIHx8IHBhaXJbMF07XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBkZWY7XG5cdH0sXG5cdC8qKlxuICAgICAqIEBwYXJhbSBuYW1lIHN0cmluZyBOYW1lIG9mIGNvb2tpZSB0byBzZXQvZ2V0XG4gICAgICogQHBhcmFtIHZhbHVlIHN0cmluZyBWYWx1ZSBvZiBjb29raWUgdG8gc2V0XG4gICAgICogQHBhcmFtIG9wdGlvbnMgb2JqZWN0IEV4dHJhIG9wdGlvbnM6IHR0bDogaW50ZWdlciAoc2Vjb25kcyksIGRvbWFpbjogc3RyaW5nXG4gICAgICovXG5cdGNvb2tpZTogZnVuY3Rpb24obmFtZSwgdmFsdWUsIG9wdGlvbnMpIHtcblx0XHR2YXIgZ2V0Y29va2llID0gZnVuY3Rpb24obikge1xuXHRcdFx0XHR2YXIgYyA9IGQuY29va2llO1xuXHRcdFx0XHR2YXIgcyA9IGMubGFzdEluZGV4T2YobiArIFwiPVwiKTtcblx0XHRcdFx0aWYgKHMgPCAwKSB7XG5cdFx0XHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0XHRcdH1cblx0XHRcdFx0cyArPSBuLmxlbmd0aCArIDE7XG5cdFx0XHRcdHZhciBlID0gYy5pbmRleE9mKFwiO1wiLCBzKTtcblx0XHRcdFx0aWYgKGUgPCAwKSB7XG5cdFx0XHRcdFx0ZSA9IGMubGVuZ3RoO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBXLnVuZXNjYXBlKGMuc3Vic3RyaW5nKHMsIGUpKTtcblx0XHRcdH0sXG5cdFx0XHRzZXRjb29raWUgPSBmdW5jdGlvbihuLCB2LCBvcHRpb25zKSB7XG5cdFx0XHRcdHZhciBhID0gbmV3IERhdGUoKSxcblx0XHRcdFx0XHR0ID0gcGFyc2VJbnQob3B0aW9ucy50dGwsIDEwKSB8fCAtMSxcblx0XHRcdFx0XHRtID0gb3B0aW9ucy5kb21haW4gfHwgbnVsbDtcblx0XHRcdFx0aWYgKHQgPD0gMCkge1xuXHRcdFx0XHRcdGEuc2V0RnVsbFllYXIoMjAzMCk7XG5cdFx0XHRcdH0gZWxzZSBpZiAodCA+IDApIHtcblx0XHRcdFx0XHRhLnNldFRpbWUoYS5nZXRUaW1lKCkgKyB0ICogMTAwMCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZC5jb29raWUgPSBuICsgXCI9XCIgKyBXLmVzY2FwZSh2KSArIFwiOyBwYXRoPS87IGV4cGlyZXM9XCIgKyBhLnRvR01UU3RyaW5nKCkgKyAobSA/IFwiOyBkb21haW49XCIgKyBtIDogXCJcIik7XG5cdFx0XHRcdHJldHVybiB2O1xuXHRcdFx0fSxcblx0XHRcdGRlbGV0ZV9jb29raWUgPSBmdW5jdGlvbihuYW1lLCBkb20pIHtcblx0XHRcdFx0dmFyIG5vdyA9IG5ldyBEYXRlKCksXG5cdFx0XHRcdFx0ZSA9IG5ldyBEYXRlKG5vdy5nZXRUaW1lKCkgLSA4NjQwMCk7XG5cdFx0XHRcdGQuY29va2llID0gbmFtZSArIFwiPTsgcGF0aD0vOyBleHBpcmVzPVwiICsgZS50b0dNVFN0cmluZygpICsgKGRvbSA/IFwiOyBkb21haW49XCIgKyBkb20gOiBcIlwiKTtcblx0XHRcdH07XG5cdFx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cdFx0aWYgKHZhbHVlID09PSBudWxsKSB7XG5cdFx0XHRkZWxldGVfY29va2llKG5hbWUsIG9wdGlvbnMuZG9tIHx8IG51bGwpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRyZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA9PT0gMSA/IGdldGNvb2tpZShuYW1lKSA6IHNldGNvb2tpZShuYW1lLCB2YWx1ZSwgb3B0aW9ucyk7XG5cdH0sXG5cdGNzczogZnVuY3Rpb24ocCkge1xuXHRcdHZhciBjc3MgPSBkLmNyZWF0ZUVsZW1lbnQoXCJsaW5rXCIpO1xuXHRcdGNzcy5yZWwgPSBcInN0eWxlc2hlZXRcIjtcblx0XHRjc3MuaHJlZiA9IHA7XG5cdFx0Y3NzLm1lZGlhID0gYXJndW1lbnRzWzFdIHx8IFwiYWxsXCI7XG5cdFx0ZC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImhlYWRcIilbMF0uYXBwZW5kQ2hpbGQoY3NzKTtcblx0fSxcblx0bG9nOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoVy5jb25zb2xlICYmIFcuY29uc29sZS5sb2cpIHtcblx0XHRcdFcuY29uc29sZS5sb2coYXJndW1lbnRzKTtcblx0XHR9XG5cdH0sXG5cdGFkZF9ob29rOiBmdW5jdGlvbihob29rLCBmdW4pIHtcblx0XHR2YXIgcGF0aCA9IGhvb2tfcGF0aChob29rKSxcblx0XHRcdGN1cnIgPSBvYmplY3RfcGF0aChob29rcywgcGF0aCk7XG5cdFx0aWYgKGN1cnIpIHtcblx0XHRcdGN1cnIucHVzaChmdW4pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjdXJyID0gW2Z1bl07XG5cdFx0XHRvYmplY3Rfc2V0X3BhdGgoaG9va3MsIHBhdGgsIGN1cnIpO1xuXHRcdH1cblx0fSxcblx0aGFzX2hvb2s6IGZ1bmN0aW9uKGhvb2spIHtcblx0XHR2YXIgZnVuY3MgPSBvYmplY3RfcGF0aChob29rcywgaG9va19wYXRoKGhvb2spLCBudWxsKTtcblx0XHRyZXR1cm4gZnVuY3MgPyB0cnVlIDogZmFsc2U7XG5cdH0sXG5cdGhvb2s6IGZ1bmN0aW9uKGhvb2spIHtcblx0XHR2YXIgcGF0aCA9IGhvb2tfcGF0aChob29rKSxcblx0XHRcdGFyZ3MgPSBaZXNrLmNsb25lKGFyZ3VtZW50cyksXG5cdFx0XHRmdW5jcyA9IG9iamVjdF9wYXRoKGhvb2tzLCBwYXRoLCBudWxsKSxcblx0XHRcdHJlc3VsdHMgPSBbXSxcblx0XHRcdGk7XG5cdFx0aWYgKCFmdW5jcykge1xuXHRcdFx0cmV0dXJuIHJlc3VsdHM7XG5cdFx0fVxuXHRcdGlmIChhcmdzLmxlbmd0aCA+IDEpIHtcblx0XHRcdGFyZ3Muc2hpZnQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0YXJncyA9IFtdO1xuXHRcdH1cblxuXHRcdGZvciAoaSA9IDA7IGkgPCBmdW5jcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0cmVzdWx0cy5wdXNoKGZ1bmNzW2ldLmFwcGx5KG51bGwsIGFyZ3MpKTtcblx0XHR9XG5cdFx0cmV0dXJuIHJlc3VsdHM7XG5cdH0sXG5cdGdldF9wYXRoOiBmdW5jdGlvbihwYXRoLCBkZWYpIHtcblx0XHRyZXR1cm4gb2JqZWN0X3BhdGgoWmVzay5zZXR0aW5ncywgcGF0aCwgZGVmKTtcblx0fSxcblx0c2V0X3BhdGg6IGZ1bmN0aW9uKHBhdGgsIHZhbHVlKSB7XG5cdFx0cmV0dXJuIG9iamVjdF9zZXRfcGF0aChaZXNrLnNldHRpbmdzLCBwYXRoLCB2YWx1ZSk7XG5cdH0sXG5cdGdldDogZnVuY3Rpb24obikge1xuXHRcdHZhciBhID0gYXJndW1lbnRzO1xuXHRcdHJldHVybiBhdmFsdWUoWmVzay5zZXR0aW5ncywgbiwgYS5sZW5ndGggPiAxID8gYVsxXSA6IG51bGwpO1xuXHR9LFxuXHRnZXRiOiBmdW5jdGlvbihuKSB7XG5cdFx0dmFyIGEgPSBhcmd1bWVudHMsXG5cdFx0XHRkID0gYS5sZW5ndGggPiAxID8gYVsxXSA6IGZhbHNlO1xuXHRcdHJldHVybiB0b19ib29sKFplc2suZ2V0KG4sIGQpKTtcblx0fSxcblx0c2V0OiBmdW5jdGlvbihuLCB2KSB7XG5cdFx0dmFyIGEgPSBhcmd1bWVudHMsXG5cdFx0XHRvdmVyd3JpdGUgPSBhLmxlbmd0aCA+IDIgPyB0b19ib29sKGFbMl0pIDogdHJ1ZTtcblx0XHRpZiAoIW92ZXJ3cml0ZSAmJiB0eXBlb2YgWmVzay5zZXR0aW5nc1tuXSAhPT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdFx0cmV0dXJuIFplc2suc2V0dGluZ3Nbbl07XG5cdFx0fVxuXHRcdFplc2suc2V0dGluZ3Nbbl0gPSB2O1xuXHRcdHJldHVybiB2O1xuXHR9LFxuXHRpbmhlcml0OiBmdW5jdGlvbih0aGVfY2xhc3MsIHN1cGVyX2NsYXNzLCBwcm90b3R5cGUpIHtcblx0XHQvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzExMTQwMjQvY29uc3RydWN0b3JzLWluLWphdmFzY3JpcHQtb2JqZWN0c1xuXHRcdHZhciBtZXRob2QsXG5cdFx0XHRDb25zdHJ1Y3QgPSBmdW5jdGlvbigpIHt9O1xuXHRcdHN1cGVyX2NsYXNzID0gc3VwZXJfY2xhc3MgfHwgT2JqZWN0O1xuXHRcdENvbnN0cnVjdC5wcm90b3R5cGUgPSBzdXBlcl9jbGFzcy5wcm90b3R5cGU7XG5cdFx0dGhlX2NsYXNzLnByb3RvdHlwZSA9IG5ldyBDb25zdHJ1Y3QoKTtcblx0XHR0aGVfY2xhc3MucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gdGhlX2NsYXNzO1xuXHRcdHRoZV9jbGFzc1tcInN1cGVyXCJdID0gc3VwZXJfY2xhc3M7XG5cdFx0aWYgKHByb3RvdHlwZSBpbnN0YW5jZW9mIE9iamVjdCkge1xuXHRcdFx0Zm9yIChtZXRob2QgaW4gcHJvdG90eXBlKSB7XG5cdFx0XHRcdGlmIChwcm90b3R5cGUuaGFzT3duUHJvcGVydHkobWV0aG9kKSkge1xuXHRcdFx0XHRcdGlmICghdGhlX2NsYXNzLnByb3RvdHlwZVttZXRob2RdKSB7XG5cdFx0XHRcdFx0XHR0aGVfY2xhc3MucHJvdG90eXBlW21ldGhvZF0gPSBwcm90b3R5cGVbbWV0aG9kXTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0dGhlX2NsYXNzLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIFplc2suY2xvbmUodGhpcyk7XG5cdFx0fTtcblx0XHRyZXR1cm4gdGhlX2NsYXNzO1xuXHR9LFxuXHQvKipcblx0ICogSXRlcmF0ZSBvdmVyIGFuIG9iamVjdCwgY2FsbGluZyBhIGZ1bmN0aW9uIG9uY2UgcGVyIGVsZW1lbnRcblx0ICogXG5cdCAqIEBwYXJhbSBvYmplY3R8YXJyYXlcblx0ICogICAgICAgICAgICB4XG5cdCAqIEBwYXJhbSBmdW5jdGlvblxuXHQgKiAgICAgICAgICAgIGZuXG5cdCAqIEBwYXJhbSBib29sZWFuXG5cdCAqICAgICAgICAgICAgdGVybV9mYWxzZSBTZXQgdG8gdHJ1ZSB0byB0ZXJtaW5hdGUgd2hlbiBmdW5jdGlvbiByZXR1cm5zXG5cdCAqICAgICAgICAgICAgYSBmYWxzZS1pc2ggdmFsdWUgYXMgb3Bwb3NlZCB0byBhIHRydWUtaXNoIHZhbHVlXG5cdCAqL1xuXHRlYWNoOiBmdW5jdGlvbih4LCBmbiwgdGVybV9mYWxzZSkge1xuXHRcdHZhciBpLCByO1xuXHRcdHRlcm1fZmFsc2UgPSB0b19ib29sKHRlcm1fZmFsc2UpO1xuXHRcdGlmIChpc19hcnJheSh4KSkge1xuXHRcdFx0Zm9yIChpID0gMDsgaSA8IHgubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0ciA9IGZuLmNhbGwoeFtpXSwgaSwgeFtpXSk7XG5cdFx0XHRcdGlmICh0ZXJtX2ZhbHNlKSB7XG5cdFx0XHRcdFx0aWYgKCFyKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gcjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSBpZiAocikge1xuXHRcdFx0XHRcdHJldHVybiByO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmIChpc19vYmplY3QoeCkpIHtcblx0XHRcdGZvciAoaSBpbiB4KSB7XG5cdFx0XHRcdGlmICh4Lmhhc093blByb3BlcnR5KGkpKSB7XG5cdFx0XHRcdFx0ciA9IGZuLmNhbGwoeFtpXSwgaSwgeFtpXSk7XG5cdFx0XHRcdFx0aWYgKHRlcm1fZmFsc2UpIHtcblx0XHRcdFx0XHRcdGlmICghcikge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcjtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9IGVsc2UgaWYgKHIpIHtcblx0XHRcdFx0XHRcdHJldHVybiByO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gZm4uY2FsbCh4LCAwLCB4KTtcblx0XHR9XG5cdH0sXG5cdHRwbDogZnVuY3Rpb24obWl4ZWQsIG1hcCkge1xuXHRcdHJldHVybiAkKG1peGVkKVxuXHRcdFx0Lmh0bWwoKVxuXHRcdFx0Lm1hcChtYXAsIGZhbHNlKTtcblx0fSxcblx0c2NyaXB0X3NyY19ub3JtYWxpemU6IGZ1bmN0aW9uKHNyYykge1xuXHRcdHZhciBtYXRjaGVzLFxuXHRcdFx0cGFydHMgPSBaZXNrLnVybF9wYXJ0cztcblx0XHRzcmMgPSBzcmMudW5wcmVmaXgocGFydHMuc2NoZW1lICsgXCI6Ly9cIiArIHBhcnRzLmhvc3QpO1xuXHRcdG1hdGNoZXMgPSBzcmMubWF0Y2goLyguKilcXD9fdmVyPVswLTldKyQvKTtcblx0XHRpZiAobWF0Y2hlcyAhPT0gbnVsbCkge1xuXHRcdFx0c3JjID0gbWF0Y2hlc1sxXTtcblx0XHR9XG5cdFx0cmV0dXJuIHNyYztcblx0fSxcblx0c2NyaXB0c19pbml0OiBmdW5jdGlvbigpIHtcblx0XHRaZXNrLnBhZ2Vfc2NyaXB0cyA9IHt9O1xuXHRcdCQoJ3NjcmlwdFt0eXBlPVwidGV4dC9qYXZhc2NyaXB0XCJdW3NyY10nKS5lYWNoKGZ1bmN0aW9uKCkge1xuXHRcdFx0WmVzay5zY3JpcHRfYWRkKCQodGhpcykuYXR0cihcInNyY1wiKSk7XG5cdFx0fSk7XG5cdH0sXG5cdHNjcmlwdF9hZGQ6IGZ1bmN0aW9uKHNyYykge1xuXHRcdGlmIChaZXNrLnBhZ2Vfc2NyaXB0cyA9PT0gbnVsbCkge1xuXHRcdFx0WmVzay5zY3JpcHRzX2luaXQoKTtcblx0XHR9XG5cdFx0WmVzay5wYWdlX3NjcmlwdHNbc3JjXSA9IHRydWU7XG5cdFx0WmVzay5wYWdlX3NjcmlwdHNbWmVzay5zY3JpcHRfc3JjX25vcm1hbGl6ZShzcmMpXSA9IHRydWU7XG5cdH0sXG5cdHNjcmlwdHM6IGZ1bmN0aW9uKCkge1xuXHRcdGlmIChaZXNrLnBhZ2Vfc2NyaXB0cyA9PT0gbnVsbCkge1xuXHRcdFx0WmVzay5zY3JpcHRzX2luaXQoKTtcblx0XHR9XG5cdFx0cmV0dXJuIFplc2sucGFnZV9zY3JpcHRzO1xuXHR9LFxuXHRzY3JpcHRzX2NhY2hlZDogZnVuY3Rpb24oc3Jjcykge1xuXHRcdFplc2suZWFjaChzcmNzLCBmdW5jdGlvbigpIHtcblx0XHRcdFplc2suc2NyaXB0X2FkZCh0aGlzKTtcblx0XHR9KTtcblx0fSxcblx0c2NyaXB0X2xvYWRlZDogZnVuY3Rpb24oc3JjKSB7XG5cdFx0dmFyIHNjcmlwdHMgPSBaZXNrLnNjcmlwdHMoKSxcblx0XHRcdHJlc3VsdCA9IHNjcmlwdHNbc3JjXSB8fCBzY3JpcHRzW1plc2suc2NyaXB0X3NyY19ub3JtYWxpemUoc3JjKV0gfHwgZmFsc2U7XG5cdFx0Ly8gWmVzay5sb2coXCJaZXNrLnNjcmlwdF9sb2FkZWQoXCIgKyBzcmMgKyBcIikgPSBcIiArIChyZXN1bHQgPyBcInRydWVcIjpcblx0XHQvLyBcImZhbHNlXCIpKTtcblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9LFxuXHRzdHlsZXNoZWV0X2xvYWRlZDogZnVuY3Rpb24oaHJlZiwgbWVkaWEpIHtcblx0XHRyZXR1cm4gJCgnbGlua1tyZWw9XCJzdHlsZXNoZWV0XCJdW2hyZWY9XCInICsgaHJlZiArICdcIl1bbWVkaWE9XCInICsgbWVkaWEgKyAnXCInKS5sZW5ndGggPiAwO1xuXHR9LFxuXHRtZXNzYWdlOiBmdW5jdGlvbihtZXNzYWdlLCBvcHRpb25zKSB7XG5cdFx0b3B0aW9ucyA9IGlzX3N0cmluZyhvcHRpb25zKVxuXHRcdFx0PyB7XG5cdFx0XHRcdFx0bGV2ZWw6IG9wdGlvbnMsXG5cdFx0XHRcdH1cblx0XHRcdDogb3B0aW9ucztcblx0XHRaZXNrLmhvb2soXCJtZXNzYWdlXCIsIG1lc3NhZ2UsIG9wdGlvbnMpO1xuXHRcdFplc2subG9nKG1lc3NhZ2UsIG9wdGlvbnMpO1xuXHR9LFxuXHRyZWdleHBfcXVvdGU6IGZ1bmN0aW9uKHN0ciwgZGVsaW1pdGVyKSB7XG5cdFx0cmV0dXJuIFN0cmluZyhzdHIpLnJlcGxhY2UoXG5cdFx0XHRuZXcgUmVnRXhwKFwiWy5cXFxcXFxcXCsqP1xcXFxbXFxcXF5cXFxcXSQoKXt9PSE8Pnw6XFxcXFwiICsgKGRlbGltaXRlciB8fCBcIlwiKSArIFwiLV1cIiwgXCJnXCIpLFxuXHRcdFx0XCJcXFxcJCZcIlxuXHRcdCk7XG5cdH0sXG59KTtcblxuWmVzay5jbG9uZSA9IGZ1bmN0aW9uKG9iamVjdCkge1xuXHR2YXIgY2xvbmUsIHByb3AsIENvbnN0cnVjdG9yO1xuXHRpZiAob2JqZWN0ID09PSBudWxsKSB7XG5cdFx0cmV0dXJuIG9iamVjdDtcblx0fVxuXHRpZiAoaXNfZnVuY3Rpb24ob2JqZWN0KSkge1xuXHRcdHJldHVybiBvYmplY3Q7XG5cdH1cblx0aWYgKGlzX2FycmF5KG9iamVjdCkgfHwgWmVzay5nZXR0eXBlKG9iamVjdCkgPT09IFwiYXJndW1lbnRzXCIpIHtcblx0XHRjbG9uZSA9IFtdO1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgb2JqZWN0Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRjbG9uZS5wdXNoKFplc2suY2xvbmUob2JqZWN0W2ldKSk7XG5cdFx0fVxuXHRcdHJldHVybiBjbG9uZTtcblx0fVxuXHRpZiAoIWlzX29iamVjdChvYmplY3QpKSB7XG5cdFx0cmV0dXJuIG9iamVjdDtcblx0fVxuXHRDb25zdHJ1Y3RvciA9IG9iamVjdC5jb25zdHJ1Y3Rvcjtcblx0c3dpdGNoIChDb25zdHJ1Y3Rvcikge1xuXHRcdGNhc2UgUmVnRXhwOlxuXHRcdFx0Y2xvbmUgPSBuZXcgQ29uc3RydWN0b3IoXG5cdFx0XHRcdG9iamVjdC5zb3VyY2UsXG5cdFx0XHRcdFwiZ1wiLnN1YnN0cigwLCBOdW1iZXIob2JqZWN0Lmdsb2JhbCkpICtcblx0XHRcdFx0XHRcImlcIi5zdWJzdHIoMCwgTnVtYmVyKG9iamVjdC5pZ25vcmVDYXNlKSkgK1xuXHRcdFx0XHRcdFwibVwiLnN1YnN0cigwLCBOdW1iZXIob2JqZWN0Lm11bHRpbGluZSkpXG5cdFx0XHQpO1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSBEYXRlOlxuXHRcdFx0Y2xvbmUgPSBuZXcgQ29uc3RydWN0b3Iob2JqZWN0LmdldFRpbWUoKSk7XG5cdFx0XHRicmVhaztcblx0XHRkZWZhdWx0OlxuXHRcdFx0Ly8gQ2FuIG5vdCBjb3B5IHVua25vd24gb2JqZWN0c1xuXHRcdFx0cmV0dXJuIG9iamVjdDtcblx0fVxuXHRmb3IgKHByb3AgaW4gb2JqZWN0KSB7XG5cdFx0aWYgKG9iamVjdC5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuXHRcdFx0Y2xvbmVbcHJvcF0gPSBaZXNrLmNsb25lKG9iamVjdFtwcm9wXSk7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBjbG9uZTtcbn07XG5cbk9iamVjdC5hc3NpZ24oQXJyYXkucHJvdG90eXBlLCB7XG5cdGNvbnRhaW5zOiBmdW5jdGlvbih4KSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZiAodGhpc1tpXSA9PT0geCkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9LFxuXHRyZW1vdmU6IGZ1bmN0aW9uKHgpIHtcblx0XHR2YXIgdGVtcCA9IHRoaXMuc2xpY2UoMCk7XG5cdFx0dGVtcC5zcGxpY2UoeCwgMSk7XG5cdFx0cmV0dXJuIHRlbXA7XG5cdH0sXG5cdC8qKlxuXHQgKiBKb2luIGVsZW1lbnRzIG9mIGFuIGFycmF5IGJ5IHdyYXBwaW5nIGVhY2ggb25lIHdpdGggYSBwcmVmaXgvc3VmZml4XG5cdCAqIFxuXHQgKiBAcGFyYW0gc3RyaW5nXG5cdCAqICAgICAgICAgICAgcHJlZml4XG5cdCAqIEBwYXJhbSBzdHJpbmdcblx0ICogICAgICAgICAgICBzdWZmaXhcblx0ICogQHJldHVybiBzdHJpbmdcblx0ICovXG5cdGpvaW5fd3JhcDogZnVuY3Rpb24ocHJlZml4LCBzdWZmaXgpIHtcblx0XHRwcmVmaXggPSBTdHJpbmcocHJlZml4KSB8fCBcIlwiO1xuXHRcdHN1ZmZpeCA9IFN0cmluZyhzdWZmaXgpIHx8IFwiXCI7XG5cdFx0cmV0dXJuIHByZWZpeCArIHRoaXMuam9pbihzdWZmaXggKyBwcmVmaXgpICsgc3VmZml4O1xuXHR9LFxufSk7XG5cbk9iamVjdC5hc3NpZ24oT2JqZWN0LCB7XG5cdGZyb21DYW1lbENhc2U6IGZ1bmN0aW9uKGZyb20pIHtcblx0XHR2YXIgdG8gPSB7fTtcblx0XHRmb3IgKHZhciBpIGluIGZyb20pIHtcblx0XHRcdGlmIChmcm9tLmhhc093blByb3BlcnR5KGkpKSB7XG5cdFx0XHRcdHRvW2kuZnJvbUNhbWVsQ2FzZSgpXSA9IGZyb21baV07XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiB0bztcblx0fSxcblx0dG9DYW1lbENhc2U6IGZ1bmN0aW9uKGZyb20pIHtcblx0XHR2YXIgdG8gPSB7fTtcblx0XHRmb3IgKHZhciBpIGluIHRoaXMpIHtcblx0XHRcdGlmIChmcm9tLmhhc093blByb3BlcnR5KGkpKSB7XG5cdFx0XHRcdHRvW2kudG9DYW1lbENhc2UoKV0gPSBmcm9tW2ldO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gdG87XG5cdH0sXG59KTtcblxuT2JqZWN0LmFzc2lnbihTdHJpbmcucHJvdG90eXBlLCB7XG5cdGNvbXBhcmU6IGZ1bmN0aW9uKGEpIHtcblx0XHRyZXR1cm4gdGhpcyA8IGEgPyAtMSA6IHRoaXMgPT09IGEgPyAwIDogMTtcblx0fSxcblx0bGVmdDogZnVuY3Rpb24oZGVsaW0sIGRlZikge1xuXHRcdHZhciBwb3MgPSB0aGlzLmluZGV4T2YoZGVsaW0pO1xuXHRcdHJldHVybiBwb3MgPCAwID8gYXZhbHVlKGFyZ3VtZW50cywgMSwgZGVmIHx8IHRoaXMpIDogdGhpcy5zdWJzdHIoMCwgcG9zKTtcblx0fSxcblx0cmxlZnQ6IGZ1bmN0aW9uKGRlbGltLCBkZWYpIHtcblx0XHR2YXIgcG9zID0gdGhpcy5sYXN0SW5kZXhPZihkZWxpbSk7XG5cdFx0cmV0dXJuIHBvcyA8IDAgPyBhdmFsdWUoYXJndW1lbnRzLCAxLCBkZWYgfHwgdGhpcykgOiB0aGlzLnN1YnN0cigwLCBwb3MpO1xuXHR9LFxuXHRyaWdodDogZnVuY3Rpb24oZGVsaW0sIGRlZikge1xuXHRcdHZhciBwb3MgPSB0aGlzLmluZGV4T2YoZGVsaW0pO1xuXHRcdHJldHVybiBwb3MgPCAwID8gYXZhbHVlKGFyZ3VtZW50cywgMSwgZGVmIHx8IHRoaXMpIDogdGhpcy5zdWJzdHIocG9zICsgZGVsaW0ubGVuZ3RoKTtcblx0fSxcblx0cnJpZ2h0OiBmdW5jdGlvbihkZWxpbSwgZGVmKSB7XG5cdFx0dmFyIHBvcyA9IHRoaXMubGFzdEluZGV4T2YoZGVsaW0pO1xuXHRcdHJldHVybiBwb3MgPCAwID8gYXZhbHVlKGFyZ3VtZW50cywgMSwgZGVmIHx8IHRoaXMpIDogdGhpcy5zdWJzdHIocG9zICsgZGVsaW0ubGVuZ3RoKTtcblx0fSxcblx0bHRyaW06IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLnJlcGxhY2UoL15cXHMrLywgXCJcIik7XG5cdH0sXG5cdHJ0cmltOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5yZXBsYWNlKC9cXHMrJC8sIFwiXCIpO1xuXHR9LFxuXHR0cmltOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5yZXBsYWNlKC9eXFxzKy8sIFwiXCIpLnJlcGxhY2UoL1xccyskLywgXCJcIik7XG5cdH0sXG5cdC8qKlxuXHQgKiBAZGVwcmVjYXRlZFxuXHQgKiBAcGFyYW0geFxuXHQgKiAgICAgICAgICAgIFN0cmluZyB0byBsb29rIGF0XG5cdCAqL1xuXHRlbmRzX3dpdGg6IGZ1bmN0aW9uKHgpIHtcblx0XHRyZXR1cm4gdGhpcy5lbmRzKHgpO1xuXHR9LFxuXHRlbmRzOiBmdW5jdGlvbih4KSB7XG5cdFx0dmFyIHhuID0geC5sZW5ndGgsXG5cdFx0XHRuID0gdGhpcy5sZW5ndGg7XG5cdFx0aWYgKHhuID4gbikge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5zdWJzdHJpbmcobiAtIHhuLCBuKSA9PT0geDtcblx0fSxcblx0YmVnaW5zaTogZnVuY3Rpb24oc3RyaW5nKSB7XG5cdFx0dmFyIGxlbiA9IHN0cmluZy5sZW5ndGg7XG5cdFx0aWYgKGxlbiA+IHRoaXMubGVuZ3RoKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLnN1YnN0cigwLCBsZW4pLnRvTG93ZXJDYXNlKCkgPT09IHN0cmluZy50b0xvd2VyQ2FzZSgpO1xuXHR9LFxuXHRiZWdpbnM6IGZ1bmN0aW9uKHN0cmluZykge1xuXHRcdHZhciBsZW4gPSBzdHJpbmcubGVuZ3RoO1xuXHRcdGlmIChsZW4gPiB0aGlzLmxlbmd0aCkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5zdWJzdHIoMCwgbGVuKSA9PT0gc3RyaW5nO1xuXHR9LFxuXHRzdHJfcmVwbGFjZTogZnVuY3Rpb24ocywgcikge1xuXHRcdHZhciBzdHIgPSB0aGlzO1xuXHRcdHZhciBpO1xuXHRcdGlmIChpc19zdHJpbmcocykpIHtcblx0XHRcdGlmIChpc19zdHJpbmcocikpIHtcblx0XHRcdFx0cmV0dXJuIHRoaXMuc3BsaXQocykuam9pbihyKTtcblx0XHRcdH1cblx0XHRcdGZvciAoaSA9IDA7IGkgPCByLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdHN0ciA9IHN0ci5zdHJfcmVwbGFjZShzLCByW2ldKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBzdHI7XG5cdFx0fVxuXHRcdGlmIChpc19zdHJpbmcocikpIHtcblx0XHRcdGZvciAoaSA9IDA7IGkgPCBzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdHN0ciA9IHN0ci5zdHJfcmVwbGFjZShzW2ldLCByKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBzdHI7XG5cdFx0fVxuXHRcdHZhciBuID0gTWF0aC5taW4ocy5sZW5ndGgsIHIubGVuZ3RoKTtcblx0XHRmb3IgKGkgPSAwOyBpIDwgbjsgaSsrKSB7XG5cdFx0XHRzdHIgPSBzdHIuc3RyX3JlcGxhY2Uoc1tpXSwgcltpXSk7XG5cdFx0fVxuXHRcdHJldHVybiBzdHI7XG5cdH0sXG5cdHRyOiBmdW5jdGlvbihvYmplY3QpIHtcblx0XHR2YXIgayxcblx0XHRcdHNlbGYgPSB0aGlzO1xuXHRcdGZvciAoayBpbiBvYmplY3QpIHtcblx0XHRcdGlmIChvYmplY3QuaGFzT3duUHJvcGVydHkoaykpIHtcblx0XHRcdFx0c2VsZiA9IHNlbGYuc3RyX3JlcGxhY2Uoaywgb2JqZWN0W2tdKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIHNlbGY7XG5cdH0sXG5cdG1hcDogZnVuY3Rpb24ob2JqZWN0LCBjYXNlX2luc2Vuc2l0aXZlKSB7XG5cdFx0dmFyIGssXG5cdFx0XHRzdWZmaXggPSBcIlwiLFxuXHRcdFx0c2VsZjtcblx0XHRjYXNlX2luc2Vuc2l0aXZlID0gISFjYXNlX2luc2Vuc2l0aXZlOyAvLyBDb252ZXJ0IHRvIGJvb2xcblx0XHRpZiAoIWlzX29iamVjdChvYmplY3QpKSB7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cdFx0c2VsZiA9IHRoaXM7XG5cdFx0aWYgKGNhc2VfaW5zZW5zaXRpdmUpIHtcblx0XHRcdG9iamVjdCA9IFplc2suY2hhbmdlX2tleV9jYXNlKG9iamVjdCk7XG5cdFx0XHRzdWZmaXggPSBcImlcIjtcblx0XHR9XG5cdFx0Zm9yIChrIGluIG9iamVjdCkge1xuXHRcdFx0aWYgKG9iamVjdC5oYXNPd25Qcm9wZXJ0eShrKSkge1xuXHRcdFx0XHR2YXIgdmFsdWUgPSBvYmplY3Rba10sXG5cdFx0XHRcdFx0cmVwbGFjZSA9IHZhbHVlID09PSBudWxsID8gXCJcIiA6IFN0cmluZyhvYmplY3Rba10pO1xuXHRcdFx0XHRzZWxmID0gc2VsZi5yZXBsYWNlKG5ldyBSZWdFeHAoXCJcXFxce1wiICsgayArIFwiXFxcXH1cIiwgXCJnXCIgKyBzdWZmaXgpLCByZXBsYWNlKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIHNlbGY7XG5cdH0sXG5cdHRvX2FycmF5OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgaSxcblx0XHRcdHIgPSBbXTtcblx0XHRmb3IgKGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0ci5wdXNoKHRoaXMuY2hhckF0KGkpKTtcblx0XHR9XG5cdFx0cmV0dXJuIHI7XG5cdH0sXG5cdHVucXVvdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBuID0gdGhpcy5sZW5ndGg7XG5cdFx0dmFyIHEgPSBhcmd1bWVudHNbMF0gfHwgXCJcXFwiXFxcIicnXCI7XG5cdFx0dmFyIHAgPSBxLmluZGV4T2YodGhpcy5zdWJzdHJpbmcoMCwgMSkpO1xuXHRcdGlmIChwIDwgMCkge1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXHRcdGlmICh0aGlzLnN1YnN0cmluZyhuIC0gMSwgbikgPT09IHEuY2hhckF0KHAgKyAxKSkge1xuXHRcdFx0cmV0dXJuIHRoaXMuc3Vic3RyaW5nKDEsIG4gLSAxKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cdHRvQ2FtZWxDYXNlOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgcmVzdWx0ID0gXCJcIjtcblx0XHRaZXNrLmVhY2godGhpcy5zcGxpdChcIl9cIiksIGZ1bmN0aW9uKCkge1xuXHRcdFx0cmVzdWx0ICs9IHRoaXMuc3Vic3RyKDAsIDEpLnRvVXBwZXJDYXNlKCkgKyB0aGlzLnN1YnN0cigxKS50b0xvd2VyQ2FzZSgpO1xuXHRcdH0pO1xuXHRcdHJldHVybiByZXN1bHQ7XG5cdH0sXG5cdGZyb21DYW1lbENhc2U6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLnJlcGxhY2UoL1tBLVpdL2csIGZ1bmN0aW9uKHYpIHtcblx0XHRcdHJldHVybiBcIl9cIiArIHYudG9Mb3dlckNhc2UoKTtcblx0XHR9KTtcblx0fSxcblx0dW5wcmVmaXg6IGZ1bmN0aW9uKHN0cmluZywgZGVmKSB7XG5cdFx0aWYgKHRoaXMuYmVnaW5zKHN0cmluZykpIHtcblx0XHRcdHJldHVybiB0aGlzLnN1YnN0cihzdHJpbmcubGVuZ3RoKTtcblx0XHR9XG5cdFx0cmV0dXJuIGRlZiB8fCB0aGlzO1xuXHR9LFxufSk7XG5PYmplY3QuYXNzaWduKFN0cmluZy5wcm90b3R5cGUsIHtcblx0ZW5kczogU3RyaW5nLnByb3RvdHlwZS5lbmRzX3dpdGgsXG59KTtcblxuWmVzay50b19pbnRlZ2VyID0gZnVuY3Rpb24oeCkge1xuXHR2YXIgZCA9IGFyZ3VtZW50cy5sZW5ndGggPiAxID8gYXJndW1lbnRzWzFdIDogbnVsbDtcblx0eCA9IHBhcnNlSW50KHgsIDEwKTtcblx0aWYgKHR5cGVvZiB4ID09PSBcIm51bWJlclwiKSB7XG5cdFx0cmV0dXJuIHg7XG5cdH1cblx0cmV0dXJuIGQ7XG59O1xuXG5mdW5jdGlvbiB0b19saXN0KHgsIGRlZiwgZGVsaW0pIHtcblx0ZGVmID0gZGVmIHx8IFtdO1xuXHRkZWxpbSA9IGRlbGltIHx8IFwiLlwiO1xuXHRpZiAoaXNfYXJyYXkoeCkpIHtcblx0XHRyZXR1cm4geDtcblx0fVxuXHRpZiAoeCA9PT0gbnVsbCkge1xuXHRcdHJldHVybiBkZWY7XG5cdH1cblx0cmV0dXJuIHgudG9TdHJpbmcoKS5zcGxpdChkZWxpbSk7XG59XG5cblplc2sudG9fbGlzdCA9IHRvX2xpc3Q7XG5cblplc2sudG9fZmxvYXQgPSBmdW5jdGlvbih4KSB7XG5cdHZhciBkID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBhcmd1bWVudHNbMV0gOiBudWxsO1xuXHR4ID0gcGFyc2VGbG9hdCh4KTtcblx0aWYgKHR5cGVvZiB4ID09PSBcIm51bWJlclwiKSB7XG5cdFx0cmV0dXJuIHg7XG5cdH1cblx0cmV0dXJuIGQ7XG59O1xuXG5aZXNrLnRvX3N0cmluZyA9IGZ1bmN0aW9uKHgpIHtcblx0cmV0dXJuIHgudG9TdHJpbmcoKTtcbn07XG5cbmZ1bmN0aW9uIHRvX2Jvb2woeCkge1xuXHR2YXIgZCA9IGFyZ3VtZW50cy5sZW5ndGggPiAxID8gYXJndW1lbnRzWzFdIDogZmFsc2U7XG5cdGlmIChpc19ib29sKHgpKSB7XG5cdFx0cmV0dXJuIHg7XG5cdH1cblx0aWYgKGlzX251bWVyaWMoeCkpIHtcblx0XHRyZXR1cm4geCAhPT0gMDtcblx0fVxuXHRpZiAoaXNfc3RyaW5nKHgpKSB7XG5cdFx0aWYgKFtcInRcIiwgXCJ0cnVlXCIsIFwiMVwiLCBcImVuYWJsZWRcIiwgXCJ5XCIsIFwieWVzXCJdLmNvbnRhaW5zKHgpKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdFx0aWYgKFtcImZcIiwgXCJmYWxzZVwiLCBcIjBcIiwgXCJkaXNhYmxlZFwiLCBcIm5cIiwgXCJub1wiXS5jb250YWlucyh4KSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gZDtcbn1cblplc2sudG9fYm9vbCA9IHRvX2Jvb2w7XG5cblplc2suZW1wdHkgPSBmdW5jdGlvbih2KSB7XG5cdHJldHVybiB0eXBlb2YgdiA9PT0gXCJ1bmRlZmluZWRcIiB8fCB2ID09PSBudWxsIHx8IHYgPT09IFwiXCI7XG59O1xuXG5aZXNrLlpPYmplY3QgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXHR0aGlzLm9wdGlvbnMgPSBaZXNrLmNoYW5nZV9rZXlfY2FzZShPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zKSk7XG5cdC8vIHRoaXMuY29uc3RydWN0b3Iuc3VwZXIuY2FsbCh0aGlzKTtcbn07XG5aZXNrLmluaGVyaXQoWmVzay5aT2JqZWN0LCBudWxsLCB7XG5cdGNsb25lOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gWmVzay5jbG9uZSh0aGlzKTtcblx0fSxcbn0pO1xuXG5aZXNrLmNoYW5nZV9rZXlfY2FzZSA9IGZ1bmN0aW9uKG1lKSB7XG5cdHZhciBrLFxuXHRcdG5ld28gPSB7fTtcblx0Zm9yIChrIGluIG1lKSB7XG5cdFx0aWYgKG1lLmhhc093blByb3BlcnR5KGspKSB7XG5cdFx0XHRuZXdvW2sudG9Mb3dlckNhc2UoKV0gPSBtZVtrXTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIG5ld287XG59O1xuXG5pZiAodHlwZW9mIE1hdGguc2lnbiAhPT0gXCJmdW5jdGlvblwiKSB7XG5cdE1hdGguc2lnbiA9IGZ1bmN0aW9uKHgpIHtcblx0XHRyZXR1cm4geCA/ICh4IDwgMCA/IC0xIDogMSkgOiAwO1xuXHR9O1xufVxuXG4vLyBUT0RPIFdoYXQncyB0aGlzIGZvcj9cblplc2suYWpheF9mb3JtID0gZnVuY3Rpb24oKSB7XG5cdHZhciAkZm9ybSA9ICQodGhpcyksXG5cdFx0dGFyZ2V0ID0gJGZvcm0uYXR0cihcInRhcmdldFwiKSxcblx0XHQkdGFyZ2V0ID0gJChcIiNcIiArIHRhcmdldCk7XG5cdFplc2subG9nKCR0YXJnZXQuaHRtbCgpKTtcbn07XG5cbi8qXG4gKiBDb21wYXRpYmlsaXR5XG4gKi9cbi8vIGlmICghT2JqZWN0LnByb3RvdHlwZS5rZXlzKSB7XG4vLyBcdE9iamVjdC5wcm90b3R5cGUua2V5cyA9IGZ1bmN0aW9uKG9iaikge1xuLy8gXHRcdHZhciBrZXlzID0gW10sIGs7XG4vLyBcdFx0Zm9yIChrIGluIG9iaikge1xuLy8gXHRcdFx0aWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGspKSB7XG4vLyBcdFx0XHRcdGtleXMucHVzaChrKTtcbi8vIFx0XHRcdH1cbi8vIFx0XHR9XG4vLyBcdFx0cmV0dXJuIGtleXM7XG4vLyBcdH07XG4vLyB9XG5cbiQuZm4uZXF1YWxoZWlnaHQgPSBmdW5jdGlvbihzZWxlY3Rvcikge1xuXHQkKHRoaXMpLmVhY2goZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGggPSBudWxsO1xuXHRcdCQoc2VsZWN0b3IsICQodGhpcykpLmVhY2goZnVuY3Rpb24oKSB7XG5cdFx0XHRoID0gTWF0aC5tYXgoJCh0aGlzKS5oZWlnaHQoKSwgaCk7XG5cdFx0fSk7XG5cdFx0JChzZWxlY3RvciwgJCh0aGlzKSkuZWFjaChmdW5jdGlvbigpIHtcblx0XHRcdCQodGhpcykuaGVpZ2h0KGggKyBcInB4XCIpO1xuXHRcdH0pO1xuXHR9KTtcbn07XG5cblplc2suaW5pdGVkID0gdHJ1ZTtcblxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKSB7XG5cdFplc2suaG9vayhcImRvY3VtZW50OjpyZWFkeVwiKTtcbn0pO1xuJCh3aW5kb3cpLm9uKFwibG9hZFwiLCBmdW5jdGlvbigpIHtcblx0WmVzay5ob29rKFwid2luZG93Ojpsb2FkXCIpO1xufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gWmVzaztcbiJdfQ==