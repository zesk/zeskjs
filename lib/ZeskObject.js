"use strict";

/**
 * Copyright &copy; 2017 Market Acumen, Inc.
 */
var _ = require("lodash");
var ZeskException = require("./ZeskException");

var $ = require("jquery");
var qs = require("qs");

var RSVP = require("rsvp-that-works");
var format = require("string-format-obj");

var ZeskObject = function ZeskObject(mixed, options) {
    this._options = _.isObject(options) ? _.cloneDeep(options) : {};
    this._class = $.extend({
        id_column: null,
        primary_keys: [],
        member_types: {},
        member_defaults: {}
    }, this._options.class || {}, this._class || this.class_definition());
    this._initialize_class();
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
     * Called after object is created with "new" 
     */
    initialize: function initialize() {},
    /**
     * Called after item is fetched and initialized from remote source
     */
    fetched: function fetched() {},

    /**
     * Return the class definition
     */
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9aZXNrT2JqZWN0LmpzIl0sIm5hbWVzIjpbIl8iLCJyZXF1aXJlIiwiWmVza0V4Y2VwdGlvbiIsIiQiLCJxcyIsIlJTVlAiLCJmb3JtYXQiLCJaZXNrT2JqZWN0IiwibWl4ZWQiLCJvcHRpb25zIiwiX29wdGlvbnMiLCJpc09iamVjdCIsImNsb25lRGVlcCIsIl9jbGFzcyIsImV4dGVuZCIsImlkX2NvbHVtbiIsInByaW1hcnlfa2V5cyIsIm1lbWJlcl90eXBlcyIsIm1lbWJlcl9kZWZhdWx0cyIsImNsYXNzIiwiY2xhc3NfZGVmaW5pdGlvbiIsIl9pbml0aWFsaXplX2NsYXNzIiwiX25lZWRfbG9hZCIsIl9pbml0X2luc3RhbmNlIiwiX29yaWdpbmFsIiwiX21lbWJlcnMiLCJpbml0aWFsaXplIiwiT2JqZWN0IiwiYXNzaWduIiwicHJvdG90eXBlIiwicmVzdWx0IiwiYyIsImZvckVhY2giLCJ0eXBlIiwia2V5IiwiZmV0Y2hlZCIsIm5hbWUiLCJpc1VuZGVmaW5lZCIsInNlbGYiLCJ2YWx1ZSIsImlzTnVtYmVyIiwiaXNTdHJpbmciLCJjb25zb2xlIiwibG9nIiwiY29uc3RydWN0b3IiLCJzdXBlcl9pbml0aWFsaXplIiwiX2VuZHBvaW50cyIsIkdFVCIsIlBVVCIsIlBPU1QiLCJERUxFVEUiLCJpc19uZXciLCJlYWNoIiwiZmV0Y2giLCJwcm9taXNlIiwiUHJvbWlzZSIsInVybCIsIl9mb3JtYXRfdXJsIiwiX2FqYXgiLCJzdWNjZXNzIiwiX2ZldGNoX3Jlc29sdmUiLCJkYXRhIiwicmVzb2x2ZSIsImVycm9yIiwieGhyIiwibWVzc2FnZSIsIl9mZXRjaF9yZWplY3QiLCJyZWplY3QiLCJFcnJvciIsImRhdGFUeXBlIiwic3RvcmUiLCJfc3RvcmVfcmVzb2x2ZSIsIl9zdG9yZV9yZWplY3QiLCJxIiwic3RyaW5naWZ5IiwidSIsImluZGV4T2YiLCJtZXRob2QiLCJKU09OIiwiYWpheCIsImNvbnRlbnRUeXBlIiwiY29udGV4dCIsIl9yZXNvbHZlX29iamVjdCIsIm1lbWJlciIsInN1YnN0ciIsIm1peGVkVG9JZCIsInBhcnNlSW50IiwiZmV0Y2hCeUlkIiwiQ29uc3RydWN0b3IiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOztBQUFBOzs7QUFHQSxJQUFJQSxJQUFJQyxRQUFRLFFBQVIsQ0FBUjtBQUNBLElBQUlDLGdCQUFnQkQsUUFBUSxpQkFBUixDQUFwQjs7QUFFQSxJQUFJRSxJQUFJRixRQUFRLFFBQVIsQ0FBUjtBQUNBLElBQUlHLEtBQUtILFFBQVEsSUFBUixDQUFUOztBQUVBLElBQUlJLE9BQU9KLFFBQVEsaUJBQVIsQ0FBWDtBQUNBLElBQUlLLFNBQVNMLFFBQVEsbUJBQVIsQ0FBYjs7QUFFQSxJQUFJTSxhQUFhLFNBQWJBLFVBQWEsQ0FBU0MsS0FBVCxFQUFnQkMsT0FBaEIsRUFBeUI7QUFDdEMsU0FBS0MsUUFBTCxHQUFnQlYsRUFBRVcsUUFBRixDQUFXRixPQUFYLElBQXNCVCxFQUFFWSxTQUFGLENBQVlILE9BQVosQ0FBdEIsR0FBNkMsRUFBN0Q7QUFDQSxTQUFLSSxNQUFMLEdBQWNWLEVBQUVXLE1BQUYsQ0FDVjtBQUNJQyxtQkFBVyxJQURmO0FBRUlDLHNCQUFjLEVBRmxCO0FBR0lDLHNCQUFjLEVBSGxCO0FBSUlDLHlCQUFpQjtBQUpyQixLQURVLEVBT1YsS0FBS1IsUUFBTCxDQUFjUyxLQUFkLElBQXVCLEVBUGIsRUFRVixLQUFLTixNQUFMLElBQWUsS0FBS08sZ0JBQUwsRUFSTCxDQUFkO0FBVUEsU0FBS0MsaUJBQUw7QUFDQSxTQUFLQyxVQUFMLEdBQWtCLEtBQWxCO0FBQ0FuQixNQUFFVyxNQUFGLENBQVMsSUFBVCxFQUFlLEtBQUtELE1BQUwsQ0FBWUssZUFBM0I7QUFDQSxRQUFJVixLQUFKLEVBQVc7QUFDUCxhQUFLZSxjQUFMLENBQW9CZixLQUFwQjtBQUNIO0FBQ0QsU0FBS2dCLFNBQUwsR0FBaUJyQixFQUFFVyxNQUFGLENBQVMsRUFBVCxFQUFhLEtBQUtXLFFBQUwsRUFBYixDQUFqQjtBQUNB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QUU7QUFoTFIsQ0FBcEM7O0FBbUxBMUQsV0FBVzhFLFNBQVgsR0FBdUIsVUFBUzdFLEtBQVQsRUFBZ0I7QUFDbkMsUUFBSVIsRUFBRXdDLFFBQUYsQ0FBV2hDLEtBQVgsQ0FBSixFQUF1QjtBQUNuQixlQUFPOEUsU0FBUzlFLEtBQVQsRUFBZ0IsRUFBaEIsQ0FBUDtBQUNIO0FBQ0QsUUFBSVIsRUFBRVcsUUFBRixDQUFXSCxLQUFYLENBQUosRUFBdUI7QUFDbkIsZUFBT0EsS0FBUDtBQUNIO0FBQ0osQ0FQRDs7QUFTQUQsV0FBV2dGLFNBQVgsR0FBdUIsVUFBU0MsV0FBVCxFQUFzQmhGLEtBQXRCLEVBQTZCO0FBQ2hELFFBQUlzQixTQUFTLElBQUkwRCxXQUFKLENBQWdCaEYsS0FBaEIsQ0FBYjtBQUNBLFdBQU9zQixPQUFPdUIsS0FBUCxFQUFQO0FBQ0gsQ0FIRDs7QUFLQW9DLE9BQU9DLE9BQVAsR0FBaUJuRixVQUFqQiIsImZpbGUiOiJaZXNrT2JqZWN0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgJmNvcHk7IDIwMTcgTWFya2V0IEFjdW1lbiwgSW5jLlxuICovXG5sZXQgXyA9IHJlcXVpcmUoXCJsb2Rhc2hcIik7XG5sZXQgWmVza0V4Y2VwdGlvbiA9IHJlcXVpcmUoXCIuL1plc2tFeGNlcHRpb25cIik7XG5cbmxldCAkID0gcmVxdWlyZShcImpxdWVyeVwiKTtcbmxldCBxcyA9IHJlcXVpcmUoXCJxc1wiKTtcblxudmFyIFJTVlAgPSByZXF1aXJlKFwicnN2cC10aGF0LXdvcmtzXCIpO1xudmFyIGZvcm1hdCA9IHJlcXVpcmUoXCJzdHJpbmctZm9ybWF0LW9ialwiKTtcblxudmFyIFplc2tPYmplY3QgPSBmdW5jdGlvbihtaXhlZCwgb3B0aW9ucykge1xuICAgIHRoaXMuX29wdGlvbnMgPSBfLmlzT2JqZWN0KG9wdGlvbnMpID8gXy5jbG9uZURlZXAob3B0aW9ucykgOiB7fTtcbiAgICB0aGlzLl9jbGFzcyA9ICQuZXh0ZW5kKFxuICAgICAgICB7XG4gICAgICAgICAgICBpZF9jb2x1bW46IG51bGwsXG4gICAgICAgICAgICBwcmltYXJ5X2tleXM6IFtdLFxuICAgICAgICAgICAgbWVtYmVyX3R5cGVzOiB7fSxcbiAgICAgICAgICAgIG1lbWJlcl9kZWZhdWx0czoge30sXG4gICAgICAgIH0sXG4gICAgICAgIHRoaXMuX29wdGlvbnMuY2xhc3MgfHwge30sXG4gICAgICAgIHRoaXMuX2NsYXNzIHx8IHRoaXMuY2xhc3NfZGVmaW5pdGlvbigpXG4gICAgKTtcbiAgICB0aGlzLl9pbml0aWFsaXplX2NsYXNzKCk7XG4gICAgdGhpcy5fbmVlZF9sb2FkID0gZmFsc2U7XG4gICAgJC5leHRlbmQodGhpcywgdGhpcy5fY2xhc3MubWVtYmVyX2RlZmF1bHRzKTtcbiAgICBpZiAobWl4ZWQpIHtcbiAgICAgICAgdGhpcy5faW5pdF9pbnN0YW5jZShtaXhlZCk7XG4gICAgfVxuICAgIHRoaXMuX29yaWdpbmFsID0gJC5leHRlbmQoe30sIHRoaXMuX21lbWJlcnMoKSk7XG4gICAgdGhpcy5pbml0aWFsaXplKCk7XG59O1xuXG5PYmplY3QuYXNzaWduKFplc2tPYmplY3QucHJvdG90eXBlLCB7XG4gICAgX21lbWJlcnM6IGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgcmVzdWx0ID0ge307XG4gICAgICAgIGxldCBjID0gdGhpcy5fY2xhc3M7XG4gICAgICAgIF8uZm9yRWFjaCh0aGlzLl9jbGFzcy5tZW1iZXJfdHlwZXMsICh0eXBlLCBrZXkpID0+IHtcbiAgICAgICAgICAgIHJlc3VsdFtrZXldID0gdGhpc1trZXldIHx8IGMubWVtYmVyX2RlZmF1bHRzW2tleV07XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIGFmdGVyIG9iamVjdCBpcyBjcmVhdGVkIHdpdGggXCJuZXdcIiBcbiAgICAgKi9cbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbigpIHt9LFxuICAgIC8qKlxuICAgICAqIENhbGxlZCBhZnRlciBpdGVtIGlzIGZldGNoZWQgYW5kIGluaXRpYWxpemVkIGZyb20gcmVtb3RlIHNvdXJjZVxuICAgICAqL1xuICAgIGZldGNoZWQ6IGZ1bmN0aW9uKCkge30sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gdGhlIGNsYXNzIGRlZmluaXRpb25cbiAgICAgKi9cbiAgICBjbGFzc19kZWZpbml0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHt9O1xuICAgIH0sXG5cbiAgICBpZF9jb2x1bW46IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2xhc3MuaWRfY29sdW1uIHx8IG51bGw7XG4gICAgfSxcblxuICAgIF9pbml0aWFsaXplX2NsYXNzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IGMgPSB0aGlzLl9jbGFzcztcbiAgICAgICAgXy5mb3JFYWNoKGMubWVtYmVyX3R5cGVzLCAodHlwZSwgbmFtZSkgPT4ge1xuICAgICAgICAgICAgaWYgKF8uaXNVbmRlZmluZWQoYy5tZW1iZXJfZGVmYXVsdHNbbmFtZV0pKSB7XG4gICAgICAgICAgICAgICAgYy5tZW1iZXJfZGVmYXVsdHNbbmFtZV0gPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIF9pbml0X2luc3RhbmNlOiBmdW5jdGlvbihtaXhlZCkge1xuICAgICAgICBpZiAoXy5pc09iamVjdChtaXhlZCkpIHtcbiAgICAgICAgICAgIGxldCBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIGxldCBjID0gdGhpcy5fY2xhc3M7XG4gICAgICAgICAgICBfLmZvckVhY2gobWl4ZWQsICh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFjLm1lbWJlcl90eXBlc1trZXldKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGZba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAvLyBFeHRyYSB2YWx1ZSwgc3RvcmUgYXMgdXN1YWwgZm9yIG5vdy5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZWxmW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5fbmVlZF9sb2FkID0gZmFsc2U7XG4gICAgICAgIH0gZWxzZSBpZiAoKF8uaXNOdW1iZXIobWl4ZWQpIHx8IF8uaXNTdHJpbmcobWl4ZWQpKSAmJiB0aGlzLmlkX2NvbHVtbigpKSB7XG4gICAgICAgICAgICB0aGlzW3RoaXMuX2NsYXNzLmlkX2NvbHVtbl0gPSBtaXhlZDtcbiAgICAgICAgICAgIHRoaXMuX25lZWRfbG9hZCA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlVua25vd24gaW5pdCB0eXBlIGZvciBcIiArIHRoaXMuY29uc3RydWN0b3IubmFtZSArIFwiOiBcIiArIG1peGVkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBzdXBlcl9pbml0aWFsaXplOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fZW5kcG9pbnRzID0gJC5leHRlbmQoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgR0VUOiBudWxsLFxuICAgICAgICAgICAgICAgIFBVVDogbnVsbCxcbiAgICAgICAgICAgICAgICBQT1NUOiBudWxsLFxuICAgICAgICAgICAgICAgIERFTEVURTogbnVsbCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0aGlzLl9lbmRwb2ludHMgfHwge31cbiAgICAgICAgKTtcbiAgICB9LFxuXG4gICAgaXNfbmV3OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgICAgICAgcmVzdWx0ID0gdHJ1ZTtcbiAgICAgICAgJC5lYWNoKHRoaXMuX2NsYXNzLnByaW1hcnlfa2V5cywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoc2VsZlt0aGlzXSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcblxuICAgIGZldGNoOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIGlmICghXy5pc09iamVjdChvcHRpb25zKSkge1xuICAgICAgICAgICAgb3B0aW9ucyA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5fZW5kcG9pbnRzLkdFVCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFplc2tFeGNlcHRpb24oXCJ7Y2xhc3N9IGRvZXMgbm90IGhhdmUgR0VUIGVuZHBvaW50XCIsIHsgY2xhc3M6IHRoaXMuY29uc3RydWN0b3IubmFtZSB9KTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcHJvbWlzZSA9IG5ldyBSU1ZQLlByb21pc2UoKTtcbiAgICAgICAgdmFyIHVybCA9IHRoaXMuX2Zvcm1hdF91cmwodGhpcy5fZW5kcG9pbnRzLkdFVCwgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMuX2FqYXgoXCJHRVRcIiwgdXJsLCB7XG4gICAgICAgICAgICBzdWNjZXNzOiBkYXRhID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9mZXRjaF9yZXNvbHZlKGRhdGEpO1xuICAgICAgICAgICAgICAgIHRoaXMuZmV0Y2hlZCgpO1xuICAgICAgICAgICAgICAgIHByb21pc2UucmVzb2x2ZSh0aGlzLCBkYXRhKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvcjogKHhociwgbWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX2ZldGNoX3JlamVjdCgpO1xuICAgICAgICAgICAgICAgIHByb21pc2UucmVqZWN0KG5ldyBFcnJvcihtZXNzYWdlKSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvblwiLFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfSxcblxuICAgIHN0b3JlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHByb21pc2UgPSBuZXcgUlNWUC5Qcm9taXNlKCk7XG4gICAgICAgIHRoaXMuX2FqYXgodGhpcy5pc19uZXcoKSA/IFwiUE9TVFwiIDogXCJQVVRcIiwgdGhpcy5fZm9ybWF0X3VybCh0aGlzLl9lbmRwb2ludHMuUFVUKSwge1xuICAgICAgICAgICAgc3VjY2VzczogZGF0YSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3RvcmVfcmVzb2x2ZShkYXRhKTtcbiAgICAgICAgICAgICAgICBwcm9taXNlLnJlc29sdmUodGhpcywgZGF0YSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXJyb3I6ICh4aHIsIG1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdG9yZV9yZWplY3QoeGhyLCBtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICBwcm9taXNlLnJlamVjdChuZXcgRXJyb3IobWVzc2FnZSkpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH0sXG5cbiAgICBfZm9ybWF0X3VybDogZnVuY3Rpb24odXJsLCBvcHRpb25zID0ge30pIHtcbiAgICAgICAgdmFyIHEgPSBxcy5zdHJpbmdpZnkob3B0aW9ucyk7XG4gICAgICAgIHZhciB1ID0gZm9ybWF0KHVybCwgdGhpcyk7XG4gICAgICAgIGlmICghcSkge1xuICAgICAgICAgICAgcmV0dXJuIHU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHUgKyAocSAmJiB1LmluZGV4T2YoXCI/XCIpID49IDAgPyBcIiZcIiA6IFwiP1wiKSArIHE7XG4gICAgfSxcblxuICAgIF9hamF4OiBmdW5jdGlvbihtZXRob2QsIHVybCwgZGF0YSkge1xuICAgICAgICBkYXRhID0gZGF0YSB8fCB7fTtcbiAgICAgICAgaWYgKF8uaXNPYmplY3QoZGF0YS5kYXRhKSkge1xuICAgICAgICAgICAgZGF0YS5kYXRhID0gSlNPTi5zdHJpbmdpZnkoZGF0YS5kYXRhKTtcbiAgICAgICAgfVxuICAgICAgICAkLmFqYXgoXG4gICAgICAgICAgICB1cmwsXG4gICAgICAgICAgICAkLmV4dGVuZChcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25cIixcbiAgICAgICAgICAgICAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0OiB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IG1ldGhvZCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGRhdGFcbiAgICAgICAgICAgIClcbiAgICAgICAgKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUnVuIG9uIGVhY2ggY2hpbGQgb2JqZWN0IGFzIGZldGNoZWQgYXMgYSBtZW1iZXIgb2YgdGhpcyBvYmplY3QuIFNob3VsZCBjb252ZXJ0IHRvIGEgSmF2YVNjcmlwdCBjbGFzcy5cbiAgICAgKi9cbiAgICBfcmVzb2x2ZV9vYmplY3Q6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfSxcbiAgICBfZmV0Y2hfcmVzb2x2ZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBjID0gdGhpcy5fY2xhc3M7XG4gICAgICAgICQuZWFjaChkYXRhLCBmdW5jdGlvbihtZW1iZXIpIHtcbiAgICAgICAgICAgIGlmIChtZW1iZXIuc3Vic3RyKDAsIDEpID09PSBcIl9cIikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjLm1lbWJlcl90eXBlc1ttZW1iZXJdKSB7XG4gICAgICAgICAgICAgICAgaWYgKF8uaXNPYmplY3QodGhpcykpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZlttZW1iZXJdID0gc2VsZi5fcmVzb2x2ZV9vYmplY3QodGhpcyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZlttZW1iZXJdID0gdGhpcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9uZWVkX2xvYWQgPSBmYWxzZTtcbiAgICAgICAgY29uc29sZS5sb2coXCJMb2FkZWQgXCIgKyB0aGlzLmNvbnN0cnVjdG9yLm5hbWUgKyBcIiAjXCIgKyB0aGlzW3RoaXMuX2NsYXNzLmlkX2NvbHVtbl0pO1xuICAgIH0sXG5cbiAgICBfZmV0Y2hfcmVqZWN0OiBmdW5jdGlvbih4aHIsIG1lc3NhZ2UpIHt9LFxuICAgIF9zdG9yZV9yZXNvbHZlOiBmdW5jdGlvbihkYXRhKSB7fSxcbiAgICBfc3RvcmVfcmVqZWN0OiBmdW5jdGlvbih4aHIsIG1lc3NhZ2UpIHt9LFxufSk7XG5cblplc2tPYmplY3QubWl4ZWRUb0lkID0gZnVuY3Rpb24obWl4ZWQpIHtcbiAgICBpZiAoXy5pc051bWJlcihtaXhlZCkpIHtcbiAgICAgICAgcmV0dXJuIHBhcnNlSW50KG1peGVkLCAxMCk7XG4gICAgfVxuICAgIGlmIChfLmlzT2JqZWN0KG1peGVkKSkge1xuICAgICAgICByZXR1cm4gbWl4ZWQ7XG4gICAgfVxufTtcblxuWmVza09iamVjdC5mZXRjaEJ5SWQgPSBmdW5jdGlvbihDb25zdHJ1Y3RvciwgbWl4ZWQpIHtcbiAgICB2YXIgcmVzdWx0ID0gbmV3IENvbnN0cnVjdG9yKG1peGVkKTtcbiAgICByZXR1cm4gcmVzdWx0LmZldGNoKCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFplc2tPYmplY3Q7XG4iXX0=