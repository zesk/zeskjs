'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*
 * $Id: Zesk.js 4226 2016-11-30 03:53:20Z kent $
 *
 * Copyright (C) 2017 Market Acumen, Inc. All rights reserved
 */
var $ = require('jquery');
var HTML = require('./HTML');

var Zesk = {};
var hooks = {};
var W = global.window || {};
var d = W.document || {};
var L = W.location || {};

function gettype(x) {
	if (x === null) {
		return 'null';
	}
	return Object.prototype.toString.call(x).split(' ')[1].split(']')[0].toLowerCase();
}

function avalue(obj, i, def) {
	if (def === undefined) {
		def = null;
	}
	if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === "object") {
		if (typeof obj[i] !== "undefined") {
			return obj[i];
		}
		return def;
	}
	return def;
}
Zesk.avalue = avalue;

function is_bool(a) {
	return gettype(a) === 'boolean';
}
function is_numeric(a) {
	return gettype(a) === "number";
}
function is_string(a) {
	return gettype(a) === "string";
}
function is_array(a) {
	return gettype(a) === 'array';
}
function is_object(a) {
	return gettype(a) === 'object';
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
	return Object.prototype.toString.call(a) === '[object Date]';
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
			var s = c.lastIndexOf(n + '=');
			if (s < 0) {
				return null;
			}
			s += n.length + 1;
			var e = c.indexOf(';', s);
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
			d.cookie = n + "=" + W.escape(v) + '; path=/; expires=' + a.toGMTString() + (m ? '; domain=' + m : '');
			return v;
		},
		    delete_cookie = function delete_cookie(name, dom) {
			var now = new Date(),
			    e = new Date(now.getTime() - 86400);
			d.cookie = name + '=; path=/; expires=' + e.toGMTString() + (dom ? '; domain=' + dom : '');
		};
		options = options || {};
		if (value === null) {
			delete_cookie(name, options.dom || null);
			return;
		}
		return arguments.length === 1 ? getcookie(name) : setcookie(name, value, options);
	},
	css: function css(p) {
		var css = d.createElement('link');
		css.rel = "stylesheet";
		css.href = p;
		css.media = arguments[1] || "all";
		d.getElementsByTagName('head')[0].appendChild(css);
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
		if (!overwrite && typeof Zesk.settings[n] !== 'undefined') {
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
		the_class['super'] = super_class;
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
		src = src.unprefix(parts.scheme + '://' + parts.host);
		matches = src.match(/(.*)\?_ver=[0-9]+$/);
		if (matches !== null) {
			src = matches[1];
		}
		return src;
	},
	scripts_init: function scripts_init() {
		Zesk.page_scripts = {};
		$('script[type="text/javascript"][src]').each(function () {
			Zesk.script_add($(this).attr('src'));
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
		Zesk.hook('message', _message, options);
		Zesk.log(_message, options);
	},
	regexp_quote: function regexp_quote(str, delimiter) {
		return String(str).replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
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
		return this.replace(/^\s+/, '');
	},
	rtrim: function rtrim() {
		return this.replace(/\s+$/, '');
	},
	trim: function trim() {
		return this.replace(/^\s+/, '').replace(/\s+$/, '');
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
		var q = arguments[0] || '""\'\'';
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
	if (typeof x === 'number') {
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
	if (typeof x === 'number') {
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
		if (['t', 'true', '1', 'enabled', 'y', 'yes'].contains(x)) {
			return true;
		}
		if (['f', 'false', '0', 'disabled', 'n', 'no'].contains(x)) {
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

if (typeof Math.sign !== 'function') {
	Math.sign = function (x) {
		return x ? x < 0 ? -1 : 1 : 0;
	};
}

// TODO What's this for?
Zesk.ajax_form = function () {
	var $form = $(this),
	    target = $form.attr('target'),
	    $target = $('#' + target);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9aZXNrLmpzIl0sIm5hbWVzIjpbIiQiLCJyZXF1aXJlIiwiSFRNTCIsIlplc2siLCJob29rcyIsIlciLCJnbG9iYWwiLCJ3aW5kb3ciLCJkIiwiZG9jdW1lbnQiLCJMIiwibG9jYXRpb24iLCJnZXR0eXBlIiwieCIsIk9iamVjdCIsInByb3RvdHlwZSIsInRvU3RyaW5nIiwiY2FsbCIsInNwbGl0IiwidG9Mb3dlckNhc2UiLCJhdmFsdWUiLCJvYmoiLCJpIiwiZGVmIiwidW5kZWZpbmVkIiwiaXNfYm9vbCIsImEiLCJpc19udW1lcmljIiwiaXNfc3RyaW5nIiwiaXNfYXJyYXkiLCJpc19vYmplY3QiLCJpc19pbnRlZ2VyIiwicGFyc2VJbnQiLCJpc19mdW5jdGlvbiIsImlzX2Zsb2F0IiwiaXNfdXJsIiwiZXhlYyIsInRyaW0iLCJmbGlwIiwib2JqZWN0IiwicmVzdWx0IiwiaGFzT3duUHJvcGVydHkiLCJTdHJpbmciLCJpc19kYXRlIiwiZWFjaCIsImlzX251bWJlciIsIm9iamVjdF9wYXRoIiwicGF0aCIsImN1cnIiLCJrIiwidG9fbGlzdCIsImxlbmd0aCIsIm9iamVjdF9zZXRfcGF0aCIsInZhbHVlIiwic2VnIiwiaG9va19wYXRoIiwiaG9vayIsInB1c2giLCJhc3NpZ24iLCJzZXR0aW5ncyIsInciLCJ1cmxfcGFydHMiLCJwYXRobmFtZSIsImhvc3QiLCJxdWVyeSIsInNlYXJjaCIsInNjaGVtZSIsInByb3RvY29sIiwidXJsIiwiVVJMIiwidXJpIiwicGFnZV9zY3JpcHRzIiwicXVlcnlfZ2V0IiwidiIsInBhaXIiLCJ1IiwicmlnaHQiLCJjb29raWUiLCJuYW1lIiwib3B0aW9ucyIsImdldGNvb2tpZSIsIm4iLCJjIiwicyIsImxhc3RJbmRleE9mIiwiZSIsImluZGV4T2YiLCJ1bmVzY2FwZSIsInN1YnN0cmluZyIsInNldGNvb2tpZSIsIkRhdGUiLCJ0IiwidHRsIiwibSIsImRvbWFpbiIsInNldEZ1bGxZZWFyIiwic2V0VGltZSIsImdldFRpbWUiLCJlc2NhcGUiLCJ0b0dNVFN0cmluZyIsImRlbGV0ZV9jb29raWUiLCJkb20iLCJub3ciLCJhcmd1bWVudHMiLCJjc3MiLCJwIiwiY3JlYXRlRWxlbWVudCIsInJlbCIsImhyZWYiLCJtZWRpYSIsImdldEVsZW1lbnRzQnlUYWdOYW1lIiwiYXBwZW5kQ2hpbGQiLCJsb2ciLCJjb25zb2xlIiwiYWRkX2hvb2siLCJmdW4iLCJoYXNfaG9vayIsImZ1bmNzIiwiYXJncyIsImNsb25lIiwicmVzdWx0cyIsInNoaWZ0IiwiYXBwbHkiLCJnZXRfcGF0aCIsInNldF9wYXRoIiwiZ2V0IiwiZ2V0YiIsInRvX2Jvb2wiLCJzZXQiLCJvdmVyd3JpdGUiLCJpbmhlcml0IiwidGhlX2NsYXNzIiwic3VwZXJfY2xhc3MiLCJtZXRob2QiLCJDb25zdHJ1Y3QiLCJjb25zdHJ1Y3RvciIsImZuIiwidGVybV9mYWxzZSIsInIiLCJ0cGwiLCJtaXhlZCIsIm1hcCIsImh0bWwiLCJzY3JpcHRfc3JjX25vcm1hbGl6ZSIsInNyYyIsIm1hdGNoZXMiLCJwYXJ0cyIsInVucHJlZml4IiwibWF0Y2giLCJzY3JpcHRzX2luaXQiLCJzY3JpcHRfYWRkIiwiYXR0ciIsInNjcmlwdHMiLCJzY3JpcHRzX2NhY2hlZCIsInNyY3MiLCJzY3JpcHRfbG9hZGVkIiwic3R5bGVzaGVldF9sb2FkZWQiLCJtZXNzYWdlIiwibGV2ZWwiLCJyZWdleHBfcXVvdGUiLCJzdHIiLCJkZWxpbWl0ZXIiLCJyZXBsYWNlIiwiUmVnRXhwIiwicHJvcCIsIkNvbnN0cnVjdG9yIiwic291cmNlIiwic3Vic3RyIiwiTnVtYmVyIiwiaWdub3JlQ2FzZSIsIm11bHRpbGluZSIsIkFycmF5IiwiY29udGFpbnMiLCJyZW1vdmUiLCJ0ZW1wIiwic2xpY2UiLCJzcGxpY2UiLCJqb2luX3dyYXAiLCJwcmVmaXgiLCJzdWZmaXgiLCJqb2luIiwiZnJvbUNhbWVsQ2FzZSIsImZyb20iLCJ0byIsInRvQ2FtZWxDYXNlIiwiY29tcGFyZSIsImxlZnQiLCJkZWxpbSIsInBvcyIsInJsZWZ0IiwicnJpZ2h0IiwibHRyaW0iLCJydHJpbSIsImVuZHNfd2l0aCIsImVuZHMiLCJ4biIsImJlZ2luc2kiLCJzdHJpbmciLCJsZW4iLCJiZWdpbnMiLCJzdHJfcmVwbGFjZSIsIk1hdGgiLCJtaW4iLCJ0ciIsInNlbGYiLCJjYXNlX2luc2Vuc2l0aXZlIiwiY2hhbmdlX2tleV9jYXNlIiwidG9fYXJyYXkiLCJjaGFyQXQiLCJ1bnF1b3RlIiwicSIsInRvVXBwZXJDYXNlIiwidG9faW50ZWdlciIsInRvX2Zsb2F0IiwicGFyc2VGbG9hdCIsInRvX3N0cmluZyIsImVtcHR5IiwiWk9iamVjdCIsIm1lIiwibmV3byIsInNpZ24iLCJhamF4X2Zvcm0iLCIkZm9ybSIsInRhcmdldCIsIiR0YXJnZXQiLCJlcXVhbGhlaWdodCIsInNlbGVjdG9yIiwiaCIsIm1heCIsImhlaWdodCIsImluaXRlZCIsInJlYWR5Iiwib24iLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUE7Ozs7O0FBS0EsSUFBSUEsSUFBSUMsUUFBUSxRQUFSLENBQVI7QUFDQSxJQUFJQyxPQUFPRCxRQUFRLFFBQVIsQ0FBWDs7QUFFQSxJQUFJRSxPQUFPLEVBQVg7QUFDQSxJQUFJQyxRQUFRLEVBQVo7QUFDQSxJQUFJQyxJQUFJQyxPQUFPQyxNQUFQLElBQWlCLEVBQXpCO0FBQ0EsSUFBSUMsSUFBSUgsRUFBRUksUUFBRixJQUFjLEVBQXRCO0FBQ0EsSUFBSUMsSUFBSUwsRUFBRU0sUUFBRixJQUFjLEVBQXRCOztBQUVBLFNBQVNDLE9BQVQsQ0FBaUJDLENBQWpCLEVBQW9CO0FBQ25CLEtBQUlBLE1BQU0sSUFBVixFQUFnQjtBQUNmLFNBQU8sTUFBUDtBQUNBO0FBQ0QsUUFBT0MsT0FBT0MsU0FBUCxDQUFpQkMsUUFBakIsQ0FBMEJDLElBQTFCLENBQStCSixDQUEvQixFQUFrQ0ssS0FBbEMsQ0FBd0MsR0FBeEMsRUFBNkMsQ0FBN0MsRUFBZ0RBLEtBQWhELENBQXNELEdBQXRELEVBQTJELENB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QUEyQkYsQ0FBM0IsQ0FBSjtBQUNBLEdBRkQ7QUFHQW5PLElBQUVrTyxRQUFGLEVBQVlsTyxFQUFFLElBQUYsQ0FBWixFQUFxQjRDLElBQXJCLENBQTBCLFlBQVc7QUFDcEM1QyxLQUFFLElBQUYsRUFBUXFPLE1BQVIsQ0FBZUYsSUFBSSxJQUFuQjtBQUNBLEdBRkQ7QUFHQSxFQVJEO0FBU0EsQ0FWRDs7QUFZQWhPLEtBQUttTyxNQUFMLEdBQWMsSUFBZDs7QUFFQXRPLEVBQUVTLFFBQUYsRUFBWThOLEtBQVosQ0FBa0IsWUFBVztBQUM1QnBPLE1BQUtxRCxJQUFMLENBQVUsaUJBQVY7QUFDQSxDQUZEO0FBR0F4RCxFQUFFTyxNQUFGLEVBQVVpTyxFQUFWLENBQWEsTUFBYixFQUFxQixZQUFXO0FBQy9Cck8sTUFBS3FELElBQUwsQ0FBVSxjQUFWO0FBQ0EsQ0FGRDs7QUFJQWlMLE9BQU9DLE9BQVAsR0FBaUJ2TyxJQUFqQiIsImZpbGUiOiJaZXNrLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqICRJZDogWmVzay5qcyA0MjI2IDIwMTYtMTEtMzAgMDM6NTM6MjBaIGtlbnQgJFxuICpcbiAqIENvcHlyaWdodCAoQykgMjAxNyBNYXJrZXQgQWN1bWVuLCBJbmMuIEFsbCByaWdodHMgcmVzZXJ2ZWRcbiAqL1xudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcbmxldCBIVE1MID0gcmVxdWlyZSgnLi9IVE1MJyk7XG5cbnZhciBaZXNrID0ge307XG52YXIgaG9va3MgPSB7fTtcbnZhciBXID0gZ2xvYmFsLndpbmRvdyB8fCB7fTtcbnZhciBkID0gVy5kb2N1bWVudCB8fCB7fTtcbnZhciBMID0gVy5sb2NhdGlvbiB8fCB7fTtcblxuZnVuY3Rpb24gZ2V0dHlwZSh4KSB7XG5cdGlmICh4ID09PSBudWxsKSB7XG5cdFx0cmV0dXJuICdudWxsJztcblx0fVxuXHRyZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHgpLnNwbGl0KCcgJylbMV0uc3BsaXQoJ10nKVswXS50b0xvd2VyQ2FzZSgpO1xufVxuXG5mdW5jdGlvbiBhdmFsdWUob2JqLCBpLCBkZWYpIHtcblx0aWYgKGRlZiA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0ZGVmID0gbnVsbDtcblx0fVxuXHRpZiAodHlwZW9mIG9iaiA9PT0gXCJvYmplY3RcIikge1xuXHRcdGlmICh0eXBlb2Ygb2JqW2ldICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cdFx0XHRyZXR1cm4gb2JqW2ldO1xuXHRcdH1cblx0XHRyZXR1cm4gZGVmO1xuXHR9XG5cdHJldHVybiBkZWY7XG59XG5aZXNrLmF2YWx1ZSA9IGF2YWx1ZTtcblxuZnVuY3Rpb24gaXNfYm9vbChhKSB7XG5cdHJldHVybiBnZXR0eXBlKGEpID09PSAnYm9vbGVhbic7XG59XG5mdW5jdGlvbiBpc19udW1lcmljKGEpIHtcblx0cmV0dXJuIGdldHR5cGUoYSkgPT09IFwibnVtYmVyXCI7XG59XG5mdW5jdGlvbiBpc19zdHJpbmcoYSkge1xuXHRyZXR1cm4gZ2V0dHlwZShhKSA9PT0gXCJzdHJpbmdcIjtcbn1cbmZ1bmN0aW9uIGlzX2FycmF5KGEpIHtcblx0cmV0dXJuIGdldHR5cGUoYSkgPT09ICdhcnJheSc7XG59XG5mdW5jdGlvbiBpc19vYmplY3QoYSkge1xuXHRyZXR1cm4gZ2V0dHlwZShhKSA9PT0gJ29iamVjdCc7XG59XG5mdW5jdGlvbiBpc19pbnRlZ2VyKGEpIHtcblx0cmV0dXJuIGlzX251bWVyaWMoYSkgJiYgcGFyc2VJbnQoYSwgMTApID09PSBhO1xufVxuZnVuY3Rpb24gaXNfZnVuY3Rpb24oYSkge1xuXHRyZXR1cm4gZ2V0dHlwZShhKSA9PT0gXCJmdW5jdGlvblwiO1xufVxuZnVuY3Rpb24gaXNfZmxvYXQoYSkge1xuXHRyZXR1cm4gdHlwZW9mIGEgPT09IFwibnVtYmVyXCIgJiYgcGFyc2VJbnQoYSwgMTApICE9PSBhO1xufVxuZnVuY3Rpb24gaXNfdXJsKHgpIHtcblx0cmV0dXJuICgvXmh0dHA6XFwvXFwvLit8Xmh0dHBzOlxcL1xcLy4rfF5tYWlsdG86LitALit8XmZ0cDpcXC9cXC8uK3xeZmlsZTpcXC9cXC8uK3xebmV3czpcXC9cXC8uKy8pLmV4ZWMoeC50b0xvd2VyQ2FzZSgpLnRyaW0oKSk7XG59XG5cblplc2suZmxpcCA9IGZ1bmN0aW9uIChvYmplY3QpIHtcblx0dmFyIGksIHJlc3VsdCA9IHt9O1xuXHRmb3IgKGkgaW4gb2JqZWN0KSB7XG5cdFx0aWYgKG9iamVjdC5oYXNPd25Qcm9wZXJ0eShpKSkge1xuXHRcdFx0cmVzdWx0W1N0cmluZyhvYmplY3RbaV0pXSA9IGk7XG5cdFx0fVxuXHR9XG5cdHJldHVybiByZXN1bHQ7XG59XG5cbi8qIEtlcm5lbCAqL1xuXG5aZXNrLmlzX2RhdGUgPSBmdW5jdGlvbihhKSB7XG5cdHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYSkgPT09ICdbb2JqZWN0IERhdGVdJztcbn07XG5cblxuWmVzay5nZXR0eXBlID0gZ2V0dHlwZTtcblxuWmVzay5lYWNoID0gWmVzay5lYWNoO1xuXG5aZXNrLmlzX2FycmF5ID0gaXNfYXJyYXk7XG5aZXNrLmlzX29iamVjdCA9IGlzX29iamVjdDtcblplc2suaXNfYXJyYXkgPSBpc19hcnJheTtcblplc2suaXNfbnVtYmVyID0gaXNfbnVtZXJpYztcblplc2suaXNfbnVtZXJpYyA9IGlzX251bWVyaWM7XG5aZXNrLmlzX2Jvb2wgPSBpc19ib29sO1xuWmVzay5pc19zdHJpbmcgPSBpc19zdHJpbmc7XG5aZXNrLmlzX2ludGVnZXIgPSBpc19pbnRlZ2VyO1xuWmVzay5pc19mdW5jdGlvbiA9IGlzX2Z1bmN0aW9uO1xuWmVzay5pc19mbG9hdCA9IGlzX2Zsb2F0O1xuWmVzay5pc191cmwgPSBpc191cmw7XG5cbmZ1bmN0aW9uIG9iamVjdF9wYXRoKG9iamVjdCwgcGF0aCwgZGVmKSB7XG5cdHZhciBjdXJyID0gb2JqZWN0LCBrO1xuXHRwYXRoID0gdG9fbGlzdChwYXRoLCBbXSwgXCIuXCIpO1xuXHRmb3IgKGsgPSAwOyBrIDwgcGF0aC5sZW5ndGg7IGsrKykge1xuXHRcdGlmIChrID09PSBwYXRoLmxlbmd0aCAtIDEpIHtcblx0XHRcdHJldHVybiBhdmFsdWUoY3VyciwgcGF0aFtrXSwgZGVmKTtcblx0XHR9XG5cdFx0Y3VyciA9IGF2YWx1ZShjdXJyLCBwYXRoW2tdKTtcblx0XHRpZiAoY3VyciA9PT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuIGRlZjtcblx0XHR9XG5cdFx0aWYgKCFpc19vYmplY3QoY3VycikpIHtcblx0XHRcdHJldHVybiBkZWY7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBjdXJyO1xufVxuXG5mdW5jdGlvbiBvYmplY3Rfc2V0X3BhdGgob2JqZWN0LCBwYXRoLCB2YWx1ZSkge1xuXHR2YXIgY3VyciA9IG9iamVjdCwgaywgc2VnO1xuXHRwYXRoID0gdG9fbGlzdChwYXRoLCBbXSwgXCIuXCIpO1xuXHRmb3IgKGsgPSAwOyBrIDwgcGF0aC5sZW5ndGg7IGsrKykge1xuXHRcdHNlZyA9IHBhdGhba107XG5cdFx0aWYgKHR5cGVvZiBjdXJyW3NlZ10gPT09IFwib2JqZWN0XCIpIHtcblx0XHRcdGN1cnIgPSBjdXJyW3NlZ107XG5cdFx0fSBlbHNlIGlmIChrID09PSBwYXRoLmxlbmd0aCAtIDEpIHtcblx0XHRcdGN1cnJbc2VnXSA9IHZhbHVlO1xuXHRcdFx0YnJlYWs7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGN1cnJbc2VnXSA9IHt9O1xuXHRcdFx0Y3VyciA9IGN1cnJbc2VnXTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIG9iamVjdDtcbn1cblxuWmVzay5vYmplY3RfcGF0aCA9IG9iamVjdF9wYXRoO1xuWmVzay5vYmplY3Rfc2V0X3BhdGggPSBvYmplY3Rfc2V0X3BhdGg7XG5cbmZ1bmN0aW9uIGhvb2tfcGF0aChob29rKSB7XG5cdGhvb2sgPSBTdHJpbmcoaG9vaykudG9Mb3dlckNhc2UoKTtcblx0aG9vayA9IHRvX2xpc3QoaG9vaywgW10sIFwiOjpcIik7XG5cdGlmIChob29rLmxlbmd0aCA9PT0gMSkge1xuXHRcdGhvb2sucHVzaChcIipcIik7XG5cdH1cblx0cmV0dXJuIGhvb2s7XG59XG5cbk9iamVjdC5hc3NpZ24oWmVzaywge1xuICAgIGQ6IGQsXG4gICAgc2V0dGluZ3M6IHt9LCAvLyBQbGFjZSBtb2R1bGUgZGF0YSBoZXJlIVxuICAgIGhvb2tzOiBob29rcywgLy8gTW9kdWxlIGhvb2tzIGdvIGhlcmUgLSB1c2UgYWRkX2hvb2sgYW5kIGhvb2sgdG8gdXNlXG4gICAgdzogVyxcbiAgICB1cmxfcGFydHM6IHtcbiAgICAgICAgcGF0aDogTC5wYXRobmFtZSxcbiAgICAgICAgaG9zdDogTC5ob3N0LFxuICAgICAgICBxdWVyeTogTC5zZWFyY2gsXG4gICAgICAgIHNjaGVtZTogTC5wcm90b2NvbCxcbiAgICAgICAgdXJsOiBkLlVSTCxcbiAgICAgICAgdXJpOiBMLnBhdGhuYW1lICsgTC5zZWFyY2hcbiAgICB9LFxuICAgIHBhZ2Vfc2NyaXB0czogbnVsbCxcbiAgICBxdWVyeV9nZXQ6IGZ1bmN0aW9uKHYsIGRlZikge1xuXHQgICAgZGVmID0gZGVmIHx8IG51bGw7XG5cdCAgICB2YXIgcGFpciwgaSwgdSA9IGQuVVJMLnRvU3RyaW5nKCkucmlnaHQoXCI/XCIsIG51bGwpO1xuXHQgICAgaWYgKCF1KSB7XG5cdFx0ICAgIHJldHVybiBkZWY7XG5cdCAgICB9XG5cdCAgICB1ID0gdS5zcGxpdChcIiZcIik7XG5cdCAgICBmb3IgKGkgPSAwOyBpIDwgdS5sZW5ndGg7IGkrKykge1xuXHRcdCAgICBwYWlyID0gdVtpXS5zcGxpdChcIj1cIiwgMik7XG5cdFx0ICAgIGlmIChwYWlyWzBdID09PSB2KSB7XG5cdFx0XHQgICAgcmV0dXJuIHBhaXJbMV0gfHwgcGFpclswXTtcblx0XHQgICAgfVxuXHQgICAgfVxuXHQgICAgcmV0dXJuIGRlZjtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIEBwYXJhbSBuYW1lIHN0cmluZyBOYW1lIG9mIGNvb2tpZSB0byBzZXQvZ2V0XG4gICAgICogQHBhcmFtIHZhbHVlIHN0cmluZyBWYWx1ZSBvZiBjb29raWUgdG8gc2V0XG4gICAgICogQHBhcmFtIG9wdGlvbnMgb2JqZWN0IEV4dHJhIG9wdGlvbnM6IHR0bDogaW50ZWdlciAoc2Vjb25kcyksIGRvbWFpbjogc3RyaW5nXG4gICAgICovXG4gICAgY29va2llOiBmdW5jdGlvbiAobmFtZSwgdmFsdWUsIG9wdGlvbnMpIHtcbiAgICBcdHZhclxuICAgIFx0Z2V0Y29va2llID0gZnVuY3Rpb24gKG4pXHR7XG4gICAgXHRcdHZhciBjID0gZC5jb29raWU7XG4gICAgXHRcdHZhciBzID0gYy5sYXN0SW5kZXhPZihuKyc9Jyk7XG4gICAgXHRcdGlmIChzIDwgMCkge1xuICAgIFx0XHRcdHJldHVybiBudWxsO1xuICAgIFx0XHR9XG4gICAgXHRcdHMgKz0gbi5sZW5ndGgrMTtcbiAgICBcdFx0dmFyIGUgPSBjLmluZGV4T2YoJzsnLCBzKTtcbiAgICBcdFx0aWYgKGUgPCAwKSB7XG4gICAgXHRcdFx0ZSA9IGMubGVuZ3RoO1xuICAgIFx0XHR9XG4gICAgXHRcdHJldHVybiBXLnVuZXNjYXBlKGMuc3Vic3RyaW5nKHMsZSkpO1xuICAgIFx0fSxcbiAgICBcdHNldGNvb2tpZSA9IGZ1bmN0aW9uIChuLCB2LCBvcHRpb25zKSB7XG4gICAgXHRcdHZhciBhID0gbmV3IERhdGUoKSwgdCA9IHBhcnNlSW50KG9wdGlvbnMudHRsLCAxMCkgfHwgLTEsIG0gPSBvcHRpb25zLmRvbWFpbiB8fCBudWxsO1xuICAgIFx0XHRpZiAodCA8PSAwKSB7XG4gICAgXHRcdFx0YS5zZXRGdWxsWWVhcigyMDMwKTtcbiAgICBcdFx0fSBlbHNlIGlmICh0ID4gMCkge1xuICAgIFx0XHRcdGEuc2V0VGltZShhLmdldFRpbWUoKSArIHQgKiAxMDAwKTtcbiAgICBcdFx0fVxuICAgIFx0XHRkLmNvb2tpZSA9IG4gKyBcIj1cIiArIFcuZXNjYXBlKHYpICsgJzsgcGF0aD0vOyBleHBpcmVzPScgKyBhLnRvR01UU3RyaW5nKCkgKyAobSA/ICc7IGRvbWFpbj0nICsgbSA6ICcnKTtcbiAgICBcdFx0cmV0dXJuIHY7XG4gICAgXHR9LFxuICAgIFx0ZGVsZXRlX2Nvb2tpZSA9IGZ1bmN0aW9uIChuYW1lLCBkb20pIHtcbiAgICBcdFx0dmFyIFxuICAgIFx0XHRub3cgPSBuZXcgRGF0ZSgpLCBcbiAgICBcdFx0ZSA9IG5ldyBEYXRlKG5vdy5nZXRUaW1lKCkgLSA4NjQwMCk7XG4gICAgXHRcdGQuY29va2llID0gbmFtZSArICc9OyBwYXRoPS87IGV4cGlyZXM9JyArIGUudG9HTVRTdHJpbmcoKSArIChkb20gPyAnOyBkb21haW49JyArIGRvbSA6ICcnKTtcbiAgICBcdH07XG4gICAgXHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblx0XHRpZiAodmFsdWUgPT09IG51bGwpIHtcblx0XHRcdGRlbGV0ZV9jb29raWUobmFtZSwgb3B0aW9ucy5kb20gfHwgbnVsbCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHJldHVybiBhcmd1bWVudHMubGVuZ3RoID09PSAxID8gZ2V0Y29va2llKG5hbWUpIDogc2V0Y29va2llKG5hbWUsIHZhbHVlLCBvcHRpb25zKTtcbiAgICB9LFxuICAgIGNzczogZnVuY3Rpb24ocCkge1xuXHQgICAgdmFyIGNzcyA9IGQuY3JlYXRlRWxlbWVudCgnbGluaycpO1xuXHQgICAgY3NzLnJlbCA9IFwic3R5bGVzaGVldFwiO1xuXHQgICAgY3NzLmhyZWYgPSBwO1xuXHQgICAgY3NzLm1lZGlhID0gYXJndW1lbnRzWzFdIHx8IFwiYWxsXCI7XG5cdCAgICBkLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0uYXBwZW5kQ2hpbGQoY3NzKTtcbiAgICB9LFxuICAgIGxvZzogZnVuY3Rpb24oKSB7XG5cdCAgICBpZiAoVy5jb25zb2xlICYmIFcuY29uc29sZS5sb2cpIHtcblx0XHQgICAgVy5jb25zb2xlLmxvZyhhcmd1bWVudHMpO1xuXHQgICAgfVxuICAgIH0sXG4gICAgYWRkX2hvb2s6IGZ1bmN0aW9uKGhvb2ssIGZ1bikge1xuXHQgICAgdmFyIHBhdGggPSBob29rX3BhdGgoaG9vayksIGN1cnIgPSBvYmplY3RfcGF0aChob29rcywgcGF0aCk7XG5cdCAgICBpZiAoY3Vycikge1xuXHRcdCAgICBjdXJyLnB1c2goZnVuKTtcblx0ICAgIH0gZWxzZSB7XG5cdFx0ICAgIGN1cnIgPSBbZnVuXTtcblx0XHQgICAgb2JqZWN0X3NldF9wYXRoKGhvb2tzLCBwYXRoLCBjdXJyKTtcblx0ICAgIH1cbiAgICB9LFxuICAgIGhhc19ob29rOiBmdW5jdGlvbihob29rKSB7XG5cdCAgICB2YXIgZnVuY3MgPSBvYmplY3RfcGF0aChob29rcywgaG9va19wYXRoKGhvb2spLCBudWxsKTtcblx0ICAgIHJldHVybiBmdW5jcyA/IHRydWUgOiBmYWxzZTtcbiAgICB9LFxuICAgIGhvb2s6IGZ1bmN0aW9uKGhvb2spIHtcblx0ICAgIHZhciBwYXRoID0gaG9va19wYXRoKGhvb2spLCBhcmdzID0gWmVzay5jbG9uZShhcmd1bWVudHMpLCBmdW5jcyA9IG9iamVjdF9wYXRoKGhvb2tzLCBwYXRoLCBudWxsKSwgcmVzdWx0cyA9IFtdLCBpO1xuXHQgICAgaWYgKCFmdW5jcykge1xuXHRcdCAgICByZXR1cm4gcmVzdWx0cztcblx0ICAgIH1cblx0ICAgIGlmIChhcmdzLmxlbmd0aCA+IDEpIHtcblx0XHQgICAgYXJncy5zaGlmdCgpO1xuXHQgICAgfSBlbHNlIHtcblx0XHQgICAgYXJncyA9IFtdO1xuXHQgICAgfVxuXG5cdCAgICBmb3IgKGkgPSAwOyBpIDwgZnVuY3MubGVuZ3RoOyBpKyspIHtcblx0XHQgICAgcmVzdWx0cy5wdXNoKGZ1bmNzW2ldLmFwcGx5KG51bGwsIGFyZ3MpKTtcblx0ICAgIH1cblx0ICAgIHJldHVybiByZXN1bHRzO1xuICAgIH0sXG4gICAgZ2V0X3BhdGg6IGZ1bmN0aW9uKHBhdGgsIGRlZikge1xuXHQgICAgcmV0dXJuIG9iamVjdF9wYXRoKFplc2suc2V0dGluZ3MsIHBhdGgsIGRlZik7XG4gICAgfSxcbiAgICBzZXRfcGF0aDogZnVuY3Rpb24ocGF0aCwgdmFsdWUpIHtcblx0ICAgIHJldHVybiBvYmplY3Rfc2V0X3BhdGgoWmVzay5zZXR0aW5ncywgcGF0aCwgdmFsdWUpO1xuICAgIH0sXG4gICAgZ2V0OiBmdW5jdGlvbihuKSB7XG5cdCAgICB2YXIgYSA9IGFyZ3VtZW50cztcblx0ICAgIHJldHVybiBhdmFsdWUoWmVzay5zZXR0aW5ncywgbiwgYS5sZW5ndGggPiAxID8gYVsxXSA6IG51bGwpO1xuICAgIH0sXG4gICAgZ2V0YjogZnVuY3Rpb24obikge1xuXHQgICAgdmFyIGEgPSBhcmd1bWVudHMsIGQgPSBhLmxlbmd0aCA+IDEgPyBhWzFdIDogZmFsc2U7XG5cdCAgICByZXR1cm4gdG9fYm9vbChaZXNrLmdldChuLCBkKSk7XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uKG4sIHYpIHtcblx0ICAgIHZhciBhID0gYXJndW1lbnRzLCBvdmVyd3JpdGUgPSBhLmxlbmd0aCA+IDIgPyB0b19ib29sKGFbMl0pIDogdHJ1ZTtcblx0ICAgIGlmICghb3ZlcndyaXRlICYmIHR5cGVvZiBaZXNrLnNldHRpbmdzW25dICE9PSAndW5kZWZpbmVkJykge1xuXHRcdCAgICByZXR1cm4gWmVzay5zZXR0aW5nc1tuXTtcblx0ICAgIH1cblx0ICAgIFplc2suc2V0dGluZ3Nbbl0gPSB2O1xuXHQgICAgcmV0dXJuIHY7XG4gICAgfSxcbiAgICBpbmhlcml0OiBmdW5jdGlvbih0aGVfY2xhc3MsIHN1cGVyX2NsYXNzLCBwcm90b3R5cGUpIHtcblx0ICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTExNDAyNC9jb25zdHJ1Y3RvcnMtaW4tamF2YXNjcmlwdC1vYmplY3RzXG5cdCAgICB2YXIgbWV0aG9kLCBDb25zdHJ1Y3QgPSBmdW5jdGlvbigpIHtcblx0ICAgIH07XG5cdCAgICBzdXBlcl9jbGFzcyA9IHN1cGVyX2NsYXNzIHx8IE9iamVjdDtcblx0ICAgIENvbnN0cnVjdC5wcm90b3R5cGUgPSBzdXBlcl9jbGFzcy5wcm90b3R5cGU7XG5cdCAgICB0aGVfY2xhc3MucHJvdG90eXBlID0gbmV3IENvbnN0cnVjdCgpO1xuXHQgICAgdGhlX2NsYXNzLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IHRoZV9jbGFzcztcblx0ICAgIHRoZV9jbGFzc1snc3VwZXInXSA9IHN1cGVyX2NsYXNzO1xuXHQgICAgaWYgKHByb3RvdHlwZSBpbnN0YW5jZW9mIE9iamVjdCkge1xuXHRcdCAgICBmb3IgKG1ldGhvZCBpbiBwcm90b3R5cGUpIHtcblx0XHRcdCAgICBpZiAocHJvdG90eXBlLmhhc093blByb3BlcnR5KG1ldGhvZCkpIHtcblx0XHRcdFx0ICAgIGlmICghdGhlX2NsYXNzLnByb3RvdHlwZVttZXRob2RdKSB7XG5cdFx0XHRcdFx0ICAgIHRoZV9jbGFzcy5wcm90b3R5cGVbbWV0aG9kXSA9IHByb3RvdHlwZVttZXRob2RdO1xuXHRcdFx0XHQgICAgfVxuXHRcdFx0ICAgIH1cblx0XHQgICAgfVxuXHQgICAgfVxuXHQgICAgdGhlX2NsYXNzLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuXHRcdCAgICByZXR1cm4gWmVzay5jbG9uZSh0aGlzKTtcblx0ICAgIH07XG5cdCAgICByZXR1cm4gdGhlX2NsYXNzO1xuICAgIH0sXG4gICAgLyoqXG5cdCAqIEl0ZXJhdGUgb3ZlciBhbiBvYmplY3QsIGNhbGxpbmcgYSBmdW5jdGlvbiBvbmNlIHBlciBlbGVtZW50XG5cdCAqIFxuXHQgKiBAcGFyYW0gb2JqZWN0fGFycmF5XG5cdCAqICAgICAgICAgICAgeFxuXHQgKiBAcGFyYW0gZnVuY3Rpb25cblx0ICogICAgICAgICAgICBmblxuXHQgKiBAcGFyYW0gYm9vbGVhblxuXHQgKiAgICAgICAgICAgIHRlcm1fZmFsc2UgU2V0IHRvIHRydWUgdG8gdGVybWluYXRlIHdoZW4gZnVuY3Rpb24gcmV0dXJuc1xuXHQgKiAgICAgICAgICAgIGEgZmFsc2UtaXNoIHZhbHVlIGFzIG9wcG9zZWQgdG8gYSB0cnVlLWlzaCB2YWx1ZVxuXHQgKi9cbiAgICBlYWNoOiBmdW5jdGlvbih4LCBmbiwgdGVybV9mYWxzZSkge1xuXHQgICAgdmFyIGksIHI7XG5cdCAgICB0ZXJtX2ZhbHNlID0gdG9fYm9vbCh0ZXJtX2ZhbHNlKTtcblx0ICAgIGlmIChpc19hcnJheSh4KSkge1xuXHRcdCAgICBmb3IgKGkgPSAwOyBpIDwgeC5sZW5ndGg7IGkrKykge1xuXHRcdFx0ICAgIHIgPSBmbi5jYWxsKHhbaV0sIGksIHhbaV0pO1xuXHRcdFx0ICAgIGlmICh0ZXJtX2ZhbHNlKSB7XG5cdFx0XHRcdCAgICBpZiAoIXIpIHtcblx0XHRcdFx0XHQgICAgcmV0dXJuIHI7XG5cdFx0XHRcdCAgICB9XG5cdFx0XHQgICAgfSBlbHNlIGlmIChyKSB7XG5cdFx0XHRcdCAgICByZXR1cm4gcjtcblx0XHRcdCAgICB9XG5cdFx0ICAgIH1cblx0ICAgIH0gZWxzZSBpZiAoaXNfb2JqZWN0KHgpKSB7XG5cdFx0ICAgIGZvciAoaSBpbiB4KSB7XG5cdFx0XHQgICAgaWYgKHguaGFzT3duUHJvcGVydHkoaSkpIHtcblx0XHRcdFx0ICAgIHIgPSBmbi5jYWxsKHhbaV0sIGksIHhbaV0pO1xuXHRcdFx0XHQgICAgaWYgKHRlcm1fZmFsc2UpIHtcblx0XHRcdFx0XHQgICAgaWYgKCFyKSB7XG5cdFx0XHRcdFx0XHQgICAgcmV0dXJuIHI7XG5cdFx0XHRcdFx0ICAgIH1cblx0XHRcdFx0ICAgIH0gZWxzZSBpZiAocikge1xuXHRcdFx0XHRcdCAgICByZXR1cm4gcjtcblx0XHRcdFx0ICAgIH1cblx0XHRcdCAgICB9XG5cdFx0ICAgIH1cblx0ICAgIH0gZWxzZSB7XG5cdFx0ICAgIHJldHVybiBmbi5jYWxsKHgsIDAsIHgpO1xuXHQgICAgfVxuICAgIH0sXG4gICAgdHBsOiBmdW5jdGlvbihtaXhlZCwgbWFwKSB7XG5cdCAgICByZXR1cm4gJChtaXhlZCkuaHRtbCgpLm1hcChtYXAsIGZhbHNlKTtcbiAgICB9LFxuICAgIHNjcmlwdF9zcmNfbm9ybWFsaXplOiBmdW5jdGlvbihzcmMpIHtcblx0ICAgIHZhciBtYXRjaGVzLCBwYXJ0cyA9IFplc2sudXJsX3BhcnRzO1xuXHQgICAgc3JjID0gc3JjLnVucHJlZml4KHBhcnRzLnNjaGVtZSArICc6Ly8nICsgcGFydHMuaG9zdCk7XG5cdCAgICBtYXRjaGVzID0gc3JjLm1hdGNoKC8oLiopXFw/X3Zlcj1bMC05XSskLyk7XG5cdCAgICBpZiAobWF0Y2hlcyAhPT0gbnVsbCkge1xuXHRcdCAgICBzcmMgPSBtYXRjaGVzWzFdO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuIHNyYztcbiAgICB9LFxuICAgIHNjcmlwdHNfaW5pdDogZnVuY3Rpb24oKSB7XG5cdCAgICBaZXNrLnBhZ2Vfc2NyaXB0cyA9IHt9O1xuXHQgICAgJCgnc2NyaXB0W3R5cGU9XCJ0ZXh0L2phdmFzY3JpcHRcIl1bc3JjXScpLmVhY2goZnVuY3Rpb24oKSB7XG5cdFx0ICAgIFplc2suc2NyaXB0X2FkZCgkKHRoaXMpLmF0dHIoJ3NyYycpKTtcblx0ICAgIH0pO1xuXG4gICAgfSxcbiAgICBzY3JpcHRfYWRkOiBmdW5jdGlvbihzcmMpIHtcblx0ICAgIGlmIChaZXNrLnBhZ2Vfc2NyaXB0cyA9PT0gbnVsbCkge1xuXHRcdCAgICBaZXNrLnNjcmlwdHNfaW5pdCgpO1xuXHQgICAgfVxuXHQgICAgWmVzay5wYWdlX3NjcmlwdHNbc3JjXSA9IHRydWU7XG5cdCAgICBaZXNrLnBhZ2Vfc2NyaXB0c1taZXNrLnNjcmlwdF9zcmNfbm9ybWFsaXplKHNyYyldID0gdHJ1ZTtcbiAgICB9LFxuICAgIHNjcmlwdHM6IGZ1bmN0aW9uKCkge1xuXHQgICAgaWYgKFplc2sucGFnZV9zY3JpcHRzID09PSBudWxsKSB7XG5cdFx0ICAgIFplc2suc2NyaXB0c19pbml0KCk7XG5cdCAgICB9XG5cdCAgICByZXR1cm4gWmVzay5wYWdlX3NjcmlwdHM7XG4gICAgfSxcbiAgICBzY3JpcHRzX2NhY2hlZDogZnVuY3Rpb24oc3Jjcykge1xuXHQgICAgWmVzay5lYWNoKHNyY3MsIGZ1bmN0aW9uKCkge1xuXHRcdCAgICBaZXNrLnNjcmlwdF9hZGQodGhpcyk7XG5cdCAgICB9KTtcbiAgICB9LFxuICAgIHNjcmlwdF9sb2FkZWQ6IGZ1bmN0aW9uKHNyYykge1xuXHQgICAgdmFyIHNjcmlwdHMgPSBaZXNrLnNjcmlwdHMoKSwgcmVzdWx0ID0gc2NyaXB0c1tzcmNdIHx8IHNjcmlwdHNbWmVzay5zY3JpcHRfc3JjX25vcm1hbGl6ZShzcmMpXSB8fCBmYWxzZTtcblx0ICAgIC8vIFplc2subG9nKFwiWmVzay5zY3JpcHRfbG9hZGVkKFwiICsgc3JjICsgXCIpID0gXCIgKyAocmVzdWx0ID8gXCJ0cnVlXCI6XG5cdCAgICAvLyBcImZhbHNlXCIpKTtcblx0ICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcbiAgICBzdHlsZXNoZWV0X2xvYWRlZDogZnVuY3Rpb24oaHJlZiwgbWVkaWEpIHtcblx0ICAgIHJldHVybiAkKCdsaW5rW3JlbD1cInN0eWxlc2hlZXRcIl1baHJlZj1cIicgKyBocmVmICsgJ1wiXVttZWRpYT1cIicgKyBtZWRpYSArICdcIicpLmxlbmd0aCA+IDA7XG4gICAgfSxcbiAgICBtZXNzYWdlOiBmdW5jdGlvbihtZXNzYWdlLCBvcHRpb25zKSB7XG5cdCAgICBvcHRpb25zID0gaXNfc3RyaW5nKG9wdGlvbnMpID8ge1xuXHRcdCAgICBsZXZlbDogb3B0aW9uc1xuXHQgICAgfSA6IG9wdGlvbnM7XG5cdCAgICBaZXNrLmhvb2soJ21lc3NhZ2UnLCBtZXNzYWdlLCBvcHRpb25zKTtcblx0ICAgIFplc2subG9nKG1lc3NhZ2UsIG9wdGlvbnMpO1xuICAgIH0sXG4gICAgcmVnZXhwX3F1b3RlOiBmdW5jdGlvbihzdHIsIGRlbGltaXRlcikge1xuXHQgICAgcmV0dXJuIFN0cmluZyhzdHIpLnJlcGxhY2UobmV3IFJlZ0V4cCgnWy5cXFxcXFxcXCsqP1xcXFxbXFxcXF5cXFxcXSQoKXt9PSE8Pnw6XFxcXCcgKyAoZGVsaW1pdGVyIHx8ICcnKSArICctXScsICdnJyksICdcXFxcJCYnKTtcbiAgICB9XG59KTtcblxuWmVzay5jbG9uZSA9IGZ1bmN0aW9uKG9iamVjdCkge1xuXHR2YXIgY2xvbmUsIHByb3AsIENvbnN0cnVjdG9yO1xuXHRpZiAob2JqZWN0ID09PSBudWxsKSB7XG5cdFx0cmV0dXJuIG9iamVjdDtcblx0fVxuXHRpZiAoaXNfZnVuY3Rpb24ob2JqZWN0KSkge1xuXHRcdHJldHVybiBvYmplY3Q7XG5cdH1cblx0aWYgKGlzX2FycmF5KG9iamVjdCkgfHwgWmVzay5nZXR0eXBlKG9iamVjdCkgPT09IFwiYXJndW1lbnRzXCIpIHtcblx0XHRjbG9uZSA9IFtdO1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgb2JqZWN0Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRjbG9uZS5wdXNoKFplc2suY2xvbmUob2JqZWN0W2ldKSk7XG5cdFx0fVxuXHRcdHJldHVybiBjbG9uZTtcblx0fVxuXHRpZiAoIWlzX29iamVjdChvYmplY3QpKSB7XG5cdFx0cmV0dXJuIG9iamVjdDtcblx0fVxuXHRDb25zdHJ1Y3RvciA9IG9iamVjdC5jb25zdHJ1Y3Rvcjtcblx0c3dpdGNoIChDb25zdHJ1Y3Rvcikge1xuXHRcdGNhc2UgUmVnRXhwOlxuXHRcdFx0Y2xvbmUgPSBuZXcgQ29uc3RydWN0b3Iob2JqZWN0LnNvdXJjZSwgXCJnXCIuc3Vic3RyKDAsIE51bWJlcihvYmplY3QuZ2xvYmFsKSkgKyBcImlcIi5zdWJzdHIoMCwgTnVtYmVyKG9iamVjdC5pZ25vcmVDYXNlKSkgKyBcIm1cIi5zdWJzdHIoMCwgTnVtYmVyKG9iamVjdC5tdWx0aWxpbmUpKSk7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlIERhdGU6XG5cdFx0XHRjbG9uZSA9IG5ldyBDb25zdHJ1Y3RvcihvYmplY3QuZ2V0VGltZSgpKTtcblx0XHRcdGJyZWFrO1xuXHRcdGRlZmF1bHQ6XG5cdFx0XHQvLyBDYW4gbm90IGNvcHkgdW5rbm93biBvYmplY3RzXG5cdFx0XHRyZXR1cm4gb2JqZWN0O1xuXHR9XG5cdGZvciAocHJvcCBpbiBvYmplY3QpIHtcblx0XHRpZiAob2JqZWN0Lmhhc093blByb3BlcnR5KHByb3ApKSB7XG5cdFx0XHRjbG9uZVtwcm9wXSA9IFplc2suY2xvbmUob2JqZWN0W3Byb3BdKTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIGNsb25lO1xufTtcblxuT2JqZWN0LmFzc2lnbihBcnJheS5wcm90b3R5cGUsIHtcbiAgICBjb250YWluczogZnVuY3Rpb24oeCkge1xuXHQgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG5cdFx0ICAgIGlmICh0aGlzW2ldID09PSB4KSB7XG5cdFx0XHQgICAgcmV0dXJuIHRydWU7XG5cdFx0ICAgIH1cblx0ICAgIH1cblx0ICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuICAgIHJlbW92ZTogZnVuY3Rpb24oeCkge1xuXHQgICAgdmFyIHRlbXAgPSB0aGlzLnNsaWNlKDApO1xuXHQgICAgdGVtcC5zcGxpY2UoeCwgMSk7XG5cdCAgICByZXR1cm4gdGVtcDtcbiAgICB9LFxuICAgIC8qKlxuXHQgKiBKb2luIGVsZW1lbnRzIG9mIGFuIGFycmF5IGJ5IHdyYXBwaW5nIGVhY2ggb25lIHdpdGggYSBwcmVmaXgvc3VmZml4XG5cdCAqIFxuXHQgKiBAcGFyYW0gc3RyaW5nXG5cdCAqICAgICAgICAgICAgcHJlZml4XG5cdCAqIEBwYXJhbSBzdHJpbmdcblx0ICogICAgICAgICAgICBzdWZmaXhcblx0ICogQHJldHVybiBzdHJpbmdcblx0ICovXG4gICAgam9pbl93cmFwOiBmdW5jdGlvbihwcmVmaXgsIHN1ZmZpeCkge1xuXHQgICAgcHJlZml4ID0gU3RyaW5nKHByZWZpeCkgfHwgXCJcIjtcblx0ICAgIHN1ZmZpeCA9IFN0cmluZyhzdWZmaXgpIHx8IFwiXCI7XG5cdCAgICByZXR1cm4gcHJlZml4ICsgdGhpcy5qb2luKHN1ZmZpeCArIHByZWZpeCkgKyBzdWZmaXg7XG4gICAgfVxufSk7XG5cbk9iamVjdC5hc3NpZ24oT2JqZWN0LCB7XG4gICAgZnJvbUNhbWVsQ2FzZTogZnVuY3Rpb24oZnJvbSkge1xuXHQgICAgdmFyIHRvID0ge307XG5cdCAgICBmb3IgKCB2YXIgaSBpbiBmcm9tKSB7XG5cdFx0ICAgIGlmIChmcm9tLmhhc093blByb3BlcnR5KGkpKSB7XG5cdFx0XHQgICAgdG9baS5mcm9tQ2FtZWxDYXNlKCldID0gZnJvbVtpXTtcblx0XHQgICAgfVxuXHQgICAgfVxuXHQgICAgcmV0dXJuIHRvO1xuICAgIH0sXG4gICAgdG9DYW1lbENhc2U6IGZ1bmN0aW9uKGZyb20pIHtcblx0ICAgIHZhciB0byA9IHt9O1xuXHQgICAgZm9yICggdmFyIGkgaW4gdGhpcykge1xuXHRcdCAgICBpZiAoZnJvbS5oYXNPd25Qcm9wZXJ0eShpKSkge1xuXHRcdFx0ICAgIHRvW2kudG9DYW1lbENhc2UoKV0gPSBmcm9tW2ldO1xuXHRcdCAgICB9XG5cdCAgICB9XG5cdCAgICByZXR1cm4gdG87XG4gICAgfVxufSk7XG5cbk9iamVjdC5hc3NpZ24oU3RyaW5nLnByb3RvdHlwZSwge1xuICAgIGNvbXBhcmU6IGZ1bmN0aW9uKGEpIHtcblx0ICAgIHJldHVybiAodGhpcyA8IGEpID8gLTEgOiAodGhpcyA9PT0gYSkgPyAwIDogMTtcbiAgICB9LFxuICAgIGxlZnQ6IGZ1bmN0aW9uKGRlbGltLCBkZWYpIHtcblx0ICAgIHZhciBwb3MgPSB0aGlzLmluZGV4T2YoZGVsaW0pO1xuXHQgICAgcmV0dXJuIChwb3MgPCAwKSA/IGF2YWx1ZShhcmd1bWVudHMsIDEsIGRlZiB8fCB0aGlzKSA6IHRoaXMuc3Vic3RyKDAsIHBvcyk7XG4gICAgfSxcbiAgICBybGVmdDogZnVuY3Rpb24oZGVsaW0sIGRlZikge1xuXHQgICAgdmFyIHBvcyA9IHRoaXMubGFzdEluZGV4T2YoZGVsaW0pO1xuXHQgICAgcmV0dXJuIChwb3MgPCAwKSA/IGF2YWx1ZShhcmd1bWVudHMsIDEsIGRlZiB8fCB0aGlzKSA6IHRoaXMuc3Vic3RyKDAsIHBvcyk7XG4gICAgfSxcbiAgICByaWdodDogZnVuY3Rpb24oZGVsaW0sIGRlZikge1xuXHQgICAgdmFyIHBvcyA9IHRoaXMuaW5kZXhPZihkZWxpbSk7XG5cdCAgICByZXR1cm4gKHBvcyA8IDApID8gYXZhbHVlKGFyZ3VtZW50cywgMSwgZGVmIHx8IHRoaXMpIDogdGhpcy5zdWJzdHIocG9zICsgZGVsaW0ubGVuZ3RoKTtcbiAgICB9LFxuICAgIHJyaWdodDogZnVuY3Rpb24oZGVsaW0sIGRlZikge1xuXHQgICAgdmFyIHBvcyA9IHRoaXMubGFzdEluZGV4T2YoZGVsaW0pO1xuXHQgICAgcmV0dXJuIChwb3MgPCAwKSA/IGF2YWx1ZShhcmd1bWVudHMsIDEsIGRlZiB8fCB0aGlzKSA6IHRoaXMuc3Vic3RyKHBvcyArIGRlbGltLmxlbmd0aCk7XG4gICAgfSxcbiAgICBsdHJpbTogZnVuY3Rpb24oKSB7XG5cdCAgICByZXR1cm4gdGhpcy5yZXBsYWNlKC9eXFxzKy8sICcnKTtcbiAgICB9LFxuICAgIHJ0cmltOiBmdW5jdGlvbigpIHtcblx0ICAgIHJldHVybiB0aGlzLnJlcGxhY2UoL1xccyskLywgJycpO1xuICAgIH0sXG4gICAgdHJpbTogZnVuY3Rpb24oKSB7XG5cdCAgICByZXR1cm4gdGhpcy5yZXBsYWNlKC9eXFxzKy8sICcnKS5yZXBsYWNlKC9cXHMrJC8sICcnKTtcbiAgICB9LFxuICAgIC8qKlxuXHQgKiBAZGVwcmVjYXRlZFxuXHQgKiBAcGFyYW0geFxuXHQgKiAgICAgICAgICAgIFN0cmluZyB0byBsb29rIGF0XG5cdCAqL1xuICAgIGVuZHNfd2l0aDogZnVuY3Rpb24oeCkge1xuXHQgICAgcmV0dXJuIHRoaXMuZW5kcyh4KTtcbiAgICB9LFxuICAgIGVuZHM6IGZ1bmN0aW9uKHgpIHtcblx0ICAgIHZhciB4biA9IHgubGVuZ3RoLCBuID0gdGhpcy5sZW5ndGg7XG5cdCAgICBpZiAoeG4gPiBuKSB7XG5cdFx0ICAgIHJldHVybiBmYWxzZTtcblx0ICAgIH1cblx0ICAgIHJldHVybiB0aGlzLnN1YnN0cmluZyhuIC0geG4sIG4pID09PSB4O1xuICAgIH0sXG4gICAgYmVnaW5zaTogZnVuY3Rpb24oc3RyaW5nKSB7XG5cdCAgICB2YXIgbGVuID0gc3RyaW5nLmxlbmd0aDtcblx0ICAgIGlmIChsZW4gPiB0aGlzLmxlbmd0aCkge1xuXHRcdCAgICByZXR1cm4gZmFsc2U7XG5cdCAgICB9XG5cdCAgICByZXR1cm4gdGhpcy5zdWJzdHIoMCwgbGVuKS50b0xvd2VyQ2FzZSgpID09PSBzdHJpbmcudG9Mb3dlckNhc2UoKTtcbiAgICB9LFxuICAgIGJlZ2luczogZnVuY3Rpb24oc3RyaW5nKSB7XG5cdCAgICB2YXIgbGVuID0gc3RyaW5nLmxlbmd0aDtcblx0ICAgIGlmIChsZW4gPiB0aGlzLmxlbmd0aCkge1xuXHRcdCAgICByZXR1cm4gZmFsc2U7XG5cdCAgICB9XG5cdCAgICByZXR1cm4gdGhpcy5zdWJzdHIoMCwgbGVuKSA9PT0gc3RyaW5nO1xuICAgIH0sXG4gICAgc3RyX3JlcGxhY2U6IGZ1bmN0aW9uKHMsIHIpIHtcblx0ICAgIHZhciBzdHIgPSB0aGlzO1xuXHQgICAgdmFyIGk7XG5cdCAgICBpZiAoaXNfc3RyaW5nKHMpKSB7XG5cdFx0ICAgIGlmIChpc19zdHJpbmcocikpIHtcblx0XHRcdCAgICByZXR1cm4gdGhpcy5zcGxpdChzKS5qb2luKHIpO1xuXHRcdCAgICB9XG5cdFx0ICAgIGZvciAoaSA9IDA7IGkgPCByLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHQgICAgc3RyID0gc3RyLnN0cl9yZXBsYWNlKHMsIHJbaV0pO1xuXHRcdCAgICB9XG5cdFx0ICAgIHJldHVybiBzdHI7XG5cdCAgICB9XG5cdCAgICBpZiAoaXNfc3RyaW5nKHIpKSB7XG5cdFx0ICAgIGZvciAoaSA9IDA7IGkgPCBzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHQgICAgc3RyID0gc3RyLnN0cl9yZXBsYWNlKHNbaV0sIHIpO1xuXHRcdCAgICB9XG5cdFx0ICAgIHJldHVybiBzdHI7XG5cdCAgICB9XG5cdCAgICB2YXIgbiA9IE1hdGgubWluKHMubGVuZ3RoLCByLmxlbmd0aCk7XG5cdCAgICBmb3IgKGkgPSAwOyBpIDwgbjsgaSsrKSB7XG5cdFx0ICAgIHN0ciA9IHN0ci5zdHJfcmVwbGFjZShzW2ldLCByW2ldKTtcblx0ICAgIH1cblx0ICAgIHJldHVybiBzdHI7XG4gICAgfSxcbiAgICB0cjogZnVuY3Rpb24ob2JqZWN0KSB7XG5cdCAgICB2YXIgaywgc2VsZiA9IHRoaXM7XG5cdCAgICBmb3IgKGsgaW4gb2JqZWN0KSB7XG5cdCAgICBcdGlmIChvYmplY3QuaGFzT3duUHJvcGVydHkoaykpIHtcblx0ICAgIFx0XHRzZWxmID0gc2VsZi5zdHJfcmVwbGFjZShrLCBvYmplY3Rba10pO1xuXHQgICAgXHR9XG5cdCAgICB9XG5cdCAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuICAgIG1hcDogZnVuY3Rpb24ob2JqZWN0LCBjYXNlX2luc2Vuc2l0aXZlKSB7XG5cdCAgICB2YXIgaywgc3VmZml4ID0gXCJcIiwgc2VsZjtcblx0ICAgIGNhc2VfaW5zZW5zaXRpdmUgPSAhIWNhc2VfaW5zZW5zaXRpdmU7IC8vIENvbnZlcnQgdG8gYm9vbFxuXHQgICAgaWYgKCFpc19vYmplY3Qob2JqZWN0KSkge1xuXHRcdCAgICByZXR1cm4gdGhpcztcblx0ICAgIH1cblx0ICAgIHNlbGYgPSB0aGlzO1xuXHQgICAgaWYgKGNhc2VfaW5zZW5zaXRpdmUpIHtcblx0XHQgICAgb2JqZWN0ID0gWmVzay5jaGFuZ2Vfa2V5X2Nhc2Uob2JqZWN0KTtcblx0XHQgICAgc3VmZml4ID0gXCJpXCI7XG5cdCAgICB9XG5cdCAgICBmb3IgKGsgaW4gb2JqZWN0KSB7XG5cdFx0ICAgIGlmIChvYmplY3QuaGFzT3duUHJvcGVydHkoaykpIHtcblx0XHRcdCAgICB2YXIgdmFsdWUgPSBvYmplY3Rba10sIHJlcGxhY2UgPSB2YWx1ZSA9PT0gbnVsbCA/IFwiXCIgOiBTdHJpbmcob2JqZWN0W2tdKTtcblx0XHRcdCAgICBzZWxmID0gc2VsZi5yZXBsYWNlKG5ldyBSZWdFeHAoXCJcXFxce1wiICsgayArIFwiXFxcXH1cIiwgXCJnXCIgKyBzdWZmaXgpLCByZXBsYWNlKTtcblx0XHQgICAgfVxuXHQgICAgfVxuXHQgICAgcmV0dXJuIHNlbGY7XG4gICAgfSxcbiAgICB0b19hcnJheTogZnVuY3Rpb24oKSB7XG5cdCAgICB2YXIgaSwgciA9IFtdO1xuXHQgICAgZm9yIChpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcblx0XHQgICAgci5wdXNoKHRoaXMuY2hhckF0KGkpKTtcblx0ICAgIH1cblx0ICAgIHJldHVybiByO1xuICAgIH0sXG4gICAgdW5xdW90ZTogZnVuY3Rpb24oKSB7XG5cdCAgICB2YXIgbiA9IHRoaXMubGVuZ3RoO1xuXHQgICAgdmFyIHEgPSBhcmd1bWVudHNbMF0gfHwgJ1wiXCJcXCdcXCcnO1xuXHQgICAgdmFyIHAgPSBxLmluZGV4T2YodGhpcy5zdWJzdHJpbmcoMCwgMSkpO1xuXHQgICAgaWYgKHAgPCAwKSB7XG5cdFx0ICAgIHJldHVybiB0aGlzO1xuXHQgICAgfVxuXHQgICAgaWYgKHRoaXMuc3Vic3RyaW5nKG4gLSAxLCBuKSA9PT0gcS5jaGFyQXQocCArIDEpKSB7XG5cdFx0ICAgIHJldHVybiB0aGlzLnN1YnN0cmluZygxLCBuIC0gMSk7XG5cdCAgICB9XG5cdCAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHRvQ2FtZWxDYXNlOiBmdW5jdGlvbigpIHtcblx0ICAgIHZhciByZXN1bHQgPSBcIlwiO1xuXHQgICAgWmVzay5lYWNoKHRoaXMuc3BsaXQoXCJfXCIpLCBmdW5jdGlvbigpIHtcblx0XHQgICAgcmVzdWx0ICs9IHRoaXMuc3Vic3RyKDAsIDEpLnRvVXBwZXJDYXNlKCkgKyB0aGlzLnN1YnN0cigxKS50b0xvd2VyQ2FzZSgpO1xuXHQgICAgfSk7XG5cdCAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG4gICAgZnJvbUNhbWVsQ2FzZTogZnVuY3Rpb24oKSB7XG5cdCAgICByZXR1cm4gdGhpcy5yZXBsYWNlKC9bQS1aXS9nLCBmdW5jdGlvbih2KSB7XG5cdFx0ICAgIHJldHVybiBcIl9cIiArIHYudG9Mb3dlckNhc2UoKTtcblx0ICAgIH0pO1xuICAgIH0sXG4gICAgdW5wcmVmaXg6IGZ1bmN0aW9uKHN0cmluZywgZGVmKSB7XG5cdCAgICBpZiAodGhpcy5iZWdpbnMoc3RyaW5nKSkge1xuXHRcdCAgICByZXR1cm4gdGhpcy5zdWJzdHIoc3RyaW5nLmxlbmd0aCk7XG5cdCAgICB9XG5cdCAgICByZXR1cm4gZGVmIHx8IHRoaXM7XG4gICAgfVxufSk7XG5PYmplY3QuYXNzaWduKFN0cmluZy5wcm90b3R5cGUsIHtcblx0ZW5kczogU3RyaW5nLnByb3RvdHlwZS5lbmRzX3dpdGhcbn0pO1xuXG5aZXNrLnRvX2ludGVnZXIgPSBmdW5jdGlvbih4KSB7XG5cdHZhciBkID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBhcmd1bWVudHNbMV0gOiBudWxsO1xuXHR4ID0gcGFyc2VJbnQoeCwgMTApO1xuXHRpZiAodHlwZW9mIHggPT09ICdudW1iZXInKSB7XG5cdFx0cmV0dXJuIHg7XG5cdH1cblx0cmV0dXJuIGQ7XG59O1xuXG5mdW5jdGlvbiB0b19saXN0KHgsIGRlZiwgZGVsaW0pIHtcblx0ZGVmID0gZGVmIHx8IFtdO1xuXHRkZWxpbSA9IGRlbGltIHx8IFwiLlwiO1xuXHRpZiAoaXNfYXJyYXkoeCkpIHtcblx0XHRyZXR1cm4geDtcblx0fVxuXHRpZiAoeCA9PT0gbnVsbCkge1xuXHRcdHJldHVybiBkZWY7XG5cdH1cblx0cmV0dXJuIHgudG9TdHJpbmcoKS5zcGxpdChkZWxpbSk7XG59XG5cblplc2sudG9fbGlzdCA9IHRvX2xpc3Q7XG5cblplc2sudG9fZmxvYXQgPSBmdW5jdGlvbih4KSB7XG5cdHZhciBkID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBhcmd1bWVudHNbMV0gOiBudWxsO1xuXHR4ID0gcGFyc2VGbG9hdCh4KTtcblx0aWYgKHR5cGVvZiB4ID09PSAnbnVtYmVyJykge1xuXHRcdHJldHVybiB4O1xuXHR9XG5cdHJldHVybiBkO1xufTtcblxuWmVzay50b19zdHJpbmcgPSBmdW5jdGlvbih4KSB7XG5cdHJldHVybiB4LnRvU3RyaW5nKCk7XG59O1xuXG5mdW5jdGlvbiB0b19ib29sKHgpIHtcblx0dmFyIGQgPSBhcmd1bWVudHMubGVuZ3RoID4gMSA/IGFyZ3VtZW50c1sxXSA6IGZhbHNlO1xuXHRpZiAoaXNfYm9vbCh4KSkge1xuXHRcdHJldHVybiB4O1xuXHR9XG5cdGlmIChpc19udW1lcmljKHgpKSB7XG5cdFx0cmV0dXJuICh4ICE9PSAwKTtcblx0fVxuXHRpZiAoaXNfc3RyaW5nKHgpKSB7XG5cdFx0aWYgKFsndCcsICd0cnVlJywgJzEnLCAnZW5hYmxlZCcsICd5JywgJ3llcyddLmNvbnRhaW5zKHgpKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdFx0aWYgKFsnZicsICdmYWxzZScsICcwJywgJ2Rpc2FibGVkJywgJ24nLCAnbm8nXS5jb250YWlucyh4KSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gZDtcbn1cblplc2sudG9fYm9vbCA9IHRvX2Jvb2w7XG5cblplc2suZW1wdHkgPSBmdW5jdGlvbih2KSB7XG5cdHJldHVybiB0eXBlb2YgdiA9PT0gXCJ1bmRlZmluZWRcIiB8fCB2ID09PSBudWxsIHx8IHYgPT09IFwiXCI7XG59O1xuXG5aZXNrLlpPYmplY3QgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXHR0aGlzLm9wdGlvbnMgPSBaZXNrLmNoYW5nZV9rZXlfY2FzZShPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zKSk7XG5cdC8vIHRoaXMuY29uc3RydWN0b3Iuc3VwZXIuY2FsbCh0aGlzKTtcbn07XG5aZXNrLmluaGVyaXQoWmVzay5aT2JqZWN0LCBudWxsLCB7XG5cdGNsb25lOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gWmVzay5jbG9uZSh0aGlzKTtcblx0fVxufSk7XG5cblplc2suY2hhbmdlX2tleV9jYXNlID0gZnVuY3Rpb24obWUpIHtcblx0dmFyIGssIG5ld28gPSB7fTtcblx0Zm9yIChrIGluIG1lKSB7XG5cdFx0aWYgKG1lLmhhc093blByb3BlcnR5KGspKSB7XG5cdFx0XHRuZXdvW2sudG9Mb3dlckNhc2UoKV0gPSBtZVtrXTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIG5ld287XG59O1xuXG5pZiAodHlwZW9mIE1hdGguc2lnbiAhPT0gJ2Z1bmN0aW9uJykge1xuXHRNYXRoLnNpZ24gPSBmdW5jdGlvbih4KSB7XG5cdFx0cmV0dXJuIHggPyB4IDwgMCA/IC0xIDogMSA6IDA7XG5cdH07XG59XG5cbi8vIFRPRE8gV2hhdCdzIHRoaXMgZm9yP1xuWmVzay5hamF4X2Zvcm0gPSBmdW5jdGlvbigpIHtcblx0dmFyICRmb3JtID0gJCh0aGlzKSwgdGFyZ2V0ID0gJGZvcm0uYXR0cigndGFyZ2V0JyksICR0YXJnZXQgPSAkKCcjJyArIHRhcmdldCk7XG5cdFplc2subG9nKCR0YXJnZXQuaHRtbCgpKTtcbn07XG5cbi8qXG4gKiBDb21wYXRpYmlsaXR5XG4gKi9cbi8vIGlmICghT2JqZWN0LnByb3RvdHlwZS5rZXlzKSB7XG4vLyBcdE9iamVjdC5wcm90b3R5cGUua2V5cyA9IGZ1bmN0aW9uKG9iaikge1xuLy8gXHRcdHZhciBrZXlzID0gW10sIGs7XG4vLyBcdFx0Zm9yIChrIGluIG9iaikge1xuLy8gXHRcdFx0aWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGspKSB7XG4vLyBcdFx0XHRcdGtleXMucHVzaChrKTtcbi8vIFx0XHRcdH1cbi8vIFx0XHR9XG4vLyBcdFx0cmV0dXJuIGtleXM7XG4vLyBcdH07XG4vLyB9XG5cbiQuZm4uZXF1YWxoZWlnaHQgPSBmdW5jdGlvbihzZWxlY3Rvcikge1xuXHQkKHRoaXMpLmVhY2goZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGggPSBudWxsO1xuXHRcdCQoc2VsZWN0b3IsICQodGhpcykpLmVhY2goZnVuY3Rpb24oKSB7XG5cdFx0XHRoID0gTWF0aC5tYXgoJCh0aGlzKS5oZWlnaHQoKSwgaCk7XG5cdFx0fSk7XG5cdFx0JChzZWxlY3RvciwgJCh0aGlzKSkuZWFjaChmdW5jdGlvbigpIHtcblx0XHRcdCQodGhpcykuaGVpZ2h0KGggKyBcInB4XCIpO1xuXHRcdH0pO1xuXHR9KTtcbn07XG5cblplc2suaW5pdGVkID0gdHJ1ZTtcblxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKSB7XG5cdFplc2suaG9vayhcImRvY3VtZW50OjpyZWFkeVwiKTtcbn0pO1xuJCh3aW5kb3cpLm9uKFwibG9hZFwiLCBmdW5jdGlvbigpIHtcblx0WmVzay5ob29rKFwid2luZG93Ojpsb2FkXCIpO1xufSk7XG5cdFxubW9kdWxlLmV4cG9ydHMgPSBaZXNrOyJdfQ==