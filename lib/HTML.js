"use strict";

/*
 * $Id$
 *
 * Copyright (C) 2017 Market Acumen, Inc. All rights reserved
 */
var $ = require("jquery");
var zesk = require("./Zesk");

var avalue = zesk.avalue;
var is_object = zesk.is_object;
var is_string = zesk.is_string;
var _escape_map = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"`": "&#96;",
	"'": "&#x27",
};
var _escape_map_flip;
var HTML = {
	specials: function specials(html) {
		return $("<textarea />")
			.text(html)
			.html();
	},
	escape: function escape(text) {
		return String(text).tr(_escape_map);
	},
	unescape: function unescape(text) {
		return String(text).tr(_escape_map_flip);
	},
	encode: function encode(text) {
		var result = document.createElement("a").appendChild(document.createTextNode(text)).parentNode.innerHTML;
		return result.str_replace('"', "&quot;");
	},
	decode: function decode(html) {
		var a = document.createElement("a");
		a.innerHTML = html;
		return a.textContent;
	},
	to_attributes: function to_attributes(mixed) {
		var obj = {};
		if (!is_string(mixed) || mixed.length === 0) {
			return arguments[1] || null;
		}
		$.each(mixed.split(" "), function() {
			var token = this.trim(),
				c = token.substr(0, 1);
			if (c === "#") {
				obj.id = token;
				return;
			}
			if (c === ".") {
				token = token.substr(1);
			}
			if (obj["class"]) {
				obj["class"] += " " + token;
			} else {
				obj["class"] = token;
			}
		});
		return obj;
	},
	attributes: function attributes(_attributes) {
		var a,
			r = [];
		if (!_attributes) {
			return "";
		}
		for (a in _attributes) {
			if (_attributes.hasOwnProperty(a)) {
				if (a.substr(0, 1) === "*") {
					r.push(a.substr(1) + '="' + _attributes[a] + '"');
				} else {
					r.push(a.toString() + '="' + HTML.encode(_attributes[a]) + '"');
				}
			}
		}
		if (r.length === 0) {
			return "";
		}
		return " " + r.join(" ");
	},
	tag: function tag(name, mixed) {
		var attributes,
			content,
			args = arguments;
		if (is_object(mixed)) {
			attributes = mixed;
			content = avalue(args, 2, null);
		} else if (args.length > 2) {
			attributes = HTML.to_attributes(mixed);
			content = args[2];
		} else {
			attributes = {};
			content = mixed;
		}
		name = name.toLowerCase();
		return (
			"<" +
			name +
			" " +
			HTML.attributes(attributes) +
			(content === null ? " />" : ">" + content + "</" + name + ">")
		);
	},
	tags: function tags(name, mixed) {
		var attributes,
			content,
			args = arguments,
			result = "";
		if (is_object(mixed)) {
			attributes = mixed;
			content = avalue(args, 2, null);
		} else if (args.length > 2) {
			attributes = HTML.to_attributes(mixed);
			content = args[2];
		} else {
			attributes = {};
			content = mixed;
		}
		$.each(content, function() {
			result += HTML.tag(name, attributes, this);
		});
		return result;
	},
};

// Zesk.tag = function(name) {
// 	var a = arguments;
// 	if (a.length > 2) {
// 		return HTML.tag(name, a[1], a[2]);
// 	} else {
// 		return HTML.tag(name, a[1]);
// 	}
// };

module.exports = HTML;