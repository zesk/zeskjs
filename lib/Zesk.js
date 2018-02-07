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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9aZXNrLmpzIl0sIm5hbWVzIjpbIiQiLCJyZXF1aXJlIiwiWmVzayIsImhvb2tzIiwiVyIsImdsb2JhbCIsIndpbmRvdyIsImQiLCJkb2N1bWVudCIsIkwiLCJsb2NhdGlvbiIsImdldHR5cGUiLCJ4IiwiT2JqZWN0IiwicHJvdG90eXBlIiwidG9TdHJpbmciLCJjYWxsIiwic3BsaXQiLCJ0b0xvd2VyQ2FzZSIsImF2YWx1ZSIsIm9iaiIsImkiLCJkZWYiLCJ1bmRlZmluZWQiLCJpc19ib29sIiwiYSIsImlzX251bWVyaWMiLCJpc19zdHJpbmciLCJpc19hcnJheSIsImlzX29iamVjdCIsImlzX2ludGVnZXIiLCJwYXJzZUludCIsImlzX2Z1bmN0aW9uIiwiaXNfZmxvYXQiLCJpc191cmwiLCJleGVjIiwidHJpbSIsImZsaXAiLCJvYmplY3QiLCJyZXN1bHQiLCJoYXNPd25Qcm9wZXJ0eSIsIlN0cmluZyIsImlzX2RhdGUiLCJlYWNoIiwiaXNfbnVtYmVyIiwidG9fbGlzdCIsImRlbGltIiwidG9fYm9vbCIsImFyZ3VtZW50cyIsImxlbmd0aCIsImNvbnRhaW5zIiwib2JqZWN0X3BhdGgiLCJwYXRoIiwiY3VyciIsImsiLCJvYmplY3Rfc2V0X3BhdGgiLCJ2YWx1ZSIsInNlZyIsImhvb2tfcGF0aCIsImhvb2siLCJwdXNoIiwiYXNzaWduIiwic2V0dGluZ3MiLCJ3IiwidXJsX3BhcnRzIiwicGF0aG5hbWUiLCJob3N0IiwicXVlcnkiLCJzZWFyY2giLCJzY2hlbWUiLCJwcm90b2NvbCIsInVybCIsIlVSTCIsInVyaSIsInBhZ2Vfc2NyaXB0cyIsInF1ZXJ5X2dldCIsInYiLCJwYWlyIiwidSIsInJpZ2h0IiwiY29va2llIiwibmFtZSIsIm9wdGlvbnMiLCJnZXRjb29raWUiLCJuIiwiYyIsInMiLCJsYXN0SW5kZXhPZiIsImUiLCJpbmRleE9mIiwidW5lc2NhcGUiLCJzdWJzdHJpbmciLCJzZXRjb29raWUiLCJEYXRlIiwidCIsInR0bCIsIm0iLCJkb21haW4iLCJzZXRGdWxsWWVhciIsInNldFRpbWUiLCJnZXRUaW1lIiwiZXNjYXBlIiwidG9HTVRTdHJpbmciLCJkZWxldGVfY29va2llIiwiZG9tIiwibm93IiwiY3NzIiwicCIsImNyZWF0ZUVsZW1lbnQiLCJyZWwiLCJocmVmIiwibWVkaWEiLCJnZXRFbGVtZW50c0J5VGFnTmFtZSIsImFwcGVuZENoaWxkIiwibG9nIiwiY29uc29sZSIsImFkZF9ob29rIiwiZnVuIiwiaGFzX2hvb2siLCJmdW5jcyIsImFyZ3MiLCJjbG9uZSIsInJlc3VsdHMiLCJzaGlmdCIsImFwcGx5IiwiZ2V0X3BhdGgiLCJzZXRfcGF0aCIsImdldCIsImdldGIiLCJzZXQiLCJvdmVyd3JpdGUiLCJpbmhlcml0IiwidGhlX2NsYXNzIiwic3VwZXJfY2xhc3MiLCJtZXRob2QiLCJDb25zdHJ1Y3QiLCJjb25zdHJ1Y3RvciIsImZuIiwidGVybV9mYWxzZSIsInIiLCJ0cGwiLCJtaXhlZCIsIm1hcCIsImh0bWwiLCJzY3JpcHRfc3JjX25vcm1hbGl6ZSIsInNyYyIsIm1hdGNoZXMiLCJwYXJ0cyIsInVucHJlZml4IiwibWF0Y2giLCJzY3JpcHRzX2luaXQiLCJzY3JpcHRfYWRkIiwiYXR0ciIsInNjcmlwdHMiLCJzY3JpcHRzX2NhY2hlZCIsInNyY3MiLCJzY3JpcHRfbG9hZGVkIiwic3R5bGVzaGVldF9sb2FkZWQiLCJtZXNzYWdlIiwibGV2ZWwiLCJyZWdleHBfcXVvdGUiLCJzdHIiLCJkZWxpbWl0ZXIiLCJyZXBsYWNlIiwiUmVnRXhwIiwicHJvcCIsIkNvbnN0cnVjdG9yIiwic291cmNlIiwic3Vic3RyIiwiTnVtYmVyIiwiaWdub3JlQ2FzZSIsIm11bHRpbGluZSIsIkFycmF5IiwicmVtb3ZlIiwidGVtcCIsInNsaWNlIiwic3BsaWNlIiwiam9pbl93cmFwIiwicHJlZml4Iiwic3VmZml4Iiwiam9pbiIsImZyb21DYW1lbENhc2UiLCJmcm9tIiwidG8iLCJ0b0NhbWVsQ2FzZSIsImNvbXBhcmUiLCJsZWZ0IiwicG9zIiwicmxlZnQiLCJycmlnaHQiLCJsdHJpbSIsInJ0cmltIiwiZW5kc193aXRoIiwiZW5kcyIsInhuIiwiYmVnaW5zaSIsInN0cmluZyIsImxlbiIsImJlZ2lucyIsInN0cl9yZXBsYWNlIiwiTWF0aCIsIm1pbiIsInRyIiwic2VsZiIsImNhc2VfaW5zZW5zaXRpdmUiLCJjaGFuZ2Vfa2V5X2Nhc2UiLCJ0b19hcnJheSIsImNoYXJBdCIsInVucXVvdGUiLCJxIiwidG9VcHBlckNhc2UiLCJ0b19pbnRlZ2VyIiwidG9fZmxvYXQiLCJwYXJzZUZsb2F0IiwidG9fc3RyaW5nIiwiZW1wdHkiLCJaT2JqZWN0IiwibWUiLCJuZXdvIiwic2lnbiIsImFqYXhfZm9ybSIsIiRmb3JtIiwidGFyZ2V0IiwiJHRhcmdldCIsImVxdWFsaGVpZ2h0Iiwic2VsZWN0b3IiLCJoIiwibWF4IiwiaGVpZ2h0IiwiaW5pdGVkIiwicmVhZHkiLCJvbiIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTs7O0FBR0EsSUFBSUEsSUFBSUMsUUFBUSxRQUFSLENBQVI7O0FBRUEsSUFBSUMsT0FBTyxFQUFYO0FBQ0EsSUFBSUMsUUFBUSxFQUFaO0FBQ0EsSUFBSUMsSUFBSUMsT0FBT0MsTUFBUCxJQUFpQixFQUF6QjtBQUNBLElBQUlDLElBQUlILEVBQUVJLFFBQUYsSUFBYyxFQUF0QjtBQUNBLElBQUlDLElBQUlMLEVBQUVNLFFBQUYsSUFBYyxFQUF0Qjs7QUFFQSxTQUFTQyxPQUFULENBQWlCQyxDQUFqQixFQUFvQjtBQUNuQixLQUFJQSxNQUFNLElBQVYsRUFBZ0I7QUFDZixTQUFPLE1BQVA7QUFDQTtBQUNELFFBQU9DLE9BQU9DLFNBQVAsQ0FBaUJDLFFBQWpCLENBQ0xDLElBREssQ0FDQUosQ0FEQSxFQUVMSyxLQUZLLENBRUMsR0FGRCxFQUVNLENBRk4sRUFHTEEsS0FISyxDQUdDLEdBSEQsRUFHTSxDQUhOLEVBSUxDLFdBSkssRUFBUDtBQUtBOztBQUVELFNBQVNDLE1BQVQsQ0FBZ0JDLEdBQWhCLEVB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RUFBcUIyQyxJQUFyQixDQUEwQixZQUFXO0FBQ3BDM0MsS0FBRSxJQUFGLEVBQVFvTyxNQUFSLENBQWVGLElBQUksSUFBbkI7QUFDQSxHQUZEO0FBR0EsRUFSRDtBQVNBLENBVkQ7O0FBWUFoTyxLQUFLbU8sTUFBTCxHQUFjLElBQWQ7O0FBRUFyTyxFQUFFUSxRQUFGLEVBQVk4TixLQUFaLENBQWtCLFlBQVc7QUFDNUJwTyxNQUFLeUQsSUFBTCxDQUFVLGlCQUFWO0FBQ0EsQ0FGRDtBQUdBM0QsRUFBRU0sTUFBRixFQUFVaU8sRUFBVixDQUFhLE1BQWIsRUFBcUIsWUFBVztBQUMvQnJPLE1BQUt5RCxJQUFMLENBQVUsY0FBVjtBQUNBLENBRkQ7O0FBSUE2SyxPQUFPQyxPQUFQLEdBQWlCdk8sSUFBakIiLCJmaWxlIjoiWmVzay5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0ICZjb3B5OyAyMDE3IE1hcmtldCBBY3VtZW4sIEluYy5cbiAqL1xudmFyICQgPSByZXF1aXJlKFwianF1ZXJ5XCIpO1xuXG52YXIgWmVzayA9IHt9O1xudmFyIGhvb2tzID0ge307XG52YXIgVyA9IGdsb2JhbC53aW5kb3cgfHwge307XG52YXIgZCA9IFcuZG9jdW1lbnQgfHwge307XG52YXIgTCA9IFcubG9jYXRpb24gfHwge307XG5cbmZ1bmN0aW9uIGdldHR5cGUoeCkge1xuXHRpZiAoeCA9PT0gbnVsbCkge1xuXHRcdHJldHVybiBcIm51bGxcIjtcblx0fVxuXHRyZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZ1xuXHRcdC5jYWxsKHgpXG5cdFx0LnNwbGl0KFwiIFwiKVsxXVxuXHRcdC5zcGxpdChcIl1cIilbMF1cblx0XHQudG9Mb3dlckNhc2UoKTtcbn1cblxuZnVuY3Rpb24gYXZhbHVlKG9iaiwgaSwgZGVmKSB7XG5cdGlmIChkZWYgPT09IHVuZGVmaW5lZCkge1xuXHRcdGRlZiA9IG51bGw7XG5cdH1cblx0aWYgKHR5cGVvZiBvYmogPT09IFwib2JqZWN0XCIpIHtcblx0XHRpZiAodHlwZW9mIG9ialtpXSAhPT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdFx0cmV0dXJuIG9ialtpXTtcblx0XHR9XG5cdFx0cmV0dXJuIGRlZjtcblx0fVxuXHRyZXR1cm4gZGVmO1xufVxuWmVzay5hdmFsdWUgPSBhdmFsdWU7XG5cbmZ1bmN0aW9uIGlzX2Jvb2woYSkge1xuXHRyZXR1cm4gZ2V0dHlwZShhKSA9PT0gXCJib29sZWFuXCI7XG59XG5mdW5jdGlvbiBpc19udW1lcmljKGEpIHtcblx0cmV0dXJuIGdldHR5cGUoYSkgPT09IFwibnVtYmVyXCI7XG59XG5mdW5jdGlvbiBpc19zdHJpbmcoYSkge1xuXHRyZXR1cm4gZ2V0dHlwZShhKSA9PT0gXCJzdHJpbmdcIjtcbn1cbmZ1bmN0aW9uIGlzX2FycmF5KGEpIHtcblx0cmV0dXJuIGdldHR5cGUoYSkgPT09IFwiYXJyYXlcIjtcbn1cbmZ1bmN0aW9uIGlzX29iamVjdChhKSB7XG5cdHJldHVybiBnZXR0eXBlKGEpID09PSBcIm9iamVjdFwiO1xufVxuZnVuY3Rpb24gaXNfaW50ZWdlcihhKSB7XG5cdHJldHVybiBpc19udW1lcmljKGEpICYmIHBhcnNlSW50KGEsIDEwKSA9PT0gYTtcbn1cbmZ1bmN0aW9uIGlzX2Z1bmN0aW9uKGEpIHtcblx0cmV0dXJuIGdldHR5cGUoYSkgPT09IFwiZnVuY3Rpb25cIjtcbn1cbmZ1bmN0aW9uIGlzX2Zsb2F0KGEpIHtcblx0cmV0dXJuIHR5cGVvZiBhID09PSBcIm51bWJlclwiICYmIHBhcnNlSW50KGEsIDEwKSAhPT0gYTtcbn1cbmZ1bmN0aW9uIGlzX3VybCh4KSB7XG5cdHJldHVybiAvXmh0dHA6XFwvXFwvLit8Xmh0dHBzOlxcL1xcLy4rfF5tYWlsdG86LitALit8XmZ0cDpcXC9cXC8uK3xeZmlsZTpcXC9cXC8uK3xebmV3czpcXC9cXC8uKy8uZXhlYyhcblx0XHR4LnRvTG93ZXJDYXNlKCkudHJpbSgpXG5cdCk7XG59XG5cblplc2suZmxpcCA9IGZ1bmN0aW9uKG9iamVjdCkge1xuXHR2YXIgaSxcblx0XHRyZXN1bHQgPSB7fTtcblx0Zm9yIChpIGluIG9iamVjdCkge1xuXHRcdGlmIChvYmplY3QuaGFzT3duUHJvcGVydHkoaSkpIHtcblx0XHRcdHJlc3VsdFtTdHJpbmcob2JqZWN0W2ldKV0gPSBpO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gcmVzdWx0O1xufTtcblxuLyogS2VybmVsICovXG5cblplc2suaXNfZGF0ZSA9IGZ1bmN0aW9uKGEpIHtcblx0cmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhKSA9PT0gXCJbb2JqZWN0IERhdGVdXCI7XG59O1xuXG5aZXNrLmdldHR5cGUgPSBnZXR0eXBlO1xuXG5aZXNrLmVhY2ggPSBaZXNrLmVhY2g7XG5cblplc2suaXNfYXJyYXkgPSBpc19hcnJheTtcblplc2suaXNfb2JqZWN0ID0gaXNfb2JqZWN0O1xuWmVzay5pc19hcnJheSA9IGlzX2FycmF5O1xuWmVzay5pc19udW1iZXIgPSBpc19udW1lcmljO1xuWmVzay5pc19udW1lcmljID0gaXNfbnVtZXJpYztcblplc2suaXNfYm9vbCA9IGlzX2Jvb2w7XG5aZXNrLmlzX3N0cmluZyA9IGlzX3N0cmluZztcblplc2suaXNfaW50ZWdlciA9IGlzX2ludGVnZXI7XG5aZXNrLmlzX2Z1bmN0aW9uID0gaXNfZnVuY3Rpb247XG5aZXNrLmlzX2Zsb2F0ID0gaXNfZmxvYXQ7XG5aZXNrLmlzX3VybCA9IGlzX3VybDtcblxuZnVuY3Rpb24gdG9fbGlzdCh4LCBkZWYsIGRlbGltKSB7XG5cdGRlZiA9IGRlZiB8fCBbXTtcblx0ZGVsaW0gPSBkZWxpbSB8fCBcIi5cIjtcblx0aWYgKGlzX2FycmF5KHgpKSB7XG5cdFx0cmV0dXJuIHg7XG5cdH1cblx0aWYgKHggPT09IG51bGwpIHtcblx0XHRyZXR1cm4gZGVmO1xuXHR9XG5cdHJldHVybiB4LnRvU3RyaW5nKCkuc3BsaXQoZGVsaW0pO1xufVxuXG5mdW5jdGlvbiB0b19ib29sKHgpIHtcblx0dmFyIGQgPSBhcmd1bWVudHMubGVuZ3RoID4gMSA/IGFyZ3VtZW50c1sxXSA6IGZhbHNlO1xuXHRpZiAoaXNfYm9vbCh4KSkge1xuXHRcdHJldHVybiB4O1xuXHR9XG5cdGlmIChpc19udW1lcmljKHgpKSB7XG5cdFx0cmV0dXJuIHggIT09IDA7XG5cdH1cblx0aWYgKGlzX3N0cmluZyh4KSkge1xuXHRcdGlmIChbXCJ0XCIsIFwidHJ1ZVwiLCBcIjFcIiwgXCJlbmFibGVkXCIsIFwieVwiLCBcInllc1wiXS5jb250YWlucyh4KSkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHRcdGlmIChbXCJmXCIsIFwiZmFsc2VcIiwgXCIwXCIsIFwiZGlzYWJsZWRcIiwgXCJuXCIsIFwibm9cIl0uY29udGFpbnMoeCkpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIGQ7XG59XG5cbmZ1bmN0aW9uIG9iamVjdF9wYXRoKG9iamVjdCwgcGF0aCwgZGVmKSB7XG5cdHZhciBjdXJyID0gb2JqZWN0LFxuXHRcdGs7XG5cdHBhdGggPSB0b19saXN0KHBhdGgsIFtdLCBcIi5cIik7XG5cdGZvciAoayA9IDA7IGsgPCBwYXRoLmxlbmd0aDsgaysrKSB7XG5cdFx0aWYgKGsgPT09IHBhdGgubGVuZ3RoIC0gMSkge1xuXHRcdFx0cmV0dXJuIGF2YWx1ZShjdXJyLCBwYXRoW2tdLCBkZWYpO1xuXHRcdH1cblx0XHRjdXJyID0gYXZhbHVlKGN1cnIsIHBhdGhba10pO1xuXHRcdGlmIChjdXJyID09PSBudWxsKSB7XG5cdFx0XHRyZXR1cm4gZGVmO1xuXHRcdH1cblx0XHRpZiAoIWlzX29iamVjdChjdXJyKSkge1xuXHRcdFx0cmV0dXJuIGRlZjtcblx0XHR9XG5cdH1cblx0cmV0dXJuIGN1cnI7XG59XG5cbmZ1bmN0aW9uIG9iamVjdF9zZXRfcGF0aChvYmplY3QsIHBhdGgsIHZhbHVlKSB7XG5cdHZhciBjdXJyID0gb2JqZWN0LFxuXHRcdGssXG5cdFx0c2VnO1xuXHRwYXRoID0gdG9fbGlzdChwYXRoLCBbXSwgXCIuXCIpO1xuXHRmb3IgKGsgPSAwOyBrIDwgcGF0aC5sZW5ndGg7IGsrKykge1xuXHRcdHNlZyA9IHBhdGhba107XG5cdFx0aWYgKHR5cGVvZiBjdXJyW3NlZ10gPT09IFwib2JqZWN0XCIpIHtcblx0XHRcdGN1cnIgPSBjdXJyW3NlZ107XG5cdFx0fSBlbHNlIGlmIChrID09PSBwYXRoLmxlbmd0aCAtIDEpIHtcblx0XHRcdGN1cnJbc2VnXSA9IHZhbHVlO1xuXHRcdFx0YnJlYWs7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGN1cnJbc2VnXSA9IHt9O1xuXHRcdFx0Y3VyciA9IGN1cnJbc2VnXTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIG9iamVjdDtcbn1cblxuWmVzay5vYmplY3RfcGF0aCA9IG9iamVjdF9wYXRoO1xuWmVzay5vYmplY3Rfc2V0X3BhdGggPSBvYmplY3Rfc2V0X3BhdGg7XG5cbmZ1bmN0aW9uIGhvb2tfcGF0aChob29rKSB7XG5cdGhvb2sgPSBTdHJpbmcoaG9vaykudG9Mb3dlckNhc2UoKTtcblx0aG9vayA9IHRvX2xpc3QoaG9vaywgW10sIFwiOjpcIik7XG5cdGlmIChob29rLmxlbmd0aCA9PT0gMSkge1xuXHRcdGhvb2sucHVzaChcIipcIik7XG5cdH1cblx0cmV0dXJuIGhvb2s7XG59XG5cbk9iamVjdC5hc3NpZ24oWmVzaywge1xuXHRkOiBkLFxuXHRzZXR0aW5nczoge30sIC8vIFBsYWNlIG1vZHVsZSBkYXRhIGhlcmUhXG5cdGhvb2tzOiBob29rcywgLy8gTW9kdWxlIGhvb2tzIGdvIGhlcmUgLSB1c2UgYWRkX2hvb2sgYW5kIGhvb2sgdG8gdXNlXG5cdHc6IFcsXG5cdHVybF9wYXJ0czoge1xuXHRcdHBhdGg6IEwucGF0aG5hbWUsXG5cdFx0aG9zdDogTC5ob3N0LFxuXHRcdHF1ZXJ5OiBMLnNlYXJjaCxcblx0XHRzY2hlbWU6IEwucHJvdG9jb2wsXG5cdFx0dXJsOiBkLlVSTCxcblx0XHR1cmk6IEwucGF0aG5hbWUgKyBMLnNlYXJjaCxcblx0fSxcblx0cGFnZV9zY3JpcHRzOiBudWxsLFxuXHRxdWVyeV9nZXQ6IGZ1bmN0aW9uKHYsIGRlZikge1xuXHRcdGRlZiA9IGRlZiB8fCBudWxsO1xuXHRcdHZhciBwYWlyLFxuXHRcdFx0aSxcblx0XHRcdHUgPSBkLlVSTC50b1N0cmluZygpLnJpZ2h0KFwiP1wiLCBudWxsKTtcblx0XHRpZiAoIXUpIHtcblx0XHRcdHJldHVybiBkZWY7XG5cdFx0fVxuXHRcdHUgPSB1LnNwbGl0KFwiJlwiKTtcblx0XHRmb3IgKGkgPSAwOyBpIDwgdS5sZW5ndGg7IGkrKykge1xuXHRcdFx0cGFpciA9IHVbaV0uc3BsaXQoXCI9XCIsIDIpO1xuXHRcdFx0aWYgKHBhaXJbMF0gPT09IHYpIHtcblx0XHRcdFx0cmV0dXJuIHBhaXJbMV0gfHwgcGFpclswXTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGRlZjtcblx0fSxcblx0LyoqXG4gICAgICogQHBhcmFtIG5hbWUgc3RyaW5nIE5hbWUgb2YgY29va2llIHRvIHNldC9nZXRcbiAgICAgKiBAcGFyYW0gdmFsdWUgc3RyaW5nIFZhbHVlIG9mIGNvb2tpZSB0byBzZXRcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBvYmplY3QgRXh0cmEgb3B0aW9uczogdHRsOiBpbnRlZ2VyIChzZWNvbmRzKSwgZG9tYWluOiBzdHJpbmdcbiAgICAgKi9cblx0Y29va2llOiBmdW5jdGlvbihuYW1lLCB2YWx1ZSwgb3B0aW9ucykge1xuXHRcdHZhciBnZXRjb29raWUgPSBmdW5jdGlvbihuKSB7XG5cdFx0XHRcdHZhciBjID0gZC5jb29raWU7XG5cdFx0XHRcdHZhciBzID0gYy5sYXN0SW5kZXhPZihuICsgXCI9XCIpO1xuXHRcdFx0XHRpZiAocyA8IDApIHtcblx0XHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdFx0fVxuXHRcdFx0XHRzICs9IG4ubGVuZ3RoICsgMTtcblx0XHRcdFx0dmFyIGUgPSBjLmluZGV4T2YoXCI7XCIsIHMpO1xuXHRcdFx0XHRpZiAoZSA8IDApIHtcblx0XHRcdFx0XHRlID0gYy5sZW5ndGg7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIFcudW5lc2NhcGUoYy5zdWJzdHJpbmcocywgZSkpO1xuXHRcdFx0fSxcblx0XHRcdHNldGNvb2tpZSA9IGZ1bmN0aW9uKG4sIHYsIG9wdGlvbnMpIHtcblx0XHRcdFx0dmFyIGEgPSBuZXcgRGF0ZSgpLFxuXHRcdFx0XHRcdHQgPSBwYXJzZUludChvcHRpb25zLnR0bCwgMTApIHx8IC0xLFxuXHRcdFx0XHRcdG0gPSBvcHRpb25zLmRvbWFpbiB8fCBudWxsO1xuXHRcdFx0XHRpZiAodCA8PSAwKSB7XG5cdFx0XHRcdFx0YS5zZXRGdWxsWWVhcigyMDMwKTtcblx0XHRcdFx0fSBlbHNlIGlmICh0ID4gMCkge1xuXHRcdFx0XHRcdGEuc2V0VGltZShhLmdldFRpbWUoKSArIHQgKiAxMDAwKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRkLmNvb2tpZSA9IG4gKyBcIj1cIiArIFcuZXNjYXBlKHYpICsgXCI7IHBhdGg9LzsgZXhwaXJlcz1cIiArIGEudG9HTVRTdHJpbmcoKSArIChtID8gXCI7IGRvbWFpbj1cIiArIG0gOiBcIlwiKTtcblx0XHRcdFx0cmV0dXJuIHY7XG5cdFx0XHR9LFxuXHRcdFx0ZGVsZXRlX2Nvb2tpZSA9IGZ1bmN0aW9uKG5hbWUsIGRvbSkge1xuXHRcdFx0XHR2YXIgbm93ID0gbmV3IERhdGUoKSxcblx0XHRcdFx0XHRlID0gbmV3IERhdGUobm93LmdldFRpbWUoKSAtIDg2NDAwKTtcblx0XHRcdFx0ZC5jb29raWUgPSBuYW1lICsgXCI9OyBwYXRoPS87IGV4cGlyZXM9XCIgKyBlLnRvR01UU3RyaW5nKCkgKyAoZG9tID8gXCI7IGRvbWFpbj1cIiArIGRvbSA6IFwiXCIpO1xuXHRcdFx0fTtcblx0XHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblx0XHRpZiAodmFsdWUgPT09IG51bGwpIHtcblx0XHRcdGRlbGV0ZV9jb29raWUobmFtZSwgb3B0aW9ucy5kb20gfHwgbnVsbCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHJldHVybiBhcmd1bWVudHMubGVuZ3RoID09PSAxID8gZ2V0Y29va2llKG5hbWUpIDogc2V0Y29va2llKG5hbWUsIHZhbHVlLCBvcHRpb25zKTtcblx0fSxcblx0Y3NzOiBmdW5jdGlvbihwKSB7XG5cdFx0dmFyIGNzcyA9IGQuY3JlYXRlRWxlbWVudChcImxpbmtcIik7XG5cdFx0Y3NzLnJlbCA9IFwic3R5bGVzaGVldFwiO1xuXHRcdGNzcy5ocmVmID0gcDtcblx0XHRjc3MubWVkaWEgPSBhcmd1bWVudHNbMV0gfHwgXCJhbGxcIjtcblx0XHRkLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaGVhZFwiKVswXS5hcHBlbmRDaGlsZChjc3MpO1xuXHR9LFxuXHRsb2c6IGZ1bmN0aW9uKCkge1xuXHRcdGlmIChXLmNvbnNvbGUgJiYgVy5jb25zb2xlLmxvZykge1xuXHRcdFx0Vy5jb25zb2xlLmxvZyhhcmd1bWVudHMpO1xuXHRcdH1cblx0fSxcblx0YWRkX2hvb2s6IGZ1bmN0aW9uKGhvb2ssIGZ1bikge1xuXHRcdHZhciBwYXRoID0gaG9va19wYXRoKGhvb2spLFxuXHRcdFx0Y3VyciA9IG9iamVjdF9wYXRoKGhvb2tzLCBwYXRoKTtcblx0XHRpZiAoY3Vycikge1xuXHRcdFx0Y3Vyci5wdXNoKGZ1bik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGN1cnIgPSBbZnVuXTtcblx0XHRcdG9iamVjdF9zZXRfcGF0aChob29rcywgcGF0aCwgY3Vycik7XG5cdFx0fVxuXHR9LFxuXHRoYXNfaG9vazogZnVuY3Rpb24oaG9vaykge1xuXHRcdHZhciBmdW5jcyA9IG9iamVjdF9wYXRoKGhvb2tzLCBob29rX3BhdGgoaG9vayksIG51bGwpO1xuXHRcdHJldHVybiBmdW5jcyA/IHRydWUgOiBmYWxzZTtcblx0fSxcblx0aG9vazogZnVuY3Rpb24oaG9vaykge1xuXHRcdHZhciBwYXRoID0gaG9va19wYXRoKGhvb2spLFxuXHRcdFx0YXJncyA9IFplc2suY2xvbmUoYXJndW1lbnRzKSxcblx0XHRcdGZ1bmNzID0gb2JqZWN0X3BhdGgoaG9va3MsIHBhdGgsIG51bGwpLFxuXHRcdFx0cmVzdWx0cyA9IFtdLFxuXHRcdFx0aTtcblx0XHRpZiAoIWZ1bmNzKSB7XG5cdFx0XHRyZXR1cm4gcmVzdWx0cztcblx0XHR9XG5cdFx0aWYgKGFyZ3MubGVuZ3RoID4gMSkge1xuXHRcdFx0YXJncy5zaGlmdCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRhcmdzID0gW107XG5cdFx0fVxuXG5cdFx0Zm9yIChpID0gMDsgaSA8IGZ1bmNzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRyZXN1bHRzLnB1c2goZnVuY3NbaV0uYXBwbHkobnVsbCwgYXJncykpO1xuXHRcdH1cblx0XHRyZXR1cm4gcmVzdWx0cztcblx0fSxcblx0Z2V0X3BhdGg6IGZ1bmN0aW9uKHBhdGgsIGRlZikge1xuXHRcdHJldHVybiBvYmplY3RfcGF0aChaZXNrLnNldHRpbmdzLCBwYXRoLCBkZWYpO1xuXHR9LFxuXHRzZXRfcGF0aDogZnVuY3Rpb24ocGF0aCwgdmFsdWUpIHtcblx0XHRyZXR1cm4gb2JqZWN0X3NldF9wYXRoKFplc2suc2V0dGluZ3MsIHBhdGgsIHZhbHVlKTtcblx0fSxcblx0Z2V0OiBmdW5jdGlvbihuKSB7XG5cdFx0dmFyIGEgPSBhcmd1bWVudHM7XG5cdFx0cmV0dXJuIGF2YWx1ZShaZXNrLnNldHRpbmdzLCBuLCBhLmxlbmd0aCA+IDEgPyBhWzFdIDogbnVsbCk7XG5cdH0sXG5cdGdldGI6IGZ1bmN0aW9uKG4pIHtcblx0XHR2YXIgYSA9IGFyZ3VtZW50cyxcblx0XHRcdGQgPSBhLmxlbmd0aCA+IDEgPyBhWzFdIDogZmFsc2U7XG5cdFx0cmV0dXJuIHRvX2Jvb2woWmVzay5nZXQobiwgZCkpO1xuXHR9LFxuXHRzZXQ6IGZ1bmN0aW9uKG4sIHYpIHtcblx0XHR2YXIgYSA9IGFyZ3VtZW50cyxcblx0XHRcdG92ZXJ3cml0ZSA9IGEubGVuZ3RoID4gMiA/IHRvX2Jvb2woYVsyXSkgOiB0cnVlO1xuXHRcdGlmICghb3ZlcndyaXRlICYmIHR5cGVvZiBaZXNrLnNldHRpbmdzW25dICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cdFx0XHRyZXR1cm4gWmVzay5zZXR0aW5nc1tuXTtcblx0XHR9XG5cdFx0WmVzay5zZXR0aW5nc1tuXSA9IHY7XG5cdFx0cmV0dXJuIHY7XG5cdH0sXG5cdGluaGVyaXQ6IGZ1bmN0aW9uKHRoZV9jbGFzcywgc3VwZXJfY2xhc3MsIHByb3RvdHlwZSkge1xuXHRcdC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTExNDAyNC9jb25zdHJ1Y3RvcnMtaW4tamF2YXNjcmlwdC1vYmplY3RzXG5cdFx0dmFyIG1ldGhvZCxcblx0XHRcdENvbnN0cnVjdCA9IGZ1bmN0aW9uKCkge307XG5cdFx0c3VwZXJfY2xhc3MgPSBzdXBlcl9jbGFzcyB8fCBPYmplY3Q7XG5cdFx0Q29uc3RydWN0LnByb3RvdHlwZSA9IHN1cGVyX2NsYXNzLnByb3RvdHlwZTtcblx0XHR0aGVfY2xhc3MucHJvdG90eXBlID0gbmV3IENvbnN0cnVjdCgpO1xuXHRcdHRoZV9jbGFzcy5wcm90b3R5cGUuY29uc3RydWN0b3IgPSB0aGVfY2xhc3M7XG5cdFx0dGhlX2NsYXNzW1wic3VwZXJcIl0gPSBzdXBlcl9jbGFzcztcblx0XHRpZiAocHJvdG90eXBlIGluc3RhbmNlb2YgT2JqZWN0KSB7XG5cdFx0XHRmb3IgKG1ldGhvZCBpbiBwcm90b3R5cGUpIHtcblx0XHRcdFx0aWYgKHByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eShtZXRob2QpKSB7XG5cdFx0XHRcdFx0aWYgKCF0aGVfY2xhc3MucHJvdG90eXBlW21ldGhvZF0pIHtcblx0XHRcdFx0XHRcdHRoZV9jbGFzcy5wcm90b3R5cGVbbWV0aG9kXSA9IHByb3RvdHlwZVttZXRob2RdO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHR0aGVfY2xhc3MucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gWmVzay5jbG9uZSh0aGlzKTtcblx0XHR9O1xuXHRcdHJldHVybiB0aGVfY2xhc3M7XG5cdH0sXG5cdC8qKlxuXHQgKiBJdGVyYXRlIG92ZXIgYW4gb2JqZWN0LCBjYWxsaW5nIGEgZnVuY3Rpb24gb25jZSBwZXIgZWxlbWVudFxuXHQgKiBcblx0ICogQHBhcmFtIG9iamVjdHxhcnJheVxuXHQgKiAgICAgICAgICAgIHhcblx0ICogQHBhcmFtIGZ1bmN0aW9uXG5cdCAqICAgICAgICAgICAgZm5cblx0ICogQHBhcmFtIGJvb2xlYW5cblx0ICogICAgICAgICAgICB0ZXJtX2ZhbHNlIFNldCB0byB0cnVlIHRvIHRlcm1pbmF0ZSB3aGVuIGZ1bmN0aW9uIHJldHVybnNcblx0ICogICAgICAgICAgICBhIGZhbHNlLWlzaCB2YWx1ZSBhcyBvcHBvc2VkIHRvIGEgdHJ1ZS1pc2ggdmFsdWVcblx0ICovXG5cdGVhY2g6IGZ1bmN0aW9uKHgsIGZuLCB0ZXJtX2ZhbHNlKSB7XG5cdFx0dmFyIGksIHI7XG5cdFx0dGVybV9mYWxzZSA9IHRvX2Jvb2wodGVybV9mYWxzZSk7XG5cdFx0aWYgKGlzX2FycmF5KHgpKSB7XG5cdFx0XHRmb3IgKGkgPSAwOyBpIDwgeC5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRyID0gZm4uY2FsbCh4W2ldLCBpLCB4W2ldKTtcblx0XHRcdFx0aWYgKHRlcm1fZmFsc2UpIHtcblx0XHRcdFx0XHRpZiAoIXIpIHtcblx0XHRcdFx0XHRcdHJldHVybiByO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIGlmIChyKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHI7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9IGVsc2UgaWYgKGlzX29iamVjdCh4KSkge1xuXHRcdFx0Zm9yIChpIGluIHgpIHtcblx0XHRcdFx0aWYgKHguaGFzT3duUHJvcGVydHkoaSkpIHtcblx0XHRcdFx0XHRyID0gZm4uY2FsbCh4W2ldLCBpLCB4W2ldKTtcblx0XHRcdFx0XHRpZiAodGVybV9mYWxzZSkge1xuXHRcdFx0XHRcdFx0aWYgKCFyKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiByO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0gZWxzZSBpZiAocikge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHI7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBmbi5jYWxsKHgsIDAsIHgpO1xuXHRcdH1cblx0fSxcblx0dHBsOiBmdW5jdGlvbihtaXhlZCwgbWFwKSB7XG5cdFx0cmV0dXJuICQobWl4ZWQpXG5cdFx0XHQuaHRtbCgpXG5cdFx0XHQubWFwKG1hcCwgZmFsc2UpO1xuXHR9LFxuXHRzY3JpcHRfc3JjX25vcm1hbGl6ZTogZnVuY3Rpb24oc3JjKSB7XG5cdFx0dmFyIG1hdGNoZXMsXG5cdFx0XHRwYXJ0cyA9IFplc2sudXJsX3BhcnRzO1xuXHRcdHNyYyA9IHNyYy51bnByZWZpeChwYXJ0cy5zY2hlbWUgKyBcIjovL1wiICsgcGFydHMuaG9zdCk7XG5cdFx0bWF0Y2hlcyA9IHNyYy5tYXRjaCgvKC4qKVxcP192ZXI9WzAtOV0rJC8pO1xuXHRcdGlmIChtYXRjaGVzICE9PSBudWxsKSB7XG5cdFx0XHRzcmMgPSBtYXRjaGVzWzFdO1xuXHRcdH1cblx0XHRyZXR1cm4gc3JjO1xuXHR9LFxuXHRzY3JpcHRzX2luaXQ6IGZ1bmN0aW9uKCkge1xuXHRcdFplc2sucGFnZV9zY3JpcHRzID0ge307XG5cdFx0JCgnc2NyaXB0W3R5cGU9XCJ0ZXh0L2phdmFzY3JpcHRcIl1bc3JjXScpLmVhY2goZnVuY3Rpb24oKSB7XG5cdFx0XHRaZXNrLnNjcmlwdF9hZGQoJCh0aGlzKS5hdHRyKFwic3JjXCIpKTtcblx0XHR9KTtcblx0fSxcblx0c2NyaXB0X2FkZDogZnVuY3Rpb24oc3JjKSB7XG5cdFx0aWYgKFplc2sucGFnZV9zY3JpcHRzID09PSBudWxsKSB7XG5cdFx0XHRaZXNrLnNjcmlwdHNfaW5pdCgpO1xuXHRcdH1cblx0XHRaZXNrLnBhZ2Vfc2NyaXB0c1tzcmNdID0gdHJ1ZTtcblx0XHRaZXNrLnBhZ2Vfc2NyaXB0c1taZXNrLnNjcmlwdF9zcmNfbm9ybWFsaXplKHNyYyldID0gdHJ1ZTtcblx0fSxcblx0c2NyaXB0czogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKFplc2sucGFnZV9zY3JpcHRzID09PSBudWxsKSB7XG5cdFx0XHRaZXNrLnNjcmlwdHNfaW5pdCgpO1xuXHRcdH1cblx0XHRyZXR1cm4gWmVzay5wYWdlX3NjcmlwdHM7XG5cdH0sXG5cdHNjcmlwdHNfY2FjaGVkOiBmdW5jdGlvbihzcmNzKSB7XG5cdFx0WmVzay5lYWNoKHNyY3MsIGZ1bmN0aW9uKCkge1xuXHRcdFx0WmVzay5zY3JpcHRfYWRkKHRoaXMpO1xuXHRcdH0pO1xuXHR9LFxuXHRzY3JpcHRfbG9hZGVkOiBmdW5jdGlvbihzcmMpIHtcblx0XHR2YXIgc2NyaXB0cyA9IFplc2suc2NyaXB0cygpLFxuXHRcdFx0cmVzdWx0ID0gc2NyaXB0c1tzcmNdIHx8IHNjcmlwdHNbWmVzay5zY3JpcHRfc3JjX25vcm1hbGl6ZShzcmMpXSB8fCBmYWxzZTtcblx0XHQvLyBaZXNrLmxvZyhcIlplc2suc2NyaXB0X2xvYWRlZChcIiArIHNyYyArIFwiKSA9IFwiICsgKHJlc3VsdCA/IFwidHJ1ZVwiOlxuXHRcdC8vIFwiZmFsc2VcIikpO1xuXHRcdHJldHVybiByZXN1bHQ7XG5cdH0sXG5cdHN0eWxlc2hlZXRfbG9hZGVkOiBmdW5jdGlvbihocmVmLCBtZWRpYSkge1xuXHRcdHJldHVybiAkKCdsaW5rW3JlbD1cInN0eWxlc2hlZXRcIl1baHJlZj1cIicgKyBocmVmICsgJ1wiXVttZWRpYT1cIicgKyBtZWRpYSArICdcIicpLmxlbmd0aCA+IDA7XG5cdH0sXG5cdG1lc3NhZ2U6IGZ1bmN0aW9uKG1lc3NhZ2UsIG9wdGlvbnMpIHtcblx0XHRpZiAoaXNfc3RyaW5nKG9wdGlvbnMpKSB7XG5cdFx0XHRvcHRpb25zID0geyBsZXZlbDogb3B0aW9ucyB9O1xuXHRcdH1cblx0XHRaZXNrLmhvb2soXCJtZXNzYWdlXCIsIG1lc3NhZ2UsIG9wdGlvbnMpO1xuXHRcdFplc2subG9nKG1lc3NhZ2UsIG9wdGlvbnMpO1xuXHR9LFxuXHRyZWdleHBfcXVvdGU6IGZ1bmN0aW9uKHN0ciwgZGVsaW1pdGVyKSB7XG5cdFx0cmV0dXJuIFN0cmluZyhzdHIpLnJlcGxhY2UoXG5cdFx0XHRuZXcgUmVnRXhwKFwiWy5cXFxcXFxcXCsqP1xcXFxbXFxcXF5cXFxcXSQoKXt9PSE8Pnw6XFxcXFwiICsgKGRlbGltaXRlciB8fCBcIlwiKSArIFwiLV1cIiwgXCJnXCIpLFxuXHRcdFx0XCJcXFxcJCZcIlxuXHRcdCk7XG5cdH0sXG59KTtcblxuWmVzay5jbG9uZSA9IGZ1bmN0aW9uKG9iamVjdCkge1xuXHR2YXIgY2xvbmUsIHByb3AsIENvbnN0cnVjdG9yO1xuXHRpZiAob2JqZWN0ID09PSBudWxsKSB7XG5cdFx0cmV0dXJuIG9iamVjdDtcblx0fVxuXHRpZiAoaXNfZnVuY3Rpb24ob2JqZWN0KSkge1xuXHRcdHJldHVybiBvYmplY3Q7XG5cdH1cblx0aWYgKGlzX2FycmF5KG9iamVjdCkgfHwgWmVzay5nZXR0eXBlKG9iamVjdCkgPT09IFwiYXJndW1lbnRzXCIpIHtcblx0XHRjbG9uZSA9IFtdO1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgb2JqZWN0Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRjbG9uZS5wdXNoKFplc2suY2xvbmUob2JqZWN0W2ldKSk7XG5cdFx0fVxuXHRcdHJldHVybiBjbG9uZTtcblx0fVxuXHRpZiAoIWlzX29iamVjdChvYmplY3QpKSB7XG5cdFx0cmV0dXJuIG9iamVjdDtcblx0fVxuXHRDb25zdHJ1Y3RvciA9IG9iamVjdC5jb25zdHJ1Y3Rvcjtcblx0c3dpdGNoIChDb25zdHJ1Y3Rvcikge1xuXHRcdGNhc2UgUmVnRXhwOlxuXHRcdFx0Y2xvbmUgPSBuZXcgQ29uc3RydWN0b3IoXG5cdFx0XHRcdG9iamVjdC5zb3VyY2UsXG5cdFx0XHRcdFwiZ1wiLnN1YnN0cigwLCBOdW1iZXIob2JqZWN0Lmdsb2JhbCkpICtcblx0XHRcdFx0XHRcImlcIi5zdWJzdHIoMCwgTnVtYmVyKG9iamVjdC5pZ25vcmVDYXNlKSkgK1xuXHRcdFx0XHRcdFwibVwiLnN1YnN0cigwLCBOdW1iZXIob2JqZWN0Lm11bHRpbGluZSkpXG5cdFx0XHQpO1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSBEYXRlOlxuXHRcdFx0Y2xvbmUgPSBuZXcgQ29uc3RydWN0b3Iob2JqZWN0LmdldFRpbWUoKSk7XG5cdFx0XHRicmVhaztcblx0XHRkZWZhdWx0OlxuXHRcdFx0Ly8gQ2FuIG5vdCBjb3B5IHVua25vd24gb2JqZWN0c1xuXHRcdFx0cmV0dXJuIG9iamVjdDtcblx0fVxuXHRmb3IgKHByb3AgaW4gb2JqZWN0KSB7XG5cdFx0aWYgKG9iamVjdC5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuXHRcdFx0Y2xvbmVbcHJvcF0gPSBaZXNrLmNsb25lKG9iamVjdFtwcm9wXSk7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBjbG9uZTtcbn07XG5cbk9iamVjdC5hc3NpZ24oQXJyYXkucHJvdG90eXBlLCB7XG5cdGNvbnRhaW5zOiBmdW5jdGlvbih4KSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZiAodGhpc1tpXSA9PT0geCkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9LFxuXHRyZW1vdmU6IGZ1bmN0aW9uKHgpIHtcblx0XHR2YXIgdGVtcCA9IHRoaXMuc2xpY2UoMCk7XG5cdFx0dGVtcC5zcGxpY2UoeCwgMSk7XG5cdFx0cmV0dXJuIHRlbXA7XG5cdH0sXG5cdC8qKlxuXHQgKiBKb2luIGVsZW1lbnRzIG9mIGFuIGFycmF5IGJ5IHdyYXBwaW5nIGVhY2ggb25lIHdpdGggYSBwcmVmaXgvc3VmZml4XG5cdCAqIFxuXHQgKiBAcGFyYW0gc3RyaW5nXG5cdCAqICAgICAgICAgICAgcHJlZml4XG5cdCAqIEBwYXJhbSBzdHJpbmdcblx0ICogICAgICAgICAgICBzdWZmaXhcblx0ICogQHJldHVybiBzdHJpbmdcblx0ICovXG5cdGpvaW5fd3JhcDogZnVuY3Rpb24ocHJlZml4LCBzdWZmaXgpIHtcblx0XHRwcmVmaXggPSBTdHJpbmcocHJlZml4KSB8fCBcIlwiO1xuXHRcdHN1ZmZpeCA9IFN0cmluZyhzdWZmaXgpIHx8IFwiXCI7XG5cdFx0cmV0dXJuIHByZWZpeCArIHRoaXMuam9pbihzdWZmaXggKyBwcmVmaXgpICsgc3VmZml4O1xuXHR9LFxufSk7XG5cbk9iamVjdC5hc3NpZ24oT2JqZWN0LCB7XG5cdGZyb21DYW1lbENhc2U6IGZ1bmN0aW9uKGZyb20pIHtcblx0XHR2YXIgdG8gPSB7fTtcblx0XHRmb3IgKHZhciBpIGluIGZyb20pIHtcblx0XHRcdGlmIChmcm9tLmhhc093blByb3BlcnR5KGkpKSB7XG5cdFx0XHRcdHRvW2kuZnJvbUNhbWVsQ2FzZSgpXSA9IGZyb21baV07XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiB0bztcblx0fSxcblx0dG9DYW1lbENhc2U6IGZ1bmN0aW9uKGZyb20pIHtcblx0XHR2YXIgdG8gPSB7fTtcblx0XHRmb3IgKHZhciBpIGluIHRoaXMpIHtcblx0XHRcdGlmIChmcm9tLmhhc093blByb3BlcnR5KGkpKSB7XG5cdFx0XHRcdHRvW2kudG9DYW1lbENhc2UoKV0gPSBmcm9tW2ldO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gdG87XG5cdH0sXG59KTtcblxuT2JqZWN0LmFzc2lnbihTdHJpbmcucHJvdG90eXBlLCB7XG5cdGNvbXBhcmU6IGZ1bmN0aW9uKGEpIHtcblx0XHRyZXR1cm4gdGhpcyA8IGEgPyAtMSA6IHRoaXMgPT09IGEgPyAwIDogMTtcblx0fSxcblx0bGVmdDogZnVuY3Rpb24oZGVsaW0sIGRlZikge1xuXHRcdHZhciBwb3MgPSB0aGlzLmluZGV4T2YoZGVsaW0pO1xuXHRcdHJldHVybiBwb3MgPCAwID8gYXZhbHVlKGFyZ3VtZW50cywgMSwgZGVmIHx8IHRoaXMpIDogdGhpcy5zdWJzdHIoMCwgcG9zKTtcblx0fSxcblx0cmxlZnQ6IGZ1bmN0aW9uKGRlbGltLCBkZWYpIHtcblx0XHR2YXIgcG9zID0gdGhpcy5sYXN0SW5kZXhPZihkZWxpbSk7XG5cdFx0cmV0dXJuIHBvcyA8IDAgPyBhdmFsdWUoYXJndW1lbnRzLCAxLCBkZWYgfHwgdGhpcykgOiB0aGlzLnN1YnN0cigwLCBwb3MpO1xuXHR9LFxuXHRyaWdodDogZnVuY3Rpb24oZGVsaW0sIGRlZikge1xuXHRcdHZhciBwb3MgPSB0aGlzLmluZGV4T2YoZGVsaW0pO1xuXHRcdHJldHVybiBwb3MgPCAwID8gYXZhbHVlKGFyZ3VtZW50cywgMSwgZGVmIHx8IHRoaXMpIDogdGhpcy5zdWJzdHIocG9zICsgZGVsaW0ubGVuZ3RoKTtcblx0fSxcblx0cnJpZ2h0OiBmdW5jdGlvbihkZWxpbSwgZGVmKSB7XG5cdFx0dmFyIHBvcyA9IHRoaXMubGFzdEluZGV4T2YoZGVsaW0pO1xuXHRcdHJldHVybiBwb3MgPCAwID8gYXZhbHVlKGFyZ3VtZW50cywgMSwgZGVmIHx8IHRoaXMpIDogdGhpcy5zdWJzdHIocG9zICsgZGVsaW0ubGVuZ3RoKTtcblx0fSxcblx0bHRyaW06IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLnJlcGxhY2UoL15cXHMrLywgXCJcIik7XG5cdH0sXG5cdHJ0cmltOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5yZXBsYWNlKC9cXHMrJC8sIFwiXCIpO1xuXHR9LFxuXHR0cmltOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5yZXBsYWNlKC9eXFxzKy8sIFwiXCIpLnJlcGxhY2UoL1xccyskLywgXCJcIik7XG5cdH0sXG5cdC8qKlxuXHQgKiBAZGVwcmVjYXRlZFxuXHQgKiBAcGFyYW0geFxuXHQgKiAgICAgICAgICAgIFN0cmluZyB0byBsb29rIGF0XG5cdCAqL1xuXHRlbmRzX3dpdGg6IGZ1bmN0aW9uKHgpIHtcblx0XHRyZXR1cm4gdGhpcy5lbmRzKHgpO1xuXHR9LFxuXHRlbmRzOiBmdW5jdGlvbih4KSB7XG5cdFx0dmFyIHhuID0geC5sZW5ndGgsXG5cdFx0XHRuID0gdGhpcy5sZW5ndGg7XG5cdFx0aWYgKHhuID4gbikge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5zdWJzdHJpbmcobiAtIHhuLCBuKSA9PT0geDtcblx0fSxcblx0YmVnaW5zaTogZnVuY3Rpb24oc3RyaW5nKSB7XG5cdFx0dmFyIGxlbiA9IHN0cmluZy5sZW5ndGg7XG5cdFx0aWYgKGxlbiA+IHRoaXMubGVuZ3RoKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLnN1YnN0cigwLCBsZW4pLnRvTG93ZXJDYXNlKCkgPT09IHN0cmluZy50b0xvd2VyQ2FzZSgpO1xuXHR9LFxuXHRiZWdpbnM6IGZ1bmN0aW9uKHN0cmluZykge1xuXHRcdHZhciBsZW4gPSBzdHJpbmcubGVuZ3RoO1xuXHRcdGlmIChsZW4gPiB0aGlzLmxlbmd0aCkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5zdWJzdHIoMCwgbGVuKSA9PT0gc3RyaW5nO1xuXHR9LFxuXHRzdHJfcmVwbGFjZTogZnVuY3Rpb24ocywgcikge1xuXHRcdHZhciBzdHIgPSB0aGlzO1xuXHRcdHZhciBpO1xuXHRcdGlmIChpc19zdHJpbmcocykpIHtcblx0XHRcdGlmIChpc19zdHJpbmcocikpIHtcblx0XHRcdFx0cmV0dXJuIHRoaXMuc3BsaXQocykuam9pbihyKTtcblx0XHRcdH1cblx0XHRcdGZvciAoaSA9IDA7IGkgPCByLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdHN0ciA9IHN0ci5zdHJfcmVwbGFjZShzLCByW2ldKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBzdHI7XG5cdFx0fVxuXHRcdGlmIChpc19zdHJpbmcocikpIHtcblx0XHRcdGZvciAoaSA9IDA7IGkgPCBzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdHN0ciA9IHN0ci5zdHJfcmVwbGFjZShzW2ldLCByKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBzdHI7XG5cdFx0fVxuXHRcdHZhciBuID0gTWF0aC5taW4ocy5sZW5ndGgsIHIubGVuZ3RoKTtcblx0XHRmb3IgKGkgPSAwOyBpIDwgbjsgaSsrKSB7XG5cdFx0XHRzdHIgPSBzdHIuc3RyX3JlcGxhY2Uoc1tpXSwgcltpXSk7XG5cdFx0fVxuXHRcdHJldHVybiBzdHI7XG5cdH0sXG5cdHRyOiBmdW5jdGlvbihvYmplY3QpIHtcblx0XHR2YXIgayxcblx0XHRcdHNlbGYgPSB0aGlzO1xuXHRcdGZvciAoayBpbiBvYmplY3QpIHtcblx0XHRcdGlmIChvYmplY3QuaGFzT3duUHJvcGVydHkoaykpIHtcblx0XHRcdFx0c2VsZiA9IHNlbGYuc3RyX3JlcGxhY2Uoaywgb2JqZWN0W2tdKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIHNlbGY7XG5cdH0sXG5cdG1hcDogZnVuY3Rpb24ob2JqZWN0LCBjYXNlX2luc2Vuc2l0aXZlKSB7XG5cdFx0dmFyIGssXG5cdFx0XHRzdWZmaXggPSBcIlwiLFxuXHRcdFx0c2VsZjtcblx0XHRjYXNlX2luc2Vuc2l0aXZlID0gISFjYXNlX2luc2Vuc2l0aXZlOyAvLyBDb252ZXJ0IHRvIGJvb2xcblx0XHRpZiAoIWlzX29iamVjdChvYmplY3QpKSB7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cdFx0c2VsZiA9IHRoaXM7XG5cdFx0aWYgKGNhc2VfaW5zZW5zaXRpdmUpIHtcblx0XHRcdG9iamVjdCA9IFplc2suY2hhbmdlX2tleV9jYXNlKG9iamVjdCk7XG5cdFx0XHRzdWZmaXggPSBcImlcIjtcblx0XHR9XG5cdFx0Zm9yIChrIGluIG9iamVjdCkge1xuXHRcdFx0aWYgKG9iamVjdC5oYXNPd25Qcm9wZXJ0eShrKSkge1xuXHRcdFx0XHR2YXIgdmFsdWUgPSBvYmplY3Rba10sXG5cdFx0XHRcdFx0cmVwbGFjZSA9IHZhbHVlID09PSBudWxsID8gXCJcIiA6IFN0cmluZyhvYmplY3Rba10pO1xuXHRcdFx0XHRzZWxmID0gc2VsZi5yZXBsYWNlKG5ldyBSZWdFeHAoXCJcXFxce1wiICsgayArIFwiXFxcXH1cIiwgXCJnXCIgKyBzdWZmaXgpLCByZXBsYWNlKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIHNlbGY7XG5cdH0sXG5cdHRvX2FycmF5OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgaSxcblx0XHRcdHIgPSBbXTtcblx0XHRmb3IgKGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0ci5wdXNoKHRoaXMuY2hhckF0KGkpKTtcblx0XHR9XG5cdFx0cmV0dXJuIHI7XG5cdH0sXG5cdHVucXVvdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBuID0gdGhpcy5sZW5ndGg7XG5cdFx0dmFyIHEgPSBhcmd1bWVudHNbMF0gfHwgXCJcXFwiXFxcIicnXCI7XG5cdFx0dmFyIHAgPSBxLmluZGV4T2YodGhpcy5zdWJzdHJpbmcoMCwgMSkpO1xuXHRcdGlmIChwIDwgMCkge1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXHRcdGlmICh0aGlzLnN1YnN0cmluZyhuIC0gMSwgbikgPT09IHEuY2hhckF0KHAgKyAxKSkge1xuXHRcdFx0cmV0dXJuIHRoaXMuc3Vic3RyaW5nKDEsIG4gLSAxKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cdHRvQ2FtZWxDYXNlOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgcmVzdWx0ID0gXCJcIjtcblx0XHRaZXNrLmVhY2godGhpcy5zcGxpdChcIl9cIiksIGZ1bmN0aW9uKCkge1xuXHRcdFx0cmVzdWx0ICs9IHRoaXMuc3Vic3RyKDAsIDEpLnRvVXBwZXJDYXNlKCkgKyB0aGlzLnN1YnN0cigxKS50b0xvd2VyQ2FzZSgpO1xuXHRcdH0pO1xuXHRcdHJldHVybiByZXN1bHQ7XG5cdH0sXG5cdGZyb21DYW1lbENhc2U6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLnJlcGxhY2UoL1tBLVpdL2csIGZ1bmN0aW9uKHYpIHtcblx0XHRcdHJldHVybiBcIl9cIiArIHYudG9Mb3dlckNhc2UoKTtcblx0XHR9KTtcblx0fSxcblx0dW5wcmVmaXg6IGZ1bmN0aW9uKHN0cmluZywgZGVmKSB7XG5cdFx0aWYgKHRoaXMuYmVnaW5zKHN0cmluZykpIHtcblx0XHRcdHJldHVybiB0aGlzLnN1YnN0cihzdHJpbmcubGVuZ3RoKTtcblx0XHR9XG5cdFx0cmV0dXJuIGRlZiB8fCB0aGlzO1xuXHR9LFxufSk7XG5PYmplY3QuYXNzaWduKFN0cmluZy5wcm90b3R5cGUsIHtcblx0ZW5kczogU3RyaW5nLnByb3RvdHlwZS5lbmRzX3dpdGgsXG59KTtcblxuWmVzay50b19pbnRlZ2VyID0gZnVuY3Rpb24oeCkge1xuXHR2YXIgZCA9IGFyZ3VtZW50cy5sZW5ndGggPiAxID8gYXJndW1lbnRzWzFdIDogbnVsbDtcblx0eCA9IHBhcnNlSW50KHgsIDEwKTtcblx0aWYgKHR5cGVvZiB4ID09PSBcIm51bWJlclwiKSB7XG5cdFx0cmV0dXJuIHg7XG5cdH1cblx0cmV0dXJuIGQ7XG59O1xuXG5aZXNrLnRvX2xpc3QgPSB0b19saXN0O1xuXG5aZXNrLnRvX2Zsb2F0ID0gZnVuY3Rpb24oeCkge1xuXHR2YXIgZCA9IGFyZ3VtZW50cy5sZW5ndGggPiAxID8gYXJndW1lbnRzWzFdIDogbnVsbDtcblx0eCA9IHBhcnNlRmxvYXQoeCk7XG5cdGlmICh0eXBlb2YgeCA9PT0gXCJudW1iZXJcIikge1xuXHRcdHJldHVybiB4O1xuXHR9XG5cdHJldHVybiBkO1xufTtcblxuWmVzay50b19zdHJpbmcgPSBmdW5jdGlvbih4KSB7XG5cdHJldHVybiB4LnRvU3RyaW5nKCk7XG59O1xuXG5aZXNrLnRvX2Jvb2wgPSB0b19ib29sO1xuXG5aZXNrLmVtcHR5ID0gZnVuY3Rpb24odikge1xuXHRyZXR1cm4gdHlwZW9mIHYgPT09IFwidW5kZWZpbmVkXCIgfHwgdiA9PT0gbnVsbCB8fCB2ID09PSBcIlwiO1xufTtcblxuWmVzay5aT2JqZWN0ID0gZnVuY3Rpb24ob3B0aW9ucykge1xuXHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblx0dGhpcy5vcHRpb25zID0gWmVzay5jaGFuZ2Vfa2V5X2Nhc2UoT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucykpO1xuXHQvLyB0aGlzLmNvbnN0cnVjdG9yLnN1cGVyLmNhbGwodGhpcyk7XG59O1xuWmVzay5pbmhlcml0KFplc2suWk9iamVjdCwgbnVsbCwge1xuXHRjbG9uZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIFplc2suY2xvbmUodGhpcyk7XG5cdH0sXG59KTtcblxuWmVzay5jaGFuZ2Vfa2V5X2Nhc2UgPSBmdW5jdGlvbihtZSkge1xuXHR2YXIgayxcblx0XHRuZXdvID0ge307XG5cdGZvciAoayBpbiBtZSkge1xuXHRcdGlmIChtZS5oYXNPd25Qcm9wZXJ0eShrKSkge1xuXHRcdFx0bmV3b1trLnRvTG93ZXJDYXNlKCldID0gbWVba107XG5cdFx0fVxuXHR9XG5cdHJldHVybiBuZXdvO1xufTtcblxuaWYgKHR5cGVvZiBNYXRoLnNpZ24gIT09IFwiZnVuY3Rpb25cIikge1xuXHRNYXRoLnNpZ24gPSBmdW5jdGlvbih4KSB7XG5cdFx0cmV0dXJuIHggPyAoeCA8IDAgPyAtMSA6IDEpIDogMDtcblx0fTtcbn1cblxuLy8gVE9ETyBXaGF0J3MgdGhpcyBmb3I/XG5aZXNrLmFqYXhfZm9ybSA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgJGZvcm0gPSAkKHRoaXMpLFxuXHRcdHRhcmdldCA9ICRmb3JtLmF0dHIoXCJ0YXJnZXRcIiksXG5cdFx0JHRhcmdldCA9ICQoXCIjXCIgKyB0YXJnZXQpO1xuXHRaZXNrLmxvZygkdGFyZ2V0Lmh0bWwoKSk7XG59O1xuXG4vKlxuICogQ29tcGF0aWJpbGl0eVxuICovXG4vLyBpZiAoIU9iamVjdC5wcm90b3R5cGUua2V5cykge1xuLy8gXHRPYmplY3QucHJvdG90eXBlLmtleXMgPSBmdW5jdGlvbihvYmopIHtcbi8vIFx0XHR2YXIga2V5cyA9IFtdLCBrO1xuLy8gXHRcdGZvciAoayBpbiBvYmopIHtcbi8vIFx0XHRcdGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrKSkge1xuLy8gXHRcdFx0XHRrZXlzLnB1c2goayk7XG4vLyBcdFx0XHR9XG4vLyBcdFx0fVxuLy8gXHRcdHJldHVybiBrZXlzO1xuLy8gXHR9O1xuLy8gfVxuXG4kLmZuLmVxdWFsaGVpZ2h0ID0gZnVuY3Rpb24oc2VsZWN0b3IpIHtcblx0JCh0aGlzKS5lYWNoKGZ1bmN0aW9uKCkge1xuXHRcdHZhciBoID0gbnVsbDtcblx0XHQkKHNlbGVjdG9yLCAkKHRoaXMpKS5lYWNoKGZ1bmN0aW9uKCkge1xuXHRcdFx0aCA9IE1hdGgubWF4KCQodGhpcykuaGVpZ2h0KCksIGgpO1xuXHRcdH0pO1xuXHRcdCQoc2VsZWN0b3IsICQodGhpcykpLmVhY2goZnVuY3Rpb24oKSB7XG5cdFx0XHQkKHRoaXMpLmhlaWdodChoICsgXCJweFwiKTtcblx0XHR9KTtcblx0fSk7XG59O1xuXG5aZXNrLmluaXRlZCA9IHRydWU7XG5cbiQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCkge1xuXHRaZXNrLmhvb2soXCJkb2N1bWVudDo6cmVhZHlcIik7XG59KTtcbiQod2luZG93KS5vbihcImxvYWRcIiwgZnVuY3Rpb24oKSB7XG5cdFplc2suaG9vayhcIndpbmRvdzo6bG9hZFwiKTtcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFplc2s7XG4iXX0=