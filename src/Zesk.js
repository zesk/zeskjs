/*
 * $Id: Zesk.js 4226 2016-11-30 03:53:20Z kent $
 *
 * Copyright (C) 2017 Market Acumen, Inc. All rights reserved
 */
var $ = require('jquery');
let HTML = require('./HTML');

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
	if (typeof obj === "object") {
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
	return (/^http:\/\/.+|^https:\/\/.+|^mailto:.+@.+|^ftp:\/\/.+|^file:\/\/.+|^news:\/\/.+/).exec(x.toLowerCase().trim());
}

Zesk.flip = function (object) {
	var i, result = {};
	for (i in object) {
		if (object.hasOwnProperty(i)) {
			result[String(object[i])] = i;
		}
	}
	return result;
}

/* Kernel */

Zesk.is_date = function(a) {
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
	var curr = object, k;
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
	var curr = object, k, seg;
	path = to_list(path, [], ".");
	for (k = 0; k < path.length; k++) {
		seg = path[k];
		if (typeof curr[seg] === "object") {
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
    query_get: function(v, def) {
	    def = def || null;
	    var pair, i, u = d.URL.toString().right("?", null);
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
    cookie: function (name, value, options) {
    	var
    	getcookie = function (n)	{
    		var c = d.cookie;
    		var s = c.lastIndexOf(n+'=');
    		if (s < 0) {
    			return null;
    		}
    		s += n.length+1;
    		var e = c.indexOf(';', s);
    		if (e < 0) {
    			e = c.length;
    		}
    		return W.unescape(c.substring(s,e));
    	},
    	setcookie = function (n, v, options) {
    		var a = new Date(), t = parseInt(options.ttl, 10) || -1, m = options.domain || null;
    		if (t <= 0) {
    			a.setFullYear(2030);
    		} else if (t > 0) {
    			a.setTime(a.getTime() + t * 1000);
    		}
    		d.cookie = n + "=" + W.escape(v) + '; path=/; expires=' + a.toGMTString() + (m ? '; domain=' + m : '');
    		return v;
    	},
    	delete_cookie = function (name, dom) {
    		var 
    		now = new Date(), 
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
    css: function(p) {
	    var css = d.createElement('link');
	    css.rel = "stylesheet";
	    css.href = p;
	    css.media = arguments[1] || "all";
	    d.getElementsByTagName('head')[0].appendChild(css);
    },
    log: function() {
	    if (W.console && W.console.log) {
		    W.console.log(arguments);
	    }
    },
    add_hook: function(hook, fun) {
	    var path = hook_path(hook), curr = object_path(hooks, path);
	    if (curr) {
		    curr.push(fun);
	    } else {
		    curr = [fun];
		    object_set_path(hooks, path, curr);
	    }
    },
    has_hook: function(hook) {
	    var funcs = object_path(hooks, hook_path(hook), null);
	    return funcs ? true : false;
    },
    hook: function(hook) {
	    var path = hook_path(hook), args = Zesk.clone(arguments), funcs = object_path(hooks, path, null), results = [], i;
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
    get_path: function(path, def) {
	    return object_path(Zesk.settings, path, def);
    },
    set_path: function(path, value) {
	    return object_set_path(Zesk.settings, path, value);
    },
    get: function(n) {
	    var a = arguments;
	    return avalue(Zesk.settings, n, a.length > 1 ? a[1] : null);
    },
    getb: function(n) {
	    var a = arguments, d = a.length > 1 ? a[1] : false;
	    return to_bool(Zesk.get(n, d));
    },
    set: function(n, v) {
	    var a = arguments, overwrite = a.length > 2 ? to_bool(a[2]) : true;
	    if (!overwrite && typeof Zesk.settings[n] !== 'undefined') {
		    return Zesk.settings[n];
	    }
	    Zesk.settings[n] = v;
	    return v;
    },
    inherit: function(the_class, super_class, prototype) {
	    // http://stackoverflow.com/questions/1114024/constructors-in-javascript-objects
	    var method, Construct = function() {
	    };
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
	    the_class.prototype.clone = function() {
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
    each: function(x, fn, term_false) {
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
    tpl: function(mixed, map) {
	    return $(mixed).html().map(map, false);
    },
    script_src_normalize: function(src) {
	    var matches, parts = Zesk.url_parts;
	    src = src.unprefix(parts.scheme + '://' + parts.host);
	    matches = src.match(/(.*)\?_ver=[0-9]+$/);
	    if (matches !== null) {
		    src = matches[1];
	    }
	    return src;
    },
    scripts_init: function() {
	    Zesk.page_scripts = {};
	    $('script[type="text/javascript"][src]').each(function() {
		    Zesk.script_add($(this).attr('src'));
	    });

    },
    script_add: function(src) {
	    if (Zesk.page_scripts === null) {
		    Zesk.scripts_init();
	    }
	    Zesk.page_scripts[src] = true;
	    Zesk.page_scripts[Zesk.script_src_normalize(src)] = true;
    },
    scripts: function() {
	    if (Zesk.page_scripts === null) {
		    Zesk.scripts_init();
	    }
	    return Zesk.page_scripts;
    },
    scripts_cached: function(srcs) {
	    Zesk.each(srcs, function() {
		    Zesk.script_add(this);
	    });
    },
    script_loaded: function(src) {
	    var scripts = Zesk.scripts(), result = scripts[src] || scripts[Zesk.script_src_normalize(src)] || false;
	    // Zesk.log("Zesk.script_loaded(" + src + ") = " + (result ? "true":
	    // "false"));
	    return result;
    },
    stylesheet_loaded: function(href, media) {
	    return $('link[rel="stylesheet"][href="' + href + '"][media="' + media + '"').length > 0;
    },
    message: function(message, options) {
	    options = is_string(options) ? {
		    level: options
	    } : options;
	    Zesk.hook('message', message, options);
	    Zesk.log(message, options);
    },
    regexp_quote: function(str, delimiter) {
	    return String(str).replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
    }
});

Zesk.clone = function(object) {
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
    contains: function(x) {
	    for (var i = 0; i < this.length; i++) {
		    if (this[i] === x) {
			    return true;
		    }
	    }
	    return false;
    },
    remove: function(x) {
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
    join_wrap: function(prefix, suffix) {
	    prefix = String(prefix) || "";
	    suffix = String(suffix) || "";
	    return prefix + this.join(suffix + prefix) + suffix;
    }
});

Object.assign(Object, {
    fromCamelCase: function(from) {
	    var to = {};
	    for ( var i in from) {
		    if (from.hasOwnProperty(i)) {
			    to[i.fromCamelCase()] = from[i];
		    }
	    }
	    return to;
    },
    toCamelCase: function(from) {
	    var to = {};
	    for ( var i in this) {
		    if (from.hasOwnProperty(i)) {
			    to[i.toCamelCase()] = from[i];
		    }
	    }
	    return to;
    }
});

Object.assign(String.prototype, {
    compare: function(a) {
	    return (this < a) ? -1 : (this === a) ? 0 : 1;
    },
    left: function(delim, def) {
	    var pos = this.indexOf(delim);
	    return (pos < 0) ? avalue(arguments, 1, def || this) : this.substr(0, pos);
    },
    rleft: function(delim, def) {
	    var pos = this.lastIndexOf(delim);
	    return (pos < 0) ? avalue(arguments, 1, def || this) : this.substr(0, pos);
    },
    right: function(delim, def) {
	    var pos = this.indexOf(delim);
	    return (pos < 0) ? avalue(arguments, 1, def || this) : this.substr(pos + delim.length);
    },
    rright: function(delim, def) {
	    var pos = this.lastIndexOf(delim);
	    return (pos < 0) ? avalue(arguments, 1, def || this) : this.substr(pos + delim.length);
    },
    ltrim: function() {
	    return this.replace(/^\s+/, '');
    },
    rtrim: function() {
	    return this.replace(/\s+$/, '');
    },
    trim: function() {
	    return this.replace(/^\s+/, '').replace(/\s+$/, '');
    },
    /**
	 * @deprecated
	 * @param x
	 *            String to look at
	 */
    ends_with: function(x) {
	    return this.ends(x);
    },
    ends: function(x) {
	    var xn = x.length, n = this.length;
	    if (xn > n) {
		    return false;
	    }
	    return this.substring(n - xn, n) === x;
    },
    beginsi: function(string) {
	    var len = string.length;
	    if (len > this.length) {
		    return false;
	    }
	    return this.substr(0, len).toLowerCase() === string.toLowerCase();
    },
    begins: function(string) {
	    var len = string.length;
	    if (len > this.length) {
		    return false;
	    }
	    return this.substr(0, len) === string;
    },
    str_replace: function(s, r) {
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
    tr: function(object) {
	    var k, self = this;
	    for (k in object) {
	    	if (object.hasOwnProperty(k)) {
	    		self = self.str_replace(k, object[k]);
	    	}
	    }
	    return self;
    },
    map: function(object, case_insensitive) {
	    var k, suffix = "", self;
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
			    var value = object[k], replace = value === null ? "" : String(object[k]);
			    self = self.replace(new RegExp("\\{" + k + "\\}", "g" + suffix), replace);
		    }
	    }
	    return self;
    },
    to_array: function() {
	    var i, r = [];
	    for (i = 0; i < this.length; i++) {
		    r.push(this.charAt(i));
	    }
	    return r;
    },
    unquote: function() {
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
    toCamelCase: function() {
	    var result = "";
	    Zesk.each(this.split("_"), function() {
		    result += this.substr(0, 1).toUpperCase() + this.substr(1).toLowerCase();
	    });
	    return result;
    },
    fromCamelCase: function() {
	    return this.replace(/[A-Z]/g, function(v) {
		    return "_" + v.toLowerCase();
	    });
    },
    unprefix: function(string, def) {
	    if (this.begins(string)) {
		    return this.substr(string.length);
	    }
	    return def || this;
    }
});
Object.assign(String.prototype, {
	ends: String.prototype.ends_with
});

Zesk.to_integer = function(x) {
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

Zesk.to_float = function(x) {
	var d = arguments.length > 1 ? arguments[1] : null;
	x = parseFloat(x);
	if (typeof x === 'number') {
		return x;
	}
	return d;
};

Zesk.to_string = function(x) {
	return x.toString();
};

function to_bool(x) {
	var d = arguments.length > 1 ? arguments[1] : false;
	if (is_bool(x)) {
		return x;
	}
	if (is_numeric(x)) {
		return (x !== 0);
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

Zesk.empty = function(v) {
	return typeof v === "undefined" || v === null || v === "";
};

Zesk.ZObject = function(options) {
	options = options || {};
	this.options = Zesk.change_key_case(Object.assign({}, options));
	// this.constructor.super.call(this);
};
Zesk.inherit(Zesk.ZObject, null, {
	clone: function() {
		return Zesk.clone(this);
	}
});

Zesk.change_key_case = function(me) {
	var k, newo = {};
	for (k in me) {
		if (me.hasOwnProperty(k)) {
			newo[k.toLowerCase()] = me[k];
		}
	}
	return newo;
};

if (typeof Math.sign !== 'function') {
	Math.sign = function(x) {
		return x ? x < 0 ? -1 : 1 : 0;
	};
}

// TODO What's this for?
Zesk.ajax_form = function() {
	var $form = $(this), target = $form.attr('target'), $target = $('#' + target);
	Zesk.log($target.html());
};

/*
 * Compatibility
 */
if (!Object.prototype.keys) {
	Object.prototype.keys = function(obj) {
		var keys = [], k;
		for (k in obj) {
			if (Object.prototype.hasOwnProperty.call(obj, k)) {
				keys.push(k);
			}
		}
		return keys;
	};
}

$.fn.equalheight = function(selector) {
	$(this).each(function() {
		var h = null;
		$(selector, $(this)).each(function() {
			h = Math.max($(this).height(), h);
		});
		$(selector, $(this)).each(function() {
			$(this).height(h + "px");
		});
	});
};

Zesk.inited = true;

$(document).ready(function() {
	Zesk.hook("document::ready");
});
$(window).on("load", function() {
	Zesk.hook("window::load");
});
	
module.exports = Zesk;