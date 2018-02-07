/**
 * Copyright &copy; 2017 Market Acumen, Inc.
 */
let _ = require("lodash");
let ZeskException = require("./ZeskException");

let $ = require("jquery");
let qs = require("qs");
let serializers = require("./MemberTypes").serializers;

var RSVP = require("rsvp-that-works");
var format = require("string-format-obj");

var ZeskObject = function(mixed, options) {
    this._options = _.isObject(options) ? _.cloneDeep(options) : {};
    this._class = $.extend(
        {
            id_column: null,
            primary_keys: [],
            member_types: {},
            null: {},
            member_defaults: {},
        },
        this._options.class || {},
        this._class || this.class_definition()
    );
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
    _members: function() {
        let result = {};
        let c = this._class;
        _.forEach(this._class.member_types, (type, key) => {
            result[key] = this[key] || c.member_defaults[key];
        });
        return result;
    },
    /**
     * Called after object is created with "new" 
     */
    initialize: function() {},
    /**
     * Called after item is fetched and initialized from remote source
     */
    fetched: function() {},

    /**
     * Return the class definition
     */
    class_definition: function() {
        return {};
    },

    id_column: function() {
        return this._class.id_column || null;
    },

    _initialize_class: function() {
        let c = this._class;
        _.forEach(c.member_types, (type, name) => {
            if (_.isUndefined(c.member_defaults[name])) {
                c.member_defaults[name] = null;
            }
        });
    },
    _init_instance: function(mixed) {
        if (_.isObject(mixed)) {
            let self = this;
            let c = this._class;
            _.forEach(mixed, (value, key) => {
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

    super_initialize: function() {
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

    is_new: function() {
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

    fetch: function(options) {
        if (!_.isObject(options)) {
            options = {};
        }
        if (!this._endpoints.GET) {
            throw new ZeskException("{class} does not have GET endpoint", { class: this.constructor.name });
        }
        var promise = new RSVP.Promise();
        var url = this._format_url(this._endpoints.GET, options);
        this._ajax("GET", url, {
            success: data => {
                this._fetch_resolve(data);
                this.fetched();
                promise.resolve(this, data);
            },
            error: (xhr, message) => {
                this._fetch_reject();
                promise.reject(new Error(message));
            },
            dataType: "json",
        });
        return promise;
    },

    store: function() {
        var promise = new RSVP.Promise();
        var method = this.is_new() ? "PUT" : "POST";
        let url = this._format_url(this._endpoints[method]);
        this._ajax(method, url, {
            success: data => {
                this._store_resolve(data);
                data.this = this;
                promise.resolve(data);
            },
            error: (xhr, message) => {
                this._store_reject(xhr, message);
                promise.reject(new Error(message));
            },
            data: this._storeData(),
        });
        return promise;
    },

    _objectToId: function(v) {
        if (!_.isObject(v)) {
            return null;
        }
        if (v._class && v._class.id_column) {
            return v[v._class.id_column];
        }
        if (v.id) {
            return v.id;
        }
        return null;
    },

    _convertType: function(value, type) {
        if (value === null) {
            return null;
        }
        if (type === "object") {
            let newvalue = this._objectToId(value);
            if (newvalue !== null) {
                return newvalue;
            }
        }
        if (serializers[type]) {
            return serializers[type](value);
        }
        return String(value);
    },
    _storeData: function() {
        let c = this._class;
        let data = {};
        _.forEach(c.member_types, (type, key) => {
            let value = this._convertType(this[key], type);
            if (value !== null || c.null[key]) {
                data[key] = value;
            }
        });
        return data;
    },

    _format_url: function(url, options = {}) {
        var q = qs.stringify(options);
        var u = format(url, this);
        if (!q) {
            return u;
        }
        return u + (q && u.indexOf("?") >= 0 ? "&" : "?") + q;
    },

    _ajax: function(method, url, data) {
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
    _resolve_object: function(data) {
        return data;
    },
    _fetch_resolve: function(data) {
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

    _fetch_reject: function(xhr, message) {
        console.error("Fetch of object failed " + message);
    },
    _store_resolve: function(data) {
        if (data.status) {
            console.info("Store of object succeeded. Result: " + JSON.stringify(data));
        } else {
            console.error("Store of object failed in application (status). Data follows.");
            console.error(data);
        }
    },
    _store_reject: function(xhr, message) {
        console.error("Store of object failed. Result: " + message);
    },
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
