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
  * @param {object|array} x
  * @param {function} fn with signature (key, value, collection) "this" is set to the value as well
  * @param {boolean} term_fales Set to true to terminate when function returns a false-ish value as opposed to a true-ish value
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9aZXNrLmpzIl0sIm5hbWVzIjpbIiQiLCJyZXF1aXJlIiwiWmVzayIsImhvb2tzIiwiVyIsImdsb2JhbCIsIndpbmRvdyIsImQiLCJkb2N1bWVudCIsIkwiLCJsb2NhdGlvbiIsImdldHR5cGUiLCJ4IiwiT2JqZWN0IiwicHJvdG90eXBlIiwidG9TdHJpbmciLCJjYWxsIiwic3BsaXQiLCJ0b0xvd2VyQ2FzZSIsImF2YWx1ZSIsIm9iaiIsImkiLCJkZWYiLCJ1bmRlZmluZWQiLCJpc19ib29sIiwiYSIsImlzX251bWVyaWMiLCJpc19zdHJpbmciLCJpc19hcnJheSIsImlzX29iamVjdCIsImlzX2ludGVnZXIiLCJwYXJzZUludCIsImlzX2Z1bmN0aW9uIiwiaXNfZmxvYXQiLCJpc191cmwiLCJleGVjIiwidHJpbSIsImZsaXAiLCJvYmplY3QiLCJyZXN1bHQiLCJoYXNPd25Qcm9wZXJ0eSIsIlN0cmluZyIsImlzX2RhdGUiLCJlYWNoIiwiaXNfbnVtYmVyIiwidG9fbGlzdCIsImRlbGltIiwidG9fYm9vbCIsImFyZ3VtZW50cyIsImxlbmd0aCIsImNvbnRhaW5zIiwib2JqZWN0X3BhdGgiLCJwYXRoIiwiY3VyciIsImsiLCJvYmplY3Rfc2V0X3BhdGgiLCJ2YWx1ZSIsInNlZyIsImhvb2tfcGF0aCIsImhvb2siLCJwdXNoIiwiYXNzaWduIiwic2V0dGluZ3MiLCJ3IiwidXJsX3BhcnRzIiwicGF0aG5hbWUiLCJob3N0IiwicXVlcnkiLCJzZWFyY2giLCJzY2hlbWUiLCJwcm90b2NvbCIsInVybCIsIlVSTCIsInVyaSIsInBhZ2Vfc2NyaXB0cyIsInF1ZXJ5X2dldCIsInYiLCJwYWlyIiwidSIsInJpZ2h0IiwiY29va2llIiwibmFtZSIsIm9wdGlvbnMiLCJnZXRjb29raWUiLCJuIiwiYyIsInMiLCJsYXN0SW5kZXhPZiIsImUiLCJpbmRleE9mIiwidW5lc2NhcGUiLCJzdWJzdHJpbmciLCJzZXRjb29raWUiLCJEYXRlIiwidCIsInR0bCIsIm0iLCJkb21haW4iLCJzZXRGdWxsWWVhciIsInNldFRpbWUiLCJnZXRUaW1lIiwiZXNjYXBlIiwidG9HTVRTdHJpbmciLCJkZWxldGVfY29va2llIiwiZG9tIiwibm93IiwiY3NzIiwicCIsImNyZWF0ZUVsZW1lbnQiLCJyZWwiLCJocmVmIiwibWVkaWEiLCJnZXRFbGVtZW50c0J5VGFnTmFtZSIsImFwcGVuZENoaWxkIiwibG9nIiwiY29uc29sZSIsImFkZF9ob29rIiwiZnVuIiwiaGFzX2hvb2siLCJmdW5jcyIsImFyZ3MiLCJjbG9uZSIsInJlc3VsdHMiLCJzaGlmdCIsImFwcGx5IiwiZ2V0X3BhdGgiLCJzZXRfcGF0aCIsImdldCIsImdldGIiLCJzZXQiLCJvdmVyd3JpdGUiLCJpbmhlcml0IiwidGhlX2NsYXNzIiwic3VwZXJfY2xhc3MiLCJtZXRob2QiLCJDb25zdHJ1Y3QiLCJjb25zdHJ1Y3RvciIsImZuIiwidGVybV9mYWxzZSIsInIiLCJ0cGwiLCJtaXhlZCIsIm1hcCIsImh0bWwiLCJzY3JpcHRfc3JjX25vcm1hbGl6ZSIsInNyYyIsIm1hdGNoZXMiLCJwYXJ0cyIsInVucHJlZml4IiwibWF0Y2giLCJzY3JpcHRzX2luaXQiLCJzY3JpcHRfYWRkIiwiYXR0ciIsInNjcmlwdHMiLCJzY3JpcHRzX2NhY2hlZCIsInNyY3MiLCJzY3JpcHRfbG9hZGVkIiwic3R5bGVzaGVldF9sb2FkZWQiLCJtZXNzYWdlIiwibGV2ZWwiLCJyZWdleHBfcXVvdGUiLCJzdHIiLCJkZWxpbWl0ZXIiLCJyZXBsYWNlIiwiUmVnRXhwIiwicHJvcCIsIkNvbnN0cnVjdG9yIiwic291cmNlIiwic3Vic3RyIiwiTnVtYmVyIiwiaWdub3JlQ2FzZSIsIm11bHRpbGluZSIsIkFycmF5IiwicmVtb3ZlIiwidGVtcCIsInNsaWNlIiwic3BsaWNlIiwiam9pbl93cmFwIiwicHJlZml4Iiwic3VmZml4Iiwiam9pbiIsImZyb21DYW1lbENhc2UiLCJmcm9tIiwidG8iLCJ0b0NhbWVsQ2FzZSIsImNvbXBhcmUiLCJsZWZ0IiwicG9zIiwicmxlZnQiLCJycmlnaHQiLCJsdHJpbSIsInJ0cmltIiwiZW5kc193aXRoIiwiZW5kcyIsInhuIiwiYmVnaW5zaSIsInN0cmluZyIsImxlbiIsImJlZ2lucyIsInN0cl9yZXBsYWNlIiwiTWF0aCIsIm1pbiIsInRyIiwic2VsZiIsImNhc2VfaW5zZW5zaXRpdmUiLCJjaGFuZ2Vfa2V5X2Nhc2UiLCJ0b19hcnJheSIsImNoYXJBdCIsInVucXVvdGUiLCJxIiwidG9VcHBlckNhc2UiLCJ0b19pbnRlZ2VyIiwidG9fZmxvYXQiLCJwYXJzZUZsb2F0IiwidG9fc3RyaW5nIiwiZW1wdHkiLCJaT2JqZWN0IiwibWUiLCJuZXdvIiwic2lnbiIsImFqYXhfZm9ybSIsIiRmb3JtIiwidGFyZ2V0IiwiJHRhcmdldCIsImVxdWFsaGVpZ2h0Iiwic2VsZWN0b3IiLCJoIiwibWF4IiwiaGVpZ2h0IiwiaW5pdGVkIiwicmVhZHkiLCJvbiIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTs7O0FBR0EsSUFBSUEsSUFBSUMsUUFBUSxRQUFSLENBQVI7O0FBRUEsSUFBSUMsT0FBTyxFQUFYO0FBQ0EsSUFBSUMsUUFBUSxFQUFaO0FBQ0EsSUFBSUMsSUFBSUMsT0FBT0MsTUFBUCxJQUFpQixFQUF6QjtBQUNBLElBQUlDLElBQUlILEVBQUVJLFFBQUYsSUFBYyxFQUF0QjtBQUNBLElBQUlDLElBQUlMLEVBQUVNLFFBQUYsSUFBYyxFQUF0Qjs7QUFFQSxTQUFTQyxPQUFULENBQWlCQyxDQUFqQixFQUFvQjtBQUNuQixLQUFJQSxNQUFNLElBQVYsRUFBZ0I7QUFDZixTQUFPLE1BQVA7QUFDQTtBQUNELFFBQU9DLE9BQU9DLFNBQVAsQ0FBaUJDLFFBQWpCLENBQ0xDLElBREssQ0FDQUosQ0FEQSxFQUVMSyxLQUZLLENBRUMsR0FGRCxFQUVNLENBRk4sRUFHTEEsS0FISyxDQUdDLEdBSEQsRUFHTSxDQUhOLEVBSUxDLFdBSkssRUFBUDtBQUtBOztBQUVELFNBQVNDLE1BQVQsQ0FBZ0JDLEdBQWhCLEVB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RUFBWWpPLEVBQUUsSUFBRixDQUFaLEVBQXFCMkMsSUFBckIsQ0FBMEIsWUFBVztBQUNwQzNDLEtBQUUsSUFBRixFQUFRb08sTUFBUixDQUFlRixJQUFJLElBQW5CO0FBQ0EsR0FGRDtBQUdBLEVBUkQ7QUFTQSxDQVZEOztBQVlBaE8sS0FBS21PLE1BQUwsR0FBYyxJQUFkOztBQUVBck8sRUFBRVEsUUFBRixFQUFZOE4sS0FBWixDQUFrQixZQUFXO0FBQzVCcE8sTUFBS3lELElBQUwsQ0FBVSxpQkFBVjtBQUNBLENBRkQ7QUFHQTNELEVBQUVNLE1BQUYsRUFBVWlPLEVBQVYsQ0FBYSxNQUFiLEVBQXFCLFlBQVc7QUFDL0JyTyxNQUFLeUQsSUFBTCxDQUFVLGNBQVY7QUFDQSxDQUZEOztBQUlBNkssT0FBT0MsT0FBUCxHQUFpQnZPLElBQWpCIiwiZmlsZSI6Ilplc2suanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAmY29weTsgMjAxNyBNYXJrZXQgQWN1bWVuLCBJbmMuXG4gKi9cbnZhciAkID0gcmVxdWlyZShcImpxdWVyeVwiKTtcblxudmFyIFplc2sgPSB7fTtcbnZhciBob29rcyA9IHt9O1xudmFyIFcgPSBnbG9iYWwud2luZG93IHx8IHt9O1xudmFyIGQgPSBXLmRvY3VtZW50IHx8IHt9O1xudmFyIEwgPSBXLmxvY2F0aW9uIHx8IHt9O1xuXG5mdW5jdGlvbiBnZXR0eXBlKHgpIHtcblx0aWYgKHggPT09IG51bGwpIHtcblx0XHRyZXR1cm4gXCJudWxsXCI7XG5cdH1cblx0cmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmdcblx0XHQuY2FsbCh4KVxuXHRcdC5zcGxpdChcIiBcIilbMV1cblx0XHQuc3BsaXQoXCJdXCIpWzBdXG5cdFx0LnRvTG93ZXJDYXNlKCk7XG59XG5cbmZ1bmN0aW9uIGF2YWx1ZShvYmosIGksIGRlZikge1xuXHRpZiAoZGVmID09PSB1bmRlZmluZWQpIHtcblx0XHRkZWYgPSBudWxsO1xuXHR9XG5cdGlmICh0eXBlb2Ygb2JqID09PSBcIm9iamVjdFwiKSB7XG5cdFx0aWYgKHR5cGVvZiBvYmpbaV0gIT09IFwidW5kZWZpbmVkXCIpIHtcblx0XHRcdHJldHVybiBvYmpbaV07XG5cdFx0fVxuXHRcdHJldHVybiBkZWY7XG5cdH1cblx0cmV0dXJuIGRlZjtcbn1cblplc2suYXZhbHVlID0gYXZhbHVlO1xuXG5mdW5jdGlvbiBpc19ib29sKGEpIHtcblx0cmV0dXJuIGdldHR5cGUoYSkgPT09IFwiYm9vbGVhblwiO1xufVxuZnVuY3Rpb24gaXNfbnVtZXJpYyhhKSB7XG5cdHJldHVybiBnZXR0eXBlKGEpID09PSBcIm51bWJlclwiO1xufVxuZnVuY3Rpb24gaXNfc3RyaW5nKGEpIHtcblx0cmV0dXJuIGdldHR5cGUoYSkgPT09IFwic3RyaW5nXCI7XG59XG5mdW5jdGlvbiBpc19hcnJheShhKSB7XG5cdHJldHVybiBnZXR0eXBlKGEpID09PSBcImFycmF5XCI7XG59XG5mdW5jdGlvbiBpc19vYmplY3QoYSkge1xuXHRyZXR1cm4gZ2V0dHlwZShhKSA9PT0gXCJvYmplY3RcIjtcbn1cbmZ1bmN0aW9uIGlzX2ludGVnZXIoYSkge1xuXHRyZXR1cm4gaXNfbnVtZXJpYyhhKSAmJiBwYXJzZUludChhLCAxMCkgPT09IGE7XG59XG5mdW5jdGlvbiBpc19mdW5jdGlvbihhKSB7XG5cdHJldHVybiBnZXR0eXBlKGEpID09PSBcImZ1bmN0aW9uXCI7XG59XG5mdW5jdGlvbiBpc19mbG9hdChhKSB7XG5cdHJldHVybiB0eXBlb2YgYSA9PT0gXCJudW1iZXJcIiAmJiBwYXJzZUludChhLCAxMCkgIT09IGE7XG59XG5mdW5jdGlvbiBpc191cmwoeCkge1xuXHRyZXR1cm4gL15odHRwOlxcL1xcLy4rfF5odHRwczpcXC9cXC8uK3xebWFpbHRvOi4rQC4rfF5mdHA6XFwvXFwvLit8XmZpbGU6XFwvXFwvLit8Xm5ld3M6XFwvXFwvLisvLmV4ZWMoXG5cdFx0eC50b0xvd2VyQ2FzZSgpLnRyaW0oKVxuXHQpO1xufVxuXG5aZXNrLmZsaXAgPSBmdW5jdGlvbihvYmplY3QpIHtcblx0dmFyIGksXG5cdFx0cmVzdWx0ID0ge307XG5cdGZvciAoaSBpbiBvYmplY3QpIHtcblx0XHRpZiAob2JqZWN0Lmhhc093blByb3BlcnR5KGkpKSB7XG5cdFx0XHRyZXN1bHRbU3RyaW5nKG9iamVjdFtpXSldID0gaTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHJlc3VsdDtcbn07XG5cbi8qIEtlcm5lbCAqL1xuXG5aZXNrLmlzX2RhdGUgPSBmdW5jdGlvbihhKSB7XG5cdHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYSkgPT09IFwiW29iamVjdCBEYXRlXVwiO1xufTtcblxuWmVzay5nZXR0eXBlID0gZ2V0dHlwZTtcblxuWmVzay5lYWNoID0gWmVzay5lYWNoO1xuXG5aZXNrLmlzX2FycmF5ID0gaXNfYXJyYXk7XG5aZXNrLmlzX29iamVjdCA9IGlzX29iamVjdDtcblplc2suaXNfYXJyYXkgPSBpc19hcnJheTtcblplc2suaXNfbnVtYmVyID0gaXNfbnVtZXJpYztcblplc2suaXNfbnVtZXJpYyA9IGlzX251bWVyaWM7XG5aZXNrLmlzX2Jvb2wgPSBpc19ib29sO1xuWmVzay5pc19zdHJpbmcgPSBpc19zdHJpbmc7XG5aZXNrLmlzX2ludGVnZXIgPSBpc19pbnRlZ2VyO1xuWmVzay5pc19mdW5jdGlvbiA9IGlzX2Z1bmN0aW9uO1xuWmVzay5pc19mbG9hdCA9IGlzX2Zsb2F0O1xuWmVzay5pc191cmwgPSBpc191cmw7XG5cbmZ1bmN0aW9uIHRvX2xpc3QoeCwgZGVmLCBkZWxpbSkge1xuXHRkZWYgPSBkZWYgfHwgW107XG5cdGRlbGltID0gZGVsaW0gfHwgXCIuXCI7XG5cdGlmIChpc19hcnJheSh4KSkge1xuXHRcdHJldHVybiB4O1xuXHR9XG5cdGlmICh4ID09PSBudWxsKSB7XG5cdFx0cmV0dXJuIGRlZjtcblx0fVxuXHRyZXR1cm4geC50b1N0cmluZygpLnNwbGl0KGRlbGltKTtcbn1cblxuZnVuY3Rpb24gdG9fYm9vbCh4KSB7XG5cdHZhciBkID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBhcmd1bWVudHNbMV0gOiBmYWxzZTtcblx0aWYgKGlzX2Jvb2woeCkpIHtcblx0XHRyZXR1cm4geDtcblx0fVxuXHRpZiAoaXNfbnVtZXJpYyh4KSkge1xuXHRcdHJldHVybiB4ICE9PSAwO1xuXHR9XG5cdGlmIChpc19zdHJpbmcoeCkpIHtcblx0XHRpZiAoW1widFwiLCBcInRydWVcIiwgXCIxXCIsIFwiZW5hYmxlZFwiLCBcInlcIiwgXCJ5ZXNcIl0uY29udGFpbnMoeCkpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0XHRpZiAoW1wiZlwiLCBcImZhbHNlXCIsIFwiMFwiLCBcImRpc2FibGVkXCIsIFwiblwiLCBcIm5vXCJdLmNvbnRhaW5zKHgpKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBkO1xufVxuXG5mdW5jdGlvbiBvYmplY3RfcGF0aChvYmplY3QsIHBhdGgsIGRlZikge1xuXHR2YXIgY3VyciA9IG9iamVjdCxcblx0XHRrO1xuXHRwYXRoID0gdG9fbGlzdChwYXRoLCBbXSwgXCIuXCIpO1xuXHRmb3IgKGsgPSAwOyBrIDwgcGF0aC5sZW5ndGg7IGsrKykge1xuXHRcdGlmIChrID09PSBwYXRoLmxlbmd0aCAtIDEpIHtcblx0XHRcdHJldHVybiBhdmFsdWUoY3VyciwgcGF0aFtrXSwgZGVmKTtcblx0XHR9XG5cdFx0Y3VyciA9IGF2YWx1ZShjdXJyLCBwYXRoW2tdKTtcblx0XHRpZiAoY3VyciA9PT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuIGRlZjtcblx0XHR9XG5cdFx0aWYgKCFpc19vYmplY3QoY3VycikpIHtcblx0XHRcdHJldHVybiBkZWY7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBjdXJyO1xufVxuXG5mdW5jdGlvbiBvYmplY3Rfc2V0X3BhdGgob2JqZWN0LCBwYXRoLCB2YWx1ZSkge1xuXHR2YXIgY3VyciA9IG9iamVjdCxcblx0XHRrLFxuXHRcdHNlZztcblx0cGF0aCA9IHRvX2xpc3QocGF0aCwgW10sIFwiLlwiKTtcblx0Zm9yIChrID0gMDsgayA8IHBhdGgubGVuZ3RoOyBrKyspIHtcblx0XHRzZWcgPSBwYXRoW2tdO1xuXHRcdGlmICh0eXBlb2YgY3VycltzZWddID09PSBcIm9iamVjdFwiKSB7XG5cdFx0XHRjdXJyID0gY3VycltzZWddO1xuXHRcdH0gZWxzZSBpZiAoayA9PT0gcGF0aC5sZW5ndGggLSAxKSB7XG5cdFx0XHRjdXJyW3NlZ10gPSB2YWx1ZTtcblx0XHRcdGJyZWFrO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjdXJyW3NlZ10gPSB7fTtcblx0XHRcdGN1cnIgPSBjdXJyW3NlZ107XG5cdFx0fVxuXHR9XG5cdHJldHVybiBvYmplY3Q7XG59XG5cblplc2sub2JqZWN0X3BhdGggPSBvYmplY3RfcGF0aDtcblplc2sub2JqZWN0X3NldF9wYXRoID0gb2JqZWN0X3NldF9wYXRoO1xuXG5mdW5jdGlvbiBob29rX3BhdGgoaG9vaykge1xuXHRob29rID0gU3RyaW5nKGhvb2spLnRvTG93ZXJDYXNlKCk7XG5cdGhvb2sgPSB0b19saXN0KGhvb2ssIFtdLCBcIjo6XCIpO1xuXHRpZiAoaG9vay5sZW5ndGggPT09IDEpIHtcblx0XHRob29rLnB1c2goXCIqXCIpO1xuXHR9XG5cdHJldHVybiBob29rO1xufVxuXG5PYmplY3QuYXNzaWduKFplc2ssIHtcblx0ZDogZCxcblx0c2V0dGluZ3M6IHt9LCAvLyBQbGFjZSBtb2R1bGUgZGF0YSBoZXJlIVxuXHRob29rczogaG9va3MsIC8vIE1vZHVsZSBob29rcyBnbyBoZXJlIC0gdXNlIGFkZF9ob29rIGFuZCBob29rIHRvIHVzZVxuXHR3OiBXLFxuXHR1cmxfcGFydHM6IHtcblx0XHRwYXRoOiBMLnBhdGhuYW1lLFxuXHRcdGhvc3Q6IEwuaG9zdCxcblx0XHRxdWVyeTogTC5zZWFyY2gsXG5cdFx0c2NoZW1lOiBMLnByb3RvY29sLFxuXHRcdHVybDogZC5VUkwsXG5cdFx0dXJpOiBMLnBhdGhuYW1lICsgTC5zZWFyY2gsXG5cdH0sXG5cdHBhZ2Vfc2NyaXB0czogbnVsbCxcblx0cXVlcnlfZ2V0OiBmdW5jdGlvbih2LCBkZWYpIHtcblx0XHRkZWYgPSBkZWYgfHwgbnVsbDtcblx0XHR2YXIgcGFpcixcblx0XHRcdGksXG5cdFx0XHR1ID0gZC5VUkwudG9TdHJpbmcoKS5yaWdodChcIj9cIiwgbnVsbCk7XG5cdFx0aWYgKCF1KSB7XG5cdFx0XHRyZXR1cm4gZGVmO1xuXHRcdH1cblx0XHR1ID0gdS5zcGxpdChcIiZcIik7XG5cdFx0Zm9yIChpID0gMDsgaSA8IHUubGVuZ3RoOyBpKyspIHtcblx0XHRcdHBhaXIgPSB1W2ldLnNwbGl0KFwiPVwiLCAyKTtcblx0XHRcdGlmIChwYWlyWzBdID09PSB2KSB7XG5cdFx0XHRcdHJldHVybiBwYWlyWzFdIHx8IHBhaXJbMF07XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBkZWY7XG5cdH0sXG5cdC8qKlxuICAgICAqIEBwYXJhbSBuYW1lIHN0cmluZyBOYW1lIG9mIGNvb2tpZSB0byBzZXQvZ2V0XG4gICAgICogQHBhcmFtIHZhbHVlIHN0cmluZyBWYWx1ZSBvZiBjb29raWUgdG8gc2V0XG4gICAgICogQHBhcmFtIG9wdGlvbnMgb2JqZWN0IEV4dHJhIG9wdGlvbnM6IHR0bDogaW50ZWdlciAoc2Vjb25kcyksIGRvbWFpbjogc3RyaW5nXG4gICAgICovXG5cdGNvb2tpZTogZnVuY3Rpb24obmFtZSwgdmFsdWUsIG9wdGlvbnMpIHtcblx0XHR2YXIgZ2V0Y29va2llID0gZnVuY3Rpb24obikge1xuXHRcdFx0XHR2YXIgYyA9IGQuY29va2llO1xuXHRcdFx0XHR2YXIgcyA9IGMubGFzdEluZGV4T2YobiArIFwiPVwiKTtcblx0XHRcdFx0aWYgKHMgPCAwKSB7XG5cdFx0XHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0XHRcdH1cblx0XHRcdFx0cyArPSBuLmxlbmd0aCArIDE7XG5cdFx0XHRcdHZhciBlID0gYy5pbmRleE9mKFwiO1wiLCBzKTtcblx0XHRcdFx0aWYgKGUgPCAwKSB7XG5cdFx0XHRcdFx0ZSA9IGMubGVuZ3RoO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBXLnVuZXNjYXBlKGMuc3Vic3RyaW5nKHMsIGUpKTtcblx0XHRcdH0sXG5cdFx0XHRzZXRjb29raWUgPSBmdW5jdGlvbihuLCB2LCBvcHRpb25zKSB7XG5cdFx0XHRcdHZhciBhID0gbmV3IERhdGUoKSxcblx0XHRcdFx0XHR0ID0gcGFyc2VJbnQob3B0aW9ucy50dGwsIDEwKSB8fCAtMSxcblx0XHRcdFx0XHRtID0gb3B0aW9ucy5kb21haW4gfHwgbnVsbDtcblx0XHRcdFx0aWYgKHQgPD0gMCkge1xuXHRcdFx0XHRcdGEuc2V0RnVsbFllYXIoMjAzMCk7XG5cdFx0XHRcdH0gZWxzZSBpZiAodCA+IDApIHtcblx0XHRcdFx0XHRhLnNldFRpbWUoYS5nZXRUaW1lKCkgKyB0ICogMTAwMCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZC5jb29raWUgPSBuICsgXCI9XCIgKyBXLmVzY2FwZSh2KSArIFwiOyBwYXRoPS87IGV4cGlyZXM9XCIgKyBhLnRvR01UU3RyaW5nKCkgKyAobSA/IFwiOyBkb21haW49XCIgKyBtIDogXCJcIik7XG5cdFx0XHRcdHJldHVybiB2O1xuXHRcdFx0fSxcblx0XHRcdGRlbGV0ZV9jb29raWUgPSBmdW5jdGlvbihuYW1lLCBkb20pIHtcblx0XHRcdFx0dmFyIG5vdyA9IG5ldyBEYXRlKCksXG5cdFx0XHRcdFx0ZSA9IG5ldyBEYXRlKG5vdy5nZXRUaW1lKCkgLSA4NjQwMCk7XG5cdFx0XHRcdGQuY29va2llID0gbmFtZSArIFwiPTsgcGF0aD0vOyBleHBpcmVzPVwiICsgZS50b0dNVFN0cmluZygpICsgKGRvbSA/IFwiOyBkb21haW49XCIgKyBkb20gOiBcIlwiKTtcblx0XHRcdH07XG5cdFx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cdFx0aWYgKHZhbHVlID09PSBudWxsKSB7XG5cdFx0XHRkZWxldGVfY29va2llKG5hbWUsIG9wdGlvbnMuZG9tIHx8IG51bGwpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRyZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA9PT0gMSA/IGdldGNvb2tpZShuYW1lKSA6IHNldGNvb2tpZShuYW1lLCB2YWx1ZSwgb3B0aW9ucyk7XG5cdH0sXG5cdGNzczogZnVuY3Rpb24ocCkge1xuXHRcdHZhciBjc3MgPSBkLmNyZWF0ZUVsZW1lbnQoXCJsaW5rXCIpO1xuXHRcdGNzcy5yZWwgPSBcInN0eWxlc2hlZXRcIjtcblx0XHRjc3MuaHJlZiA9IHA7XG5cdFx0Y3NzLm1lZGlhID0gYXJndW1lbnRzWzFdIHx8IFwiYWxsXCI7XG5cdFx0ZC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImhlYWRcIilbMF0uYXBwZW5kQ2hpbGQoY3NzKTtcblx0fSxcblx0bG9nOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoVy5jb25zb2xlICYmIFcuY29uc29sZS5sb2cpIHtcblx0XHRcdFcuY29uc29sZS5sb2coYXJndW1lbnRzKTtcblx0XHR9XG5cdH0sXG5cdGFkZF9ob29rOiBmdW5jdGlvbihob29rLCBmdW4pIHtcblx0XHR2YXIgcGF0aCA9IGhvb2tfcGF0aChob29rKSxcblx0XHRcdGN1cnIgPSBvYmplY3RfcGF0aChob29rcywgcGF0aCk7XG5cdFx0aWYgKGN1cnIpIHtcblx0XHRcdGN1cnIucHVzaChmdW4pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjdXJyID0gW2Z1bl07XG5cdFx0XHRvYmplY3Rfc2V0X3BhdGgoaG9va3MsIHBhdGgsIGN1cnIpO1xuXHRcdH1cblx0fSxcblx0aGFzX2hvb2s6IGZ1bmN0aW9uKGhvb2spIHtcblx0XHR2YXIgZnVuY3MgPSBvYmplY3RfcGF0aChob29rcywgaG9va19wYXRoKGhvb2spLCBudWxsKTtcblx0XHRyZXR1cm4gZnVuY3MgPyB0cnVlIDogZmFsc2U7XG5cdH0sXG5cdGhvb2s6IGZ1bmN0aW9uKGhvb2spIHtcblx0XHR2YXIgcGF0aCA9IGhvb2tfcGF0aChob29rKSxcblx0XHRcdGFyZ3MgPSBaZXNrLmNsb25lKGFyZ3VtZW50cyksXG5cdFx0XHRmdW5jcyA9IG9iamVjdF9wYXRoKGhvb2tzLCBwYXRoLCBudWxsKSxcblx0XHRcdHJlc3VsdHMgPSBbXSxcblx0XHRcdGk7XG5cdFx0aWYgKCFmdW5jcykge1xuXHRcdFx0cmV0dXJuIHJlc3VsdHM7XG5cdFx0fVxuXHRcdGlmIChhcmdzLmxlbmd0aCA+IDEpIHtcblx0XHRcdGFyZ3Muc2hpZnQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0YXJncyA9IFtdO1xuXHRcdH1cblxuXHRcdGZvciAoaSA9IDA7IGkgPCBmdW5jcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0cmVzdWx0cy5wdXNoKGZ1bmNzW2ldLmFwcGx5KG51bGwsIGFyZ3MpKTtcblx0XHR9XG5cdFx0cmV0dXJuIHJlc3VsdHM7XG5cdH0sXG5cdGdldF9wYXRoOiBmdW5jdGlvbihwYXRoLCBkZWYpIHtcblx0XHRyZXR1cm4gb2JqZWN0X3BhdGgoWmVzay5zZXR0aW5ncywgcGF0aCwgZGVmKTtcblx0fSxcblx0c2V0X3BhdGg6IGZ1bmN0aW9uKHBhdGgsIHZhbHVlKSB7XG5cdFx0cmV0dXJuIG9iamVjdF9zZXRfcGF0aChaZXNrLnNldHRpbmdzLCBwYXRoLCB2YWx1ZSk7XG5cdH0sXG5cdGdldDogZnVuY3Rpb24obikge1xuXHRcdHZhciBhID0gYXJndW1lbnRzO1xuXHRcdHJldHVybiBhdmFsdWUoWmVzay5zZXR0aW5ncywgbiwgYS5sZW5ndGggPiAxID8gYVsxXSA6IG51bGwpO1xuXHR9LFxuXHRnZXRiOiBmdW5jdGlvbihuKSB7XG5cdFx0dmFyIGEgPSBhcmd1bWVudHMsXG5cdFx0XHRkID0gYS5sZW5ndGggPiAxID8gYVsxXSA6IGZhbHNlO1xuXHRcdHJldHVybiB0b19ib29sKFplc2suZ2V0KG4sIGQpKTtcblx0fSxcblx0c2V0OiBmdW5jdGlvbihuLCB2KSB7XG5cdFx0dmFyIGEgPSBhcmd1bWVudHMsXG5cdFx0XHRvdmVyd3JpdGUgPSBhLmxlbmd0aCA+IDIgPyB0b19ib29sKGFbMl0pIDogdHJ1ZTtcblx0XHRpZiAoIW92ZXJ3cml0ZSAmJiB0eXBlb2YgWmVzay5zZXR0aW5nc1tuXSAhPT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdFx0cmV0dXJuIFplc2suc2V0dGluZ3Nbbl07XG5cdFx0fVxuXHRcdFplc2suc2V0dGluZ3Nbbl0gPSB2O1xuXHRcdHJldHVybiB2O1xuXHR9LFxuXHRpbmhlcml0OiBmdW5jdGlvbih0aGVfY2xhc3MsIHN1cGVyX2NsYXNzLCBwcm90b3R5cGUpIHtcblx0XHQvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzExMTQwMjQvY29uc3RydWN0b3JzLWluLWphdmFzY3JpcHQtb2JqZWN0c1xuXHRcdHZhciBtZXRob2QsXG5cdFx0XHRDb25zdHJ1Y3QgPSBmdW5jdGlvbigpIHt9O1xuXHRcdHN1cGVyX2NsYXNzID0gc3VwZXJfY2xhc3MgfHwgT2JqZWN0O1xuXHRcdENvbnN0cnVjdC5wcm90b3R5cGUgPSBzdXBlcl9jbGFzcy5wcm90b3R5cGU7XG5cdFx0dGhlX2NsYXNzLnByb3RvdHlwZSA9IG5ldyBDb25zdHJ1Y3QoKTtcblx0XHR0aGVfY2xhc3MucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gdGhlX2NsYXNzO1xuXHRcdHRoZV9jbGFzc1tcInN1cGVyXCJdID0gc3VwZXJfY2xhc3M7XG5cdFx0aWYgKHByb3RvdHlwZSBpbnN0YW5jZW9mIE9iamVjdCkge1xuXHRcdFx0Zm9yIChtZXRob2QgaW4gcHJvdG90eXBlKSB7XG5cdFx0XHRcdGlmIChwcm90b3R5cGUuaGFzT3duUHJvcGVydHkobWV0aG9kKSkge1xuXHRcdFx0XHRcdGlmICghdGhlX2NsYXNzLnByb3RvdHlwZVttZXRob2RdKSB7XG5cdFx0XHRcdFx0XHR0aGVfY2xhc3MucHJvdG90eXBlW21ldGhvZF0gPSBwcm90b3R5cGVbbWV0aG9kXTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0dGhlX2NsYXNzLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIFplc2suY2xvbmUodGhpcyk7XG5cdFx0fTtcblx0XHRyZXR1cm4gdGhlX2NsYXNzO1xuXHR9LFxuXHQvKipcblx0ICogSXRlcmF0ZSBvdmVyIGFuIG9iamVjdCwgY2FsbGluZyBhIGZ1bmN0aW9uIG9uY2UgcGVyIGVsZW1lbnRcblx0ICogXG5cdCAqIEBwYXJhbSB7b2JqZWN0fGFycmF5fSB4XG5cdCAqIEBwYXJhbSB7ZnVuY3Rpb259IGZuIHdpdGggc2lnbmF0dXJlIChrZXksIHZhbHVlLCBjb2xsZWN0aW9uKSBcInRoaXNcIiBpcyBzZXQgdG8gdGhlIHZhbHVlIGFzIHdlbGxcblx0ICogQHBhcmFtIHtib29sZWFufSB0ZXJtX2ZhbGVzIFNldCB0byB0cnVlIHRvIHRlcm1pbmF0ZSB3aGVuIGZ1bmN0aW9uIHJldHVybnMgYSBmYWxzZS1pc2ggdmFsdWUgYXMgb3Bwb3NlZCB0byBhIHRydWUtaXNoIHZhbHVlXG5cdCAqL1xuXHRlYWNoOiBmdW5jdGlvbih4LCBmbiwgdGVybV9mYWxzZSkge1xuXHRcdHZhciBpLCByO1xuXHRcdHRlcm1fZmFsc2UgPSB0b19ib29sKHRlcm1fZmFsc2UpO1xuXHRcdGlmIChpc19hcnJheSh4KSkge1xuXHRcdFx0Zm9yIChpID0gMDsgaSA8IHgubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0ciA9IGZuLmNhbGwoeFtpXSwgaSwgeFtpXSwgeCk7XG5cdFx0XHRcdGlmICh0ZXJtX2ZhbHNlKSB7XG5cdFx0XHRcdFx0aWYgKCFyKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gcjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSBpZiAocikge1xuXHRcdFx0XHRcdHJldHVybiByO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmIChpc19vYmplY3QoeCkpIHtcblx0XHRcdGZvciAoaSBpbiB4KSB7XG5cdFx0XHRcdGlmICh4Lmhhc093blByb3BlcnR5KGkpKSB7XG5cdFx0XHRcdFx0ciA9IGZuLmNhbGwoeFtpXSwgaSwgeFtpXSwgeCk7XG5cdFx0XHRcdFx0aWYgKHRlcm1fZmFsc2UpIHtcblx0XHRcdFx0XHRcdGlmICghcikge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcjtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9IGVsc2UgaWYgKHIpIHtcblx0XHRcdFx0XHRcdHJldHVybiByO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gZm4uY2FsbCh4LCAwLCB4KTtcblx0XHR9XG5cdH0sXG5cdHRwbDogZnVuY3Rpb24obWl4ZWQsIG1hcCkge1xuXHRcdHJldHVybiAkKG1peGVkKVxuXHRcdFx0Lmh0bWwoKVxuXHRcdFx0Lm1hcChtYXAsIGZhbHNlKTtcblx0fSxcblx0c2NyaXB0X3NyY19ub3JtYWxpemU6IGZ1bmN0aW9uKHNyYykge1xuXHRcdHZhciBtYXRjaGVzLFxuXHRcdFx0cGFydHMgPSBaZXNrLnVybF9wYXJ0cztcblx0XHRzcmMgPSBzcmMudW5wcmVmaXgocGFydHMuc2NoZW1lICsgXCI6Ly9cIiArIHBhcnRzLmhvc3QpO1xuXHRcdG1hdGNoZXMgPSBzcmMubWF0Y2goLyguKilcXD9fdmVyPVswLTldKyQvKTtcblx0XHRpZiAobWF0Y2hlcyAhPT0gbnVsbCkge1xuXHRcdFx0c3JjID0gbWF0Y2hlc1sxXTtcblx0XHR9XG5cdFx0cmV0dXJuIHNyYztcblx0fSxcblx0c2NyaXB0c19pbml0OiBmdW5jdGlvbigpIHtcblx0XHRaZXNrLnBhZ2Vfc2NyaXB0cyA9IHt9O1xuXHRcdCQoJ3NjcmlwdFt0eXBlPVwidGV4dC9qYXZhc2NyaXB0XCJdW3NyY10nKS5lYWNoKGZ1bmN0aW9uKCkge1xuXHRcdFx0WmVzay5zY3JpcHRfYWRkKCQodGhpcykuYXR0cihcInNyY1wiKSk7XG5cdFx0fSk7XG5cdH0sXG5cdHNjcmlwdF9hZGQ6IGZ1bmN0aW9uKHNyYykge1xuXHRcdGlmIChaZXNrLnBhZ2Vfc2NyaXB0cyA9PT0gbnVsbCkge1xuXHRcdFx0WmVzay5zY3JpcHRzX2luaXQoKTtcblx0XHR9XG5cdFx0WmVzay5wYWdlX3NjcmlwdHNbc3JjXSA9IHRydWU7XG5cdFx0WmVzay5wYWdlX3NjcmlwdHNbWmVzay5zY3JpcHRfc3JjX25vcm1hbGl6ZShzcmMpXSA9IHRydWU7XG5cdH0sXG5cdHNjcmlwdHM6IGZ1bmN0aW9uKCkge1xuXHRcdGlmIChaZXNrLnBhZ2Vfc2NyaXB0cyA9PT0gbnVsbCkge1xuXHRcdFx0WmVzay5zY3JpcHRzX2luaXQoKTtcblx0XHR9XG5cdFx0cmV0dXJuIFplc2sucGFnZV9zY3JpcHRzO1xuXHR9LFxuXHRzY3JpcHRzX2NhY2hlZDogZnVuY3Rpb24oc3Jjcykge1xuXHRcdFplc2suZWFjaChzcmNzLCBmdW5jdGlvbigpIHtcblx0XHRcdFplc2suc2NyaXB0X2FkZCh0aGlzKTtcblx0XHR9KTtcblx0fSxcblx0c2NyaXB0X2xvYWRlZDogZnVuY3Rpb24oc3JjKSB7XG5cdFx0dmFyIHNjcmlwdHMgPSBaZXNrLnNjcmlwdHMoKSxcblx0XHRcdHJlc3VsdCA9IHNjcmlwdHNbc3JjXSB8fCBzY3JpcHRzW1plc2suc2NyaXB0X3NyY19ub3JtYWxpemUoc3JjKV0gfHwgZmFsc2U7XG5cdFx0Ly8gWmVzay5sb2coXCJaZXNrLnNjcmlwdF9sb2FkZWQoXCIgKyBzcmMgKyBcIikgPSBcIiArIChyZXN1bHQgPyBcInRydWVcIjpcblx0XHQvLyBcImZhbHNlXCIpKTtcblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9LFxuXHRzdHlsZXNoZWV0X2xvYWRlZDogZnVuY3Rpb24oaHJlZiwgbWVkaWEpIHtcblx0XHRyZXR1cm4gJCgnbGlua1tyZWw9XCJzdHlsZXNoZWV0XCJdW2hyZWY9XCInICsgaHJlZiArICdcIl1bbWVkaWE9XCInICsgbWVkaWEgKyAnXCInKS5sZW5ndGggPiAwO1xuXHR9LFxuXHRtZXNzYWdlOiBmdW5jdGlvbihtZXNzYWdlLCBvcHRpb25zKSB7XG5cdFx0aWYgKGlzX3N0cmluZyhvcHRpb25zKSkge1xuXHRcdFx0b3B0aW9ucyA9IHsgbGV2ZWw6IG9wdGlvbnMgfTtcblx0XHR9XG5cdFx0WmVzay5ob29rKFwibWVzc2FnZVwiLCBtZXNzYWdlLCBvcHRpb25zKTtcblx0XHRaZXNrLmxvZyhtZXNzYWdlLCBvcHRpb25zKTtcblx0fSxcblx0cmVnZXhwX3F1b3RlOiBmdW5jdGlvbihzdHIsIGRlbGltaXRlcikge1xuXHRcdHJldHVybiBTdHJpbmcoc3RyKS5yZXBsYWNlKFxuXHRcdFx0bmV3IFJlZ0V4cChcIlsuXFxcXFxcXFwrKj9cXFxcW1xcXFxeXFxcXF0kKCl7fT0hPD58OlxcXFxcIiArIChkZWxpbWl0ZXIgfHwgXCJcIikgKyBcIi1dXCIsIFwiZ1wiKSxcblx0XHRcdFwiXFxcXCQmXCJcblx0XHQpO1xuXHR9LFxufSk7XG5cblplc2suY2xvbmUgPSBmdW5jdGlvbihvYmplY3QpIHtcblx0dmFyIGNsb25lLCBwcm9wLCBDb25zdHJ1Y3Rvcjtcblx0aWYgKG9iamVjdCA9PT0gbnVsbCkge1xuXHRcdHJldHVybiBvYmplY3Q7XG5cdH1cblx0aWYgKGlzX2Z1bmN0aW9uKG9iamVjdCkpIHtcblx0XHRyZXR1cm4gb2JqZWN0O1xuXHR9XG5cdGlmIChpc19hcnJheShvYmplY3QpIHx8IFplc2suZ2V0dHlwZShvYmplY3QpID09PSBcImFyZ3VtZW50c1wiKSB7XG5cdFx0Y2xvbmUgPSBbXTtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IG9iamVjdC5sZW5ndGg7IGkrKykge1xuXHRcdFx0Y2xvbmUucHVzaChaZXNrLmNsb25lKG9iamVjdFtpXSkpO1xuXHRcdH1cblx0XHRyZXR1cm4gY2xvbmU7XG5cdH1cblx0aWYgKCFpc19vYmplY3Qob2JqZWN0KSkge1xuXHRcdHJldHVybiBvYmplY3Q7XG5cdH1cblx0Q29uc3RydWN0b3IgPSBvYmplY3QuY29uc3RydWN0b3I7XG5cdHN3aXRjaCAoQ29uc3RydWN0b3IpIHtcblx0XHRjYXNlIFJlZ0V4cDpcblx0XHRcdGNsb25lID0gbmV3IENvbnN0cnVjdG9yKFxuXHRcdFx0XHRvYmplY3Quc291cmNlLFxuXHRcdFx0XHRcImdcIi5zdWJzdHIoMCwgTnVtYmVyKG9iamVjdC5nbG9iYWwpKSArXG5cdFx0XHRcdFx0XCJpXCIuc3Vic3RyKDAsIE51bWJlcihvYmplY3QuaWdub3JlQ2FzZSkpICtcblx0XHRcdFx0XHRcIm1cIi5zdWJzdHIoMCwgTnVtYmVyKG9iamVjdC5tdWx0aWxpbmUpKVxuXHRcdFx0KTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgRGF0ZTpcblx0XHRcdGNsb25lID0gbmV3IENvbnN0cnVjdG9yKG9iamVjdC5nZXRUaW1lKCkpO1xuXHRcdFx0YnJlYWs7XG5cdFx0ZGVmYXVsdDpcblx0XHRcdC8vIENhbiBub3QgY29weSB1bmtub3duIG9iamVjdHNcblx0XHRcdHJldHVybiBvYmplY3Q7XG5cdH1cblx0Zm9yIChwcm9wIGluIG9iamVjdCkge1xuXHRcdGlmIChvYmplY3QuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcblx0XHRcdGNsb25lW3Byb3BdID0gWmVzay5jbG9uZShvYmplY3RbcHJvcF0pO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gY2xvbmU7XG59O1xuXG5PYmplY3QuYXNzaWduKEFycmF5LnByb3RvdHlwZSwge1xuXHRjb250YWluczogZnVuY3Rpb24oeCkge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0aWYgKHRoaXNbaV0gPT09IHgpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZTtcblx0fSxcblx0cmVtb3ZlOiBmdW5jdGlvbih4KSB7XG5cdFx0dmFyIHRlbXAgPSB0aGlzLnNsaWNlKDApO1xuXHRcdHRlbXAuc3BsaWNlKHgsIDEpO1xuXHRcdHJldHVybiB0ZW1wO1xuXHR9LFxuXHQvKipcblx0ICogSm9pbiBlbGVtZW50cyBvZiBhbiBhcnJheSBieSB3cmFwcGluZyBlYWNoIG9uZSB3aXRoIGEgcHJlZml4L3N1ZmZpeFxuXHQgKiBcblx0ICogQHBhcmFtIHN0cmluZ1xuXHQgKiAgICAgICAgICAgIHByZWZpeFxuXHQgKiBAcGFyYW0gc3RyaW5nXG5cdCAqICAgICAgICAgICAgc3VmZml4XG5cdCAqIEByZXR1cm4gc3RyaW5nXG5cdCAqL1xuXHRqb2luX3dyYXA6IGZ1bmN0aW9uKHByZWZpeCwgc3VmZml4KSB7XG5cdFx0cHJlZml4ID0gU3RyaW5nKHByZWZpeCkgfHwgXCJcIjtcblx0XHRzdWZmaXggPSBTdHJpbmcoc3VmZml4KSB8fCBcIlwiO1xuXHRcdHJldHVybiBwcmVmaXggKyB0aGlzLmpvaW4oc3VmZml4ICsgcHJlZml4KSArIHN1ZmZpeDtcblx0fSxcbn0pO1xuXG5PYmplY3QuYXNzaWduKE9iamVjdCwge1xuXHRmcm9tQ2FtZWxDYXNlOiBmdW5jdGlvbihmcm9tKSB7XG5cdFx0dmFyIHRvID0ge307XG5cdFx0Zm9yICh2YXIgaSBpbiBmcm9tKSB7XG5cdFx0XHRpZiAoZnJvbS5oYXNPd25Qcm9wZXJ0eShpKSkge1xuXHRcdFx0XHR0b1tpLmZyb21DYW1lbENhc2UoKV0gPSBmcm9tW2ldO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gdG87XG5cdH0sXG5cdHRvQ2FtZWxDYXNlOiBmdW5jdGlvbihmcm9tKSB7XG5cdFx0dmFyIHRvID0ge307XG5cdFx0Zm9yICh2YXIgaSBpbiB0aGlzKSB7XG5cdFx0XHRpZiAoZnJvbS5oYXNPd25Qcm9wZXJ0eShpKSkge1xuXHRcdFx0XHR0b1tpLnRvQ2FtZWxDYXNlKCldID0gZnJvbVtpXTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIHRvO1xuXHR9LFxufSk7XG5cbk9iamVjdC5hc3NpZ24oU3RyaW5nLnByb3RvdHlwZSwge1xuXHRjb21wYXJlOiBmdW5jdGlvbihhKSB7XG5cdFx0cmV0dXJuIHRoaXMgPCBhID8gLTEgOiB0aGlzID09PSBhID8gMCA6IDE7XG5cdH0sXG5cdGxlZnQ6IGZ1bmN0aW9uKGRlbGltLCBkZWYpIHtcblx0XHR2YXIgcG9zID0gdGhpcy5pbmRleE9mKGRlbGltKTtcblx0XHRyZXR1cm4gcG9zIDwgMCA/IGF2YWx1ZShhcmd1bWVudHMsIDEsIGRlZiB8fCB0aGlzKSA6IHRoaXMuc3Vic3RyKDAsIHBvcyk7XG5cdH0sXG5cdHJsZWZ0OiBmdW5jdGlvbihkZWxpbSwgZGVmKSB7XG5cdFx0dmFyIHBvcyA9IHRoaXMubGFzdEluZGV4T2YoZGVsaW0pO1xuXHRcdHJldHVybiBwb3MgPCAwID8gYXZhbHVlKGFyZ3VtZW50cywgMSwgZGVmIHx8IHRoaXMpIDogdGhpcy5zdWJzdHIoMCwgcG9zKTtcblx0fSxcblx0cmlnaHQ6IGZ1bmN0aW9uKGRlbGltLCBkZWYpIHtcblx0XHR2YXIgcG9zID0gdGhpcy5pbmRleE9mKGRlbGltKTtcblx0XHRyZXR1cm4gcG9zIDwgMCA/IGF2YWx1ZShhcmd1bWVudHMsIDEsIGRlZiB8fCB0aGlzKSA6IHRoaXMuc3Vic3RyKHBvcyArIGRlbGltLmxlbmd0aCk7XG5cdH0sXG5cdHJyaWdodDogZnVuY3Rpb24oZGVsaW0sIGRlZikge1xuXHRcdHZhciBwb3MgPSB0aGlzLmxhc3RJbmRleE9mKGRlbGltKTtcblx0XHRyZXR1cm4gcG9zIDwgMCA/IGF2YWx1ZShhcmd1bWVudHMsIDEsIGRlZiB8fCB0aGlzKSA6IHRoaXMuc3Vic3RyKHBvcyArIGRlbGltLmxlbmd0aCk7XG5cdH0sXG5cdGx0cmltOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5yZXBsYWNlKC9eXFxzKy8sIFwiXCIpO1xuXHR9LFxuXHRydHJpbTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMucmVwbGFjZSgvXFxzKyQvLCBcIlwiKTtcblx0fSxcblx0dHJpbTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMucmVwbGFjZSgvXlxccysvLCBcIlwiKS5yZXBsYWNlKC9cXHMrJC8sIFwiXCIpO1xuXHR9LFxuXHQvKipcblx0ICogQGRlcHJlY2F0ZWRcblx0ICogQHBhcmFtIHhcblx0ICogICAgICAgICAgICBTdHJpbmcgdG8gbG9vayBhdFxuXHQgKi9cblx0ZW5kc193aXRoOiBmdW5jdGlvbih4KSB7XG5cdFx0cmV0dXJuIHRoaXMuZW5kcyh4KTtcblx0fSxcblx0ZW5kczogZnVuY3Rpb24oeCkge1xuXHRcdHZhciB4biA9IHgubGVuZ3RoLFxuXHRcdFx0biA9IHRoaXMubGVuZ3RoO1xuXHRcdGlmICh4biA+IG4pIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMuc3Vic3RyaW5nKG4gLSB4biwgbikgPT09IHg7XG5cdH0sXG5cdGJlZ2luc2k6IGZ1bmN0aW9uKHN0cmluZykge1xuXHRcdHZhciBsZW4gPSBzdHJpbmcubGVuZ3RoO1xuXHRcdGlmIChsZW4gPiB0aGlzLmxlbmd0aCkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5zdWJzdHIoMCwgbGVuKS50b0xvd2VyQ2FzZSgpID09PSBzdHJpbmcudG9Mb3dlckNhc2UoKTtcblx0fSxcblx0YmVnaW5zOiBmdW5jdGlvbihzdHJpbmcpIHtcblx0XHR2YXIgbGVuID0gc3RyaW5nLmxlbmd0aDtcblx0XHRpZiAobGVuID4gdGhpcy5sZW5ndGgpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMuc3Vic3RyKDAsIGxlbikgPT09IHN0cmluZztcblx0fSxcblx0c3RyX3JlcGxhY2U6IGZ1bmN0aW9uKHMsIHIpIHtcblx0XHR2YXIgc3RyID0gdGhpcztcblx0XHR2YXIgaTtcblx0XHRpZiAoaXNfc3RyaW5nKHMpKSB7XG5cdFx0XHRpZiAoaXNfc3RyaW5nKHIpKSB7XG5cdFx0XHRcdHJldHVybiB0aGlzLnNwbGl0KHMpLmpvaW4ocik7XG5cdFx0XHR9XG5cdFx0XHRmb3IgKGkgPSAwOyBpIDwgci5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRzdHIgPSBzdHIuc3RyX3JlcGxhY2UocywgcltpXSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gc3RyO1xuXHRcdH1cblx0XHRpZiAoaXNfc3RyaW5nKHIpKSB7XG5cdFx0XHRmb3IgKGkgPSAwOyBpIDwgcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRzdHIgPSBzdHIuc3RyX3JlcGxhY2Uoc1tpXSwgcik7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gc3RyO1xuXHRcdH1cblx0XHR2YXIgbiA9IE1hdGgubWluKHMubGVuZ3RoLCByLmxlbmd0aCk7XG5cdFx0Zm9yIChpID0gMDsgaSA8IG47IGkrKykge1xuXHRcdFx0c3RyID0gc3RyLnN0cl9yZXBsYWNlKHNbaV0sIHJbaV0pO1xuXHRcdH1cblx0XHRyZXR1cm4gc3RyO1xuXHR9LFxuXHR0cjogZnVuY3Rpb24ob2JqZWN0KSB7XG5cdFx0dmFyIGssXG5cdFx0XHRzZWxmID0gdGhpcztcblx0XHRmb3IgKGsgaW4gb2JqZWN0KSB7XG5cdFx0XHRpZiAob2JqZWN0Lmhhc093blByb3BlcnR5KGspKSB7XG5cdFx0XHRcdHNlbGYgPSBzZWxmLnN0cl9yZXBsYWNlKGssIG9iamVjdFtrXSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBzZWxmO1xuXHR9LFxuXHRtYXA6IGZ1bmN0aW9uKG9iamVjdCwgY2FzZV9pbnNlbnNpdGl2ZSkge1xuXHRcdHZhciBrLFxuXHRcdFx0c3VmZml4ID0gXCJcIixcblx0XHRcdHNlbGY7XG5cdFx0Y2FzZV9pbnNlbnNpdGl2ZSA9ICEhY2FzZV9pbnNlbnNpdGl2ZTsgLy8gQ29udmVydCB0byBib29sXG5cdFx0aWYgKCFpc19vYmplY3Qob2JqZWN0KSkge1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXHRcdHNlbGYgPSB0aGlzO1xuXHRcdGlmIChjYXNlX2luc2Vuc2l0aXZlKSB7XG5cdFx0XHRvYmplY3QgPSBaZXNrLmNoYW5nZV9rZXlfY2FzZShvYmplY3QpO1xuXHRcdFx0c3VmZml4ID0gXCJpXCI7XG5cdFx0fVxuXHRcdGZvciAoayBpbiBvYmplY3QpIHtcblx0XHRcdGlmIChvYmplY3QuaGFzT3duUHJvcGVydHkoaykpIHtcblx0XHRcdFx0dmFyIHZhbHVlID0gb2JqZWN0W2tdLFxuXHRcdFx0XHRcdHJlcGxhY2UgPSB2YWx1ZSA9PT0gbnVsbCA/IFwiXCIgOiBTdHJpbmcob2JqZWN0W2tdKTtcblx0XHRcdFx0c2VsZiA9IHNlbGYucmVwbGFjZShuZXcgUmVnRXhwKFwiXFxcXHtcIiArIGsgKyBcIlxcXFx9XCIsIFwiZ1wiICsgc3VmZml4KSwgcmVwbGFjZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBzZWxmO1xuXHR9LFxuXHR0b19hcnJheTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGksXG5cdFx0XHRyID0gW107XG5cdFx0Zm9yIChpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHIucHVzaCh0aGlzLmNoYXJBdChpKSk7XG5cdFx0fVxuXHRcdHJldHVybiByO1xuXHR9LFxuXHR1bnF1b3RlOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgbiA9IHRoaXMubGVuZ3RoO1xuXHRcdHZhciBxID0gYXJndW1lbnRzWzBdIHx8IFwiXFxcIlxcXCInJ1wiO1xuXHRcdHZhciBwID0gcS5pbmRleE9mKHRoaXMuc3Vic3RyaW5nKDAsIDEpKTtcblx0XHRpZiAocCA8IDApIHtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH1cblx0XHRpZiAodGhpcy5zdWJzdHJpbmcobiAtIDEsIG4pID09PSBxLmNoYXJBdChwICsgMSkpIHtcblx0XHRcdHJldHVybiB0aGlzLnN1YnN0cmluZygxLCBuIC0gMSk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHR0b0NhbWVsQ2FzZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHJlc3VsdCA9IFwiXCI7XG5cdFx0WmVzay5lYWNoKHRoaXMuc3BsaXQoXCJfXCIpLCBmdW5jdGlvbigpIHtcblx0XHRcdHJlc3VsdCArPSB0aGlzLnN1YnN0cigwLCAxKS50b1VwcGVyQ2FzZSgpICsgdGhpcy5zdWJzdHIoMSkudG9Mb3dlckNhc2UoKTtcblx0XHR9KTtcblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9LFxuXHRmcm9tQ2FtZWxDYXNlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5yZXBsYWNlKC9bQS1aXS9nLCBmdW5jdGlvbih2KSB7XG5cdFx0XHRyZXR1cm4gXCJfXCIgKyB2LnRvTG93ZXJDYXNlKCk7XG5cdFx0fSk7XG5cdH0sXG5cdHVucHJlZml4OiBmdW5jdGlvbihzdHJpbmcsIGRlZikge1xuXHRcdGlmICh0aGlzLmJlZ2lucyhzdHJpbmcpKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5zdWJzdHIoc3RyaW5nLmxlbmd0aCk7XG5cdFx0fVxuXHRcdHJldHVybiBkZWYgfHwgdGhpcztcblx0fSxcbn0pO1xuT2JqZWN0LmFzc2lnbihTdHJpbmcucHJvdG90eXBlLCB7XG5cdGVuZHM6IFN0cmluZy5wcm90b3R5cGUuZW5kc193aXRoLFxufSk7XG5cblplc2sudG9faW50ZWdlciA9IGZ1bmN0aW9uKHgpIHtcblx0dmFyIGQgPSBhcmd1bWVudHMubGVuZ3RoID4gMSA/IGFyZ3VtZW50c1sxXSA6IG51bGw7XG5cdHggPSBwYXJzZUludCh4LCAxMCk7XG5cdGlmICh0eXBlb2YgeCA9PT0gXCJudW1iZXJcIikge1xuXHRcdHJldHVybiB4O1xuXHR9XG5cdHJldHVybiBkO1xufTtcblxuWmVzay50b19saXN0ID0gdG9fbGlzdDtcblxuWmVzay50b19mbG9hdCA9IGZ1bmN0aW9uKHgpIHtcblx0dmFyIGQgPSBhcmd1bWVudHMubGVuZ3RoID4gMSA/IGFyZ3VtZW50c1sxXSA6IG51bGw7XG5cdHggPSBwYXJzZUZsb2F0KHgpO1xuXHRpZiAodHlwZW9mIHggPT09IFwibnVtYmVyXCIpIHtcblx0XHRyZXR1cm4geDtcblx0fVxuXHRyZXR1cm4gZDtcbn07XG5cblplc2sudG9fc3RyaW5nID0gZnVuY3Rpb24oeCkge1xuXHRyZXR1cm4geC50b1N0cmluZygpO1xufTtcblxuWmVzay50b19ib29sID0gdG9fYm9vbDtcblxuWmVzay5lbXB0eSA9IGZ1bmN0aW9uKHYpIHtcblx0cmV0dXJuIHR5cGVvZiB2ID09PSBcInVuZGVmaW5lZFwiIHx8IHYgPT09IG51bGwgfHwgdiA9PT0gXCJcIjtcbn07XG5cblplc2suWk9iamVjdCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cdHRoaXMub3B0aW9ucyA9IFplc2suY2hhbmdlX2tleV9jYXNlKE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMpKTtcblx0Ly8gdGhpcy5jb25zdHJ1Y3Rvci5zdXBlci5jYWxsKHRoaXMpO1xufTtcblplc2suaW5oZXJpdChaZXNrLlpPYmplY3QsIG51bGwsIHtcblx0Y2xvbmU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBaZXNrLmNsb25lKHRoaXMpO1xuXHR9LFxufSk7XG5cblplc2suY2hhbmdlX2tleV9jYXNlID0gZnVuY3Rpb24obWUpIHtcblx0dmFyIGssXG5cdFx0bmV3byA9IHt9O1xuXHRmb3IgKGsgaW4gbWUpIHtcblx0XHRpZiAobWUuaGFzT3duUHJvcGVydHkoaykpIHtcblx0XHRcdG5ld29bay50b0xvd2VyQ2FzZSgpXSA9IG1lW2tdO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gbmV3bztcbn07XG5cbmlmICh0eXBlb2YgTWF0aC5zaWduICE9PSBcImZ1bmN0aW9uXCIpIHtcblx0TWF0aC5zaWduID0gZnVuY3Rpb24oeCkge1xuXHRcdHJldHVybiB4ID8gKHggPCAwID8gLTEgOiAxKSA6IDA7XG5cdH07XG59XG5cbi8vIFRPRE8gV2hhdCdzIHRoaXMgZm9yP1xuWmVzay5hamF4X2Zvcm0gPSBmdW5jdGlvbigpIHtcblx0dmFyICRmb3JtID0gJCh0aGlzKSxcblx0XHR0YXJnZXQgPSAkZm9ybS5hdHRyKFwidGFyZ2V0XCIpLFxuXHRcdCR0YXJnZXQgPSAkKFwiI1wiICsgdGFyZ2V0KTtcblx0WmVzay5sb2coJHRhcmdldC5odG1sKCkpO1xufTtcblxuLypcbiAqIENvbXBhdGliaWxpdHlcbiAqL1xuLy8gaWYgKCFPYmplY3QucHJvdG90eXBlLmtleXMpIHtcbi8vIFx0T2JqZWN0LnByb3RvdHlwZS5rZXlzID0gZnVuY3Rpb24ob2JqKSB7XG4vLyBcdFx0dmFyIGtleXMgPSBbXSwgaztcbi8vIFx0XHRmb3IgKGsgaW4gb2JqKSB7XG4vLyBcdFx0XHRpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgaykpIHtcbi8vIFx0XHRcdFx0a2V5cy5wdXNoKGspO1xuLy8gXHRcdFx0fVxuLy8gXHRcdH1cbi8vIFx0XHRyZXR1cm4ga2V5cztcbi8vIFx0fTtcbi8vIH1cblxuJC5mbi5lcXVhbGhlaWdodCA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XG5cdCQodGhpcykuZWFjaChmdW5jdGlvbigpIHtcblx0XHR2YXIgaCA9IG51bGw7XG5cdFx0JChzZWxlY3RvciwgJCh0aGlzKSkuZWFjaChmdW5jdGlvbigpIHtcblx0XHRcdGggPSBNYXRoLm1heCgkKHRoaXMpLmhlaWdodCgpLCBoKTtcblx0XHR9KTtcblx0XHQkKHNlbGVjdG9yLCAkKHRoaXMpKS5lYWNoKGZ1bmN0aW9uKCkge1xuXHRcdFx0JCh0aGlzKS5oZWlnaHQoaCArIFwicHhcIik7XG5cdFx0fSk7XG5cdH0pO1xufTtcblxuWmVzay5pbml0ZWQgPSB0cnVlO1xuXG4kKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpIHtcblx0WmVzay5ob29rKFwiZG9jdW1lbnQ6OnJlYWR5XCIpO1xufSk7XG4kKHdpbmRvdykub24oXCJsb2FkXCIsIGZ1bmN0aW9uKCkge1xuXHRaZXNrLmhvb2soXCJ3aW5kb3c6OmxvYWRcIik7XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBaZXNrO1xuIl19