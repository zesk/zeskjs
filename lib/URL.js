/*
 * $Id$
 *
 * Copyright (C) 2017 Market Acumen, Inc. All rights reserved
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('jquery'), require('./zesk'));
    } else {
        // Browser globals (root is window)
        root.URL = factory(root.jQuery, root.zesk);
    }
}(this, function ($, zesk) {
	var URL = function (mixed) {
		var self = this;
		$.each(this.keys, function () {
			self[this] = null;
		});
		if (is_object(mixed)) {
			$.each(this.keys, function () {
				if (mixed[this]) {
					self[this] = mixed[this];
				}
			});
		} else if (zesk.is_url(mixed)) { 
			this.parse(mixed);
		} else if (zesk.is_string(mixed)) {
			this.path = mixed;
		}
	};
	$.extend(URL.prototype, {
		keys: [ "url", "scheme", "user", "pass", "host", "port", "path", "query", "hash" ],
		_query: function (mixed) {
			if (mixed === undefined) {
				return this.query || null;
			}
			if (zesk.is_string(mixed)) {
				if (mixed.charAt(0) !== "?") {
					mixed = "?" + mixed;
				}
			} else if (zesk.is_object(mixed)) {
				var items = [];
				$.each(mixed, function (k) {
					if (this === null || this === undefined || this === "") {
						return;
					}
					items.push(encodeURIComponent(k) + "=" + encodeURIComponent(this));
				});
				mixed = "?" + items.join("&");
			}
			this.query = mixed;
			this.unparse();
			return this;
		},
		default_port: function () {
			var ports = {
				"http": 80,
				"https": 443,
				"ftp": 21
			};
			return ports[this.scheme] || null;
		},
		parse: function (url) {
			var parser = d.createElement('a');
			parser.href = url;
			this.url = url;
			this.scheme = String(parser.protocol).replace(/:$/, '');
			this.host = parser.hostname;
			this.port = parser.port;
			this.path = parser.pathname;
			this.query = parser.search;
			this.hash = parser.hash;
			return this;
		},
		unparse: function () {
			var user = this.user ? (this.user + (this.pass ? ":" + this.pass : "") + "@") : "";
			var port = this.port ? (this.port === this.default_port() ? "" : ":" + this.port) : "";
			var prefix = this.scheme ? this.scheme + ":" : "";
			var uhp = this.host ? "//" + user + this.host + port : "";
			this.url = prefix + uhp + this.path + this.query + (this.hash ? this.hash : "");
			return this.url;
		}
	});
	return URL;
});