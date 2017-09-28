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
    this._class = $.extend({
        id_column: null,
        primary_keys: [],
        member_types: {},
        member_defaults: {}
    }, this._class || this.class_definition());
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
        _.forEach(this._class.member_types, function (type, key) {
            result[key] = _this[key] || c.member_defaults[key];
        });
        return result;
    },
    /**
     * Called after object is initialized with new values
     */
    initialize: function initialize() {},
    /**
     * Called after item is fetched and initialized from remote source
     */
    fetched: function fetched() {
        this.initialize();
    },
    class_definition: function class_definition() {
        return {};
    },

    id_column: function id_column() {
        return this._class.id_column || null;
    },

    _initialize_class: function _initialize_class() {
        var c = this._class;
        _.forEach(c.member_types, function (type, name) {
            if (_.isUndefined(c.member_defaults[name])) {
                c.member_defaults[name] = null;
            }
        });
    },
    _init_instance: function _init_instance(mixed) {
        if (_.isObject(mixed)) {
            var self = this;
            var c = this._class;
            _.forEach(mixed, function (value, key) {
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
        this._endpoints = $.extend({
            GET: null,
            PUT: null,
            POST: null,
            DELETE: null
        }, this._endpoints || {});
    },

    is_new: function is_new() {
        var self = this,
            result = true;
        $.each(this._class.primary_keys, function () {
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
                _this2._fetch_resolve(data);
                _this2.fetched();
                promise.resolve(_this2, data);
            },
            error: function error(xhr, message) {
                _this2._fetch_reject();
                promise.reject(new Error(message));
            },
            dataType: "json"
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
            }
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
        $.ajax(url, $.extend({
            dataType: "json",
            contentType: "application/json",
            context: this,
            method: method
        }, data));
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
        $.each(data, function (member) {
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

    _store_reject: function _store_reject(xhr, message) {}
});

ZeskObject.mixedToId = function (mixed) {
    if (_.isNumber(mixed)) {
        return parseInt(mixed, 10);
    }
    if (_.isObject(mixed)) {
        return mixed;
    }
};

ZeskObject.fetchById = function (Constructor, mixed) {
    var result = new Constructor(mixed);
    return result.fetch();
};

module.exports = ZeskObject;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9aZXNrT2JqZWN0LmpzIl0sIm5hbWVzIjpbIl8iLCJyZXF1aXJlIiwiWmVza0V4Y2VwdGlvbiIsIiQiLCJxcyIsIlJTVlAiLCJmb3JtYXQiLCJaZXNrT2JqZWN0IiwibWl4ZWQiLCJvcHRpb25zIiwiX2NsYXNzIiwiZXh0ZW5kIiwiaWRfY29sdW1uIiwicHJpbWFyeV9rZXlzIiwibWVtYmVyX3R5cGVzIiwibWVtYmVyX2RlZmF1bHRzIiwiY2xhc3NfZGVmaW5pdGlvbiIsIl9pbml0aWFsaXplX2NsYXNzIiwiX29wdGlvbnMiLCJpc09iamVjdCIsImNsb25lRGVlcCIsIl9uZWVkX2xvYWQiLCJfaW5pdF9pbnN0YW5jZSIsIl9vcmlnaW5hbCIsIl9tZW1iZXJzIiwiaW5pdGlhbGl6ZSIsIk9iamVjdCIsImFzc2lnbiIsInByb3RvdHlwZSIsInJlc3VsdCIsImMiLCJmb3JFYWNoIiwidHlwZSIsImtleSIsImZldGNoZWQiLCJuYW1lIiwiaXNVbmRlZmluZWQiLCJzZWxmIiwidmFsdWUiLCJpc051bWJlciIsImlzU3RyaW5nIiwiY29uc29sZSIsImxvZyIsImNvbnN0cnVjdG9yIiwic3VwZXJfaW5pdGlhbGl6ZSIsIl9lbmRwb2ludHMiLCJHRVQiLCJQVVQiLCJQT1NUIiwiREVMRVRFIiwiaXNfbmV3IiwiZWFjaCIsImZldGNoIiwiY2xhc3MiLCJwcm9taXNlIiwiUHJvbWlzZSIsInVybCIsIl9mb3JtYXRfdXJsIiwiX2FqYXgiLCJzdWNjZXNzIiwiX2ZldGNoX3Jlc29sdmUiLCJkYXRhIiwicmVzb2x2ZSIsImVycm9yIiwieGhyIiwibWVzc2FnZSIsIl9mZXRjaF9yZWplY3QiLCJyZWplY3QiLCJFcnJvciIsImRhdGFUeXBlIiwic3RvcmUiLCJfc3RvcmVfcmVzb2x2ZSIsIl9zdG9yZV9yZWplY3QiLCJxIiwic3RyaW5naWZ5IiwidSIsImluZGV4T2YiLCJtZXRob2QiLCJKU09OIiwiYWpheCIsImNvbnRlbnRUeXBlIiwiY29udGV4dCIsIl9yZXNvbHZlX29iamVjdCIsIm1lbWJlciIsInN1YnN0ciIsIm1peGVkVG9JZCIsInBhcnNlSW50IiwiZmV0Y2hCeUlkIiwiQ29uc3RydWN0b3IiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOztBQUFBOzs7OztBQUtBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQSxJQUFJQSxJQUFJQyxRQUFRLFFBQVIsQ0FBUjtBQUNBLElBQUlDLGdCQUFnQkQsUUFBUSxpQkFBUixDQUFwQjs7QUFFQSxJQUFJRSxJQUFJRixRQUFRLFFBQVIsQ0FBUjtBQUNBLElBQUlHLEtBQUtILFFBQVEsSUFBUixDQUFUOztBQUVBLElBQUlJLE9BQU9KLFFBQVEsaUJBQVIsQ0FBWDtBQUNBLElBQUlLLFNBQVNMLFFBQVEsbUJBQVIsQ0FBYjs7QUFFQSxJQUFJTSxhQUFhLFNBQWJBLFVBQWEsQ0FBU0MsS0FBVCxFQUFnQkMsT0FBaEIsRUFBeUI7QUFDdEMsU0FBS0MsTUFBTCxHQUFjUCxFQUFFUSxNQUFGLENBQ1Y7QUFDSUMsbUJBQVcsSUFEZjtBQUVJQyxzQkFBYyxFQUZsQjtBQUdJQyxzQkFBYyxFQUhsQjtBQUlJQyx5QkFBaUI7QUFKckIsS0FEVSxFQU9WLEtBQUtMLE1BQUwsSUFBZSxLQUFLTSxnQkFBTCxFQVBMLENBQWQ7QUFTQSxTQUFLQyxpQkFBTDtBQUNBLFNBQUtDLFFBQUwsR0FBZ0JsQixFQUFFbUIsUUFBRixDQUFXVixPQUFYLElBQXNCVCxFQUFFb0IsU0FBRixDQUFZWCxPQUFaLENBQXRCLEdBQTZDLEVBQTdEO0FBQ0EsU0FBS1ksVUFBTCxHQUFrQixLQUFsQjtBQUNBbEIsTUFBRVEsTUFBRixDQUFTLElBQVQsRUFBZSxLQUFLRCxNQUFMLENBQVlLLGVBQTNCO0FBQ0EsUUFBSVAsS0FBSixFQUFXO0FBQ1AsYUFBS2MsY0FBTCxDQUFvQmQsS0FBcEI7QUFDSDtBQUNELFNBQUtlLFNBQUwsR0FBaUJwQixFQUFFUSxNQUFGLENBQVMsRUFBVCxFQUFhLEtBQUthLFFBQUwsRUFBYixDQUFqQjtBQUNBLFNBQUtDLFVBQUw7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dUIsQ0FBRTtBQS9LUixDQUFwQzs7QUFrTEExRCxXQUFXOEUsU0FBWCxHQUF1QixVQUFTN0UsS0FBVCxFQUFnQjtBQUNuQyxRQUFJUixFQUFFdUMsUUFBRixDQUFXL0IsS0FBWCxDQUFKLEVBQXVCO0FBQ25CLGVBQU84RSxTQUFTOUUsS0FBVCxFQUFnQixFQUFoQixDQUFQO0FBQ0g7QUFDRCxRQUFJUixFQUFFbUIsUUFBRixDQUFXWCxLQUFYLENBQUosRUFBdUI7QUFDbkIsZUFBT0EsS0FBUDtBQUNIO0FBQ0osQ0FQRDs7QUFTQUQsV0FBV2dGLFNBQVgsR0FBdUIsVUFBU0MsV0FBVCxFQUFzQmhGLEtBQXRCLEVBQTZCO0FBQ2hELFFBQUlxQixTQUFTLElBQUkyRCxXQUFKLENBQWdCaEYsS0FBaEIsQ0FBYjtBQUNBLFdBQU9xQixPQUFPdUIsS0FBUCxFQUFQO0FBQ0gsQ0FIRDs7QUFLQXFDLE9BQU9DLE9BQVAsR0FBaUJuRixVQUFqQiIsImZpbGUiOiJaZXNrT2JqZWN0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqICRJZCRcbiAqXG4gKiBDb3B5cmlnaHQgKEMpIDIwMTcgTWFya2V0IEFjdW1lbiwgSW5jLiBBbGwgcmlnaHRzIHJlc2VydmVkXG4gKi9cbi8vIGltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbi8vIGltcG9ydCBaZXNrRXhjZXB0aW9uIGZyb20gXCIuL1plc2tFeGNlcHRpb25cIjtcblxuLy8gaW1wb3J0ICQgZnJvbSBcImpxdWVyeVwiO1xuLy8gaW1wb3J0IHFzIGZyb20gXCJxc1wiO1xuXG5sZXQgXyA9IHJlcXVpcmUoXCJsb2Rhc2hcIik7XG5sZXQgWmVza0V4Y2VwdGlvbiA9IHJlcXVpcmUoXCIuL1plc2tFeGNlcHRpb25cIik7XG5cbmxldCAkID0gcmVxdWlyZShcImpxdWVyeVwiKTtcbmxldCBxcyA9IHJlcXVpcmUoXCJxc1wiKTtcblxudmFyIFJTVlAgPSByZXF1aXJlKFwicnN2cC10aGF0LXdvcmtzXCIpO1xudmFyIGZvcm1hdCA9IHJlcXVpcmUoXCJzdHJpbmctZm9ybWF0LW9ialwiKTtcblxudmFyIFplc2tPYmplY3QgPSBmdW5jdGlvbihtaXhlZCwgb3B0aW9ucykge1xuICAgIHRoaXMuX2NsYXNzID0gJC5leHRlbmQoXG4gICAgICAgIHtcbiAgICAgICAgICAgIGlkX2NvbHVtbjogbnVsbCxcbiAgICAgICAgICAgIHByaW1hcnlfa2V5czogW10sXG4gICAgICAgICAgICBtZW1iZXJfdHlwZXM6IHt9LFxuICAgICAgICAgICAgbWVtYmVyX2RlZmF1bHRzOiB7fSxcbiAgICAgICAgfSxcbiAgICAgICAgdGhpcy5fY2xhc3MgfHwgdGhpcy5jbGFzc19kZWZpbml0aW9uKClcbiAgICApO1xuICAgIHRoaXMuX2luaXRpYWxpemVfY2xhc3MoKTtcbiAgICB0aGlzLl9vcHRpb25zID0gXy5pc09iamVjdChvcHRpb25zKSA/IF8uY2xvbmVEZWVwKG9wdGlvbnMpIDoge307XG4gICAgdGhpcy5fbmVlZF9sb2FkID0gZmFsc2U7XG4gICAgJC5leHRlbmQodGhpcywgdGhpcy5fY2xhc3MubWVtYmVyX2RlZmF1bHRzKTtcbiAgICBpZiAobWl4ZWQpIHtcbiAgICAgICAgdGhpcy5faW5pdF9pbnN0YW5jZShtaXhlZCk7XG4gICAgfVxuICAgIHRoaXMuX29yaWdpbmFsID0gJC5leHRlbmQoe30sIHRoaXMuX21lbWJlcnMoKSk7XG4gICAgdGhpcy5pbml0aWFsaXplKCk7XG59O1xuXG5PYmplY3QuYXNzaWduKFplc2tPYmplY3QucHJvdG90eXBlLCB7XG4gICAgX21lbWJlcnM6IGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzdWx0ID0ge307XG4gICAgICAgIGxldCBjID0gdGhpcy5fY2xhc3M7XG4gICAgICAgIF8uZm9yRWFjaCh0aGlzLl9jbGFzcy5tZW1iZXJfdHlwZXMsICh0eXBlLCBrZXkpID0+IHtcbiAgICAgICAgICAgIHJlc3VsdFtrZXldID0gdGhpc1trZXldIHx8IGMubWVtYmVyX2RlZmF1bHRzW2tleV07XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIGFmdGVyIG9iamVjdCBpcyBpbml0aWFsaXplZCB3aXRoIG5ldyB2YWx1ZXNcbiAgICAgKi9cbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbigpIHt9LFxuICAgIC8qKlxuICAgICAqIENhbGxlZCBhZnRlciBpdGVtIGlzIGZldGNoZWQgYW5kIGluaXRpYWxpemVkIGZyb20gcmVtb3RlIHNvdXJjZVxuICAgICAqL1xuICAgIGZldGNoZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmluaXRpYWxpemUoKTtcbiAgICB9LFxuICAgIGNsYXNzX2RlZmluaXRpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge307XG4gICAgfSxcblxuICAgIGlkX2NvbHVtbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jbGFzcy5pZF9jb2x1bW4gfHwgbnVsbDtcbiAgICB9LFxuXG4gICAgX2luaXRpYWxpemVfY2xhc3M6IGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgYyA9IHRoaXMuX2NsYXNzO1xuICAgICAgICBfLmZvckVhY2goYy5tZW1iZXJfdHlwZXMsICh0eXBlLCBuYW1lKSA9PiB7XG4gICAgICAgICAgICBpZiAoXy5pc1VuZGVmaW5lZChjLm1lbWJlcl9kZWZhdWx0c1tuYW1lXSkpIHtcbiAgICAgICAgICAgICAgICBjLm1lbWJlcl9kZWZhdWx0c1tuYW1lXSA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgX2luaXRfaW5zdGFuY2U6IGZ1bmN0aW9uKG1peGVkKSB7XG4gICAgICAgIGlmIChfLmlzT2JqZWN0KG1peGVkKSkge1xuICAgICAgICAgICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgbGV0IGMgPSB0aGlzLl9jbGFzcztcbiAgICAgICAgICAgIF8uZm9yRWFjaChtaXhlZCwgKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIWMubWVtYmVyX3R5cGVzW2tleV0pIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZltrZXldID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIC8vIEV4dHJhIHZhbHVlLCBzdG9yZSBhcyB1c3VhbCBmb3Igbm93LlxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNlbGZba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLl9uZWVkX2xvYWQgPSBmYWxzZTtcbiAgICAgICAgfSBlbHNlIGlmICgoXy5pc051bWJlcihtaXhlZCkgfHwgXy5pc1N0cmluZyhtaXhlZCkpICYmIHRoaXMuaWRfY29sdW1uKCkpIHtcbiAgICAgICAgICAgIHRoaXNbdGhpcy5fY2xhc3MuaWRfY29sdW1uXSA9IG1peGVkO1xuICAgICAgICAgICAgdGhpcy5fbmVlZF9sb2FkID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVW5rbm93biBpbml0IHR5cGUgZm9yIFwiICsgdGhpcy5jb25zdHJ1Y3Rvci5uYW1lICsgXCI6IFwiICsgbWl4ZWQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHN1cGVyX2luaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9lbmRwb2ludHMgPSAkLmV4dGVuZChcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBHRVQ6IG51bGwsXG4gICAgICAgICAgICAgICAgUFVUOiBudWxsLFxuICAgICAgICAgICAgICAgIFBPU1Q6IG51bGwsXG4gICAgICAgICAgICAgICAgREVMRVRFOiBudWxsLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRoaXMuX2VuZHBvaW50cyB8fCB7fVxuICAgICAgICApO1xuICAgIH0sXG5cbiAgICBpc19uZXc6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgICAgICByZXN1bHQgPSB0cnVlO1xuICAgICAgICAkLmVhY2godGhpcy5fY2xhc3MucHJpbWFyeV9rZXlzLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChzZWxmW3RoaXNdKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuXG4gICAgZmV0Y2g6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKCFfLmlzT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgICAgICAgICBvcHRpb25zID0ge307XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLl9lbmRwb2ludHMuR0VUKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgWmVza0V4Y2VwdGlvbihcIntjbGFzc30gZG9lcyBub3QgaGF2ZSBHRVQgZW5kcG9pbnRcIiwgeyBjbGFzczogdGhpcy5jb25zdHJ1Y3Rvci5uYW1lIH0pO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwcm9taXNlID0gbmV3IFJTVlAuUHJvbWlzZSgpO1xuICAgICAgICB2YXIgdXJsID0gdGhpcy5fZm9ybWF0X3VybCh0aGlzLl9lbmRwb2ludHMuR0VULCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5fYWpheChcIkdFVFwiLCB1cmwsIHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGRhdGEgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX2ZldGNoX3Jlc29sdmUoZGF0YSk7XG4gICAgICAgICAgICAgICAgdGhpcy5mZXRjaGVkKCk7XG4gICAgICAgICAgICAgICAgcHJvbWlzZS5yZXNvbHZlKHRoaXMsIGRhdGEpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVycm9yOiAoeGhyLCBtZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZmV0Y2hfcmVqZWN0KCk7XG4gICAgICAgICAgICAgICAgcHJvbWlzZS5yZWplY3QobmV3IEVycm9yKG1lc3NhZ2UpKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkYXRhVHlwZTogXCJqc29uXCIsXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9LFxuXG4gICAgc3RvcmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcHJvbWlzZSA9IG5ldyBSU1ZQLlByb21pc2UoKTtcbiAgICAgICAgdGhpcy5fYWpheCh0aGlzLmlzX25ldygpID8gXCJQT1NUXCIgOiBcIlBVVFwiLCB0aGlzLl9mb3JtYXRfdXJsKHRoaXMuX2VuZHBvaW50cy5QVVQpLCB7XG4gICAgICAgICAgICBzdWNjZXNzOiBkYXRhID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdG9yZV9yZXNvbHZlKGRhdGEpO1xuICAgICAgICAgICAgICAgIHByb21pc2UucmVzb2x2ZSh0aGlzLCBkYXRhKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvcjogKHhociwgbWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX3N0b3JlX3JlamVjdCh4aHIsIG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIHByb21pc2UucmVqZWN0KG5ldyBFcnJvcihtZXNzYWdlKSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfSxcblxuICAgIF9mb3JtYXRfdXJsOiBmdW5jdGlvbih1cmwsIG9wdGlvbnMgPSB7fSkge1xuICAgICAgICB2YXIgcSA9IHFzLnN0cmluZ2lmeShvcHRpb25zKTtcbiAgICAgICAgdmFyIHUgPSBmb3JtYXQodXJsLCB0aGlzKTtcbiAgICAgICAgaWYgKCFxKSB7XG4gICAgICAgICAgICByZXR1cm4gdTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdSArIChxICYmIHUuaW5kZXhPZihcIj9cIikgPj0gMCA/IFwiJlwiIDogXCI/XCIpICsgcTtcbiAgICB9LFxuXG4gICAgX2FqYXg6IGZ1bmN0aW9uKG1ldGhvZCwgdXJsLCBkYXRhKSB7XG4gICAgICAgIGRhdGEgPSBkYXRhIHx8IHt9O1xuICAgICAgICBpZiAoXy5pc09iamVjdChkYXRhLmRhdGEpKSB7XG4gICAgICAgICAgICBkYXRhLmRhdGEgPSBKU09OLnN0cmluZ2lmeShkYXRhLmRhdGEpO1xuICAgICAgICB9XG4gICAgICAgICQuYWpheChcbiAgICAgICAgICAgIHVybCxcbiAgICAgICAgICAgICQuZXh0ZW5kKFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvblwiLFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQ6IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZGF0YVxuICAgICAgICAgICAgKVxuICAgICAgICApO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSdW4gb24gZWFjaCBjaGlsZCBvYmplY3QgYXMgZmV0Y2hlZCBhcyBhIG1lbWJlciBvZiB0aGlzIG9iamVjdC4gU2hvdWxkIGNvbnZlcnQgdG8gYSBKYXZhU2NyaXB0IGNsYXNzLlxuICAgICAqL1xuICAgIF9yZXNvbHZlX29iamVjdDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9LFxuICAgIF9mZXRjaF9yZXNvbHZlOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIGMgPSB0aGlzLl9jbGFzcztcbiAgICAgICAgJC5lYWNoKGRhdGEsIGZ1bmN0aW9uKG1lbWJlcikge1xuICAgICAgICAgICAgaWYgKG1lbWJlci5zdWJzdHIoMCwgMSkgPT09IFwiX1wiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGMubWVtYmVyX3R5cGVzW21lbWJlcl0pIHtcbiAgICAgICAgICAgICAgICBpZiAoXy5pc09iamVjdCh0aGlzKSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmW21lbWJlcl0gPSBzZWxmLl9yZXNvbHZlX29iamVjdCh0aGlzKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzZWxmW21lbWJlcl0gPSB0aGlzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX25lZWRfbG9hZCA9IGZhbHNlO1xuICAgICAgICBjb25zb2xlLmxvZyhcIkxvYWRlZCBcIiArIHRoaXMuY29uc3RydWN0b3IubmFtZSArIFwiICNcIiArIHRoaXNbdGhpcy5fY2xhc3MuaWRfY29sdW1uXSk7XG4gICAgfSxcblxuICAgIF9mZXRjaF9yZWplY3Q6IGZ1bmN0aW9uKHhociwgbWVzc2FnZSkge30sXG4gICAgX3N0b3JlX3Jlc29sdmU6IGZ1bmN0aW9uKGRhdGEpIHt9LFxuXG4gICAgX3N0b3JlX3JlamVjdDogZnVuY3Rpb24oeGhyLCBtZXNzYWdlKSB7fSxcbn0pO1xuXG5aZXNrT2JqZWN0Lm1peGVkVG9JZCA9IGZ1bmN0aW9uKG1peGVkKSB7XG4gICAgaWYgKF8uaXNOdW1iZXIobWl4ZWQpKSB7XG4gICAgICAgIHJldHVybiBwYXJzZUludChtaXhlZCwgMTApO1xuICAgIH1cbiAgICBpZiAoXy5pc09iamVjdChtaXhlZCkpIHtcbiAgICAgICAgcmV0dXJuIG1peGVkO1xuICAgIH1cbn07XG5cblplc2tPYmplY3QuZmV0Y2hCeUlkID0gZnVuY3Rpb24oQ29uc3RydWN0b3IsIG1peGVkKSB7XG4gICAgdmFyIHJlc3VsdCA9IG5ldyBDb25zdHJ1Y3RvcihtaXhlZCk7XG4gICAgcmV0dXJuIHJlc3VsdC5mZXRjaCgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBaZXNrT2JqZWN0O1xuIl19