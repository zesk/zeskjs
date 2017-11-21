"use strict";

/*
 * $Id$
 *
 * Copyright (C) 2017 Market Acumen, Inc. All rights reserved
 */
// import _ from "lodash";
// import ZeskException from "./ZeskException";

// import $ from "jquery";
// import qs from "qs";

var _ = require("lodash");
var ZeskException = require("./ZeskException");

var $ = require("jquery");
var qs = require("qs");

var RSVP = require("rsvp-that-works");
var format = require("string-format-obj");

var ZeskObject = function ZeskObject(mixed, options) {
    this._class = $.extend(
        {
            id_column: null,
            primary_keys: [],
            member_types: {},
            member_defaults: {},
        },
        this._class || this.class_definition()
    );
    this._initialize_class();
    this._options = _.isObject(options) ? _.cloneDeep(options) : {};
    this._need_load = false;
    $.extend(this, this._class.member_defaults);
    if (mixed) {
        this._init_instance(mixed);
    }
    this._original = $.extend({}, this._members());
    this.initialize();
};

Object.assign(ZeskObject.prototype, {
    _members: function _members() {
        var _this = this;

        var result = {};
        var c = this._class;
        _.forEach(this._class.member_types, function(type, key) {
            result[key] = _this[key] || c.member_defaults[key];
        });
        return result;
    },
    class_definition: function class_definition() {
        return {};
    },

    id_column: function id_column() {
        return this._class.id_column || null;
    },

    _initialize_class: function _initialize_class() {
        var c = this._class;
        _.forEach(c.member_types, function(type, name) {
            if (_.isUndefined(c.member_defaults[name])) {
                c.member_defaults[name] = null;
            }
        });
    },
    _init_instance: function _init_instance(mixed) {
        if (_.isObject(mixed)) {
            var self = this;
            var c = this._class;
            _.forEach(mixed, function(value, key) {
                if (!c.member_types[key]) {
                    self[key] = value;
                    // Extra value, store as usual for now.
                    return;
                }
                self[key] = value;
            });
            this._need_load = false;
        } else if ((_.isNumber(mixed) || _.isString(mixed)) && this.id_column()) {
            this[this._class.id_column] = mixed;
            this._need_load = true;
        } else {
            console.log("Unknown init type for " + this.constructor.name + ": " + mixed);
        }
    },

    super_initialize: function super_initialize() {
        this._endpoints = $.extend(
            {
                GET: null,
                PUT: null,
                POST: null,
                DELETE: null,
            },
            this._endpoints || {}
        );
    },

    is_new: function is_new() {
        var self = this,
            result = true;
        $.each(this._class.primary_keys, function() {
            if (self[this]) {
                result = false;
                return false;
            }
        });
        return result;
    },

    fetch: function fetch(options) {
        var _this2 = this;

        if (!_.isObject(options)) {
            options = {};
        }
        if (!this._endpoints.GET) {
            throw new ZeskException("{class} does not have GET endpoint", { class: this.constructor.name });
        }
        var promise = new RSVP.Promise();
        var url = this._format_url(this._endpoints.GET, options);
        this._ajax("GET", url, {
            success: function success(data) {
                this._fetch_resolve(data);
                promise.resolve(this, data);
            },
            error: function error(xhr, message) {
                _this2._fetch_reject();
                promise.reject(new Error(message));
            },
            dataType: "json",
        });
        return promise;
    },

    store: function store() {
        var _this3 = this;

        var promise = new RSVP.Promise();
        this._ajax(this.is_new() ? "POST" : "PUT", this._format_url(this._endpoints.PUT), {
            success: function success(data) {
                _this3._store_resolve(data);
                promise.resolve(_this3, data);
            },
            error: function error(xhr, message) {
                _this3._store_reject(xhr, message);
                promise.reject(new Error(message));
            },
        });
        return promise;
    },

    _format_url: function _format_url(url) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        var q = qs.stringify(options);
        var u = format(url, this);
        if (!q) {
            return u;
        }
        return u + (q && u.indexOf("?") >= 0 ? "&" : "?") + q;
    },

    _ajax: function _ajax(method, url, data) {
        data = data || {};
        if (_.isObject(data.data)) {
            data.data = JSON.stringify(data.data);
        }
        $.ajax(
            url,
            $.extend(
                {
                    dataType: "json",
                    contentType: "application/json",
                    context: this,
                    method: method,
                },
                data
            )
        );
    },

    /**
     * Run on each child object as fetched as a member of this object. Should convert to a JavaScript class.
     */
    _resolve_object: function _resolve_object(data) {
        return data;
    },
    _fetch_resolve: function _fetch_resolve(data) {
        var self = this;
        var c = this._class;
        $.each(data, function(member) {
            if (member.substr(0, 1) === "_") {
                return;
            }
            if (c.member_types[member]) {
                if (_.isObject(this)) {
                    self[member] = self._resolve_object(this);
                } else {
                    self[member] = this;
                }
            }
        });
        this._need_load = false;
        console.log("Loaded " + this.constructor.name + " #" + this[this._class.id_column]);
    },

    _fetch_reject: function _fetch_reject(xhr, message) {},
    _store_resolve: function _store_resolve(data) {},

    _store_reject: function _store_reject(xhr, message) {},
});

ZeskObject.mixedToId = function(mixed) {
    if (_.isNumber(mixed)) {
        return parseInt(mixed, 10);
    }
    if (_.isObject(mixed)) {
        return mixed;
    }
};

ZeskObject.fetchById = function(Constructor, mixed) {
    var result = new Constructor(mixed);
    return result.fetch();
};

module.exports = ZeskObject;
