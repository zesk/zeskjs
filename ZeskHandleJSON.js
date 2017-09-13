/**
 * Copyright &copy; 2017 Market Acumen, Inc.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('jquery'). require('./Zesk'));
    } else {
        // Browser globals (root is window)
        root.Locale = factory(root.zesk);
    }
}(this, function ($, Zesk) {
	return function(data) {
	    var total = 0, success = function() {
		    --total;
		    if (total === 0) {
			    if (data.ready) {
				    $.each(data.ready, function() {
					    /* Zesk.log("evaluating " + this); */
					    $.globalEval(this);
				    });
			    }
			    if (data.location) {
				    document.location = data.location;
			    }
		    }
	    }, error = function(jqXHR) {
		    console.log("Request failed", jqXHR);
		    success();
	    };
	    $.each({
	        'head': data.head_tags || [],
	        'body': data.body_tags || []
	    }, function(append) {
		    var tags = this;
		    $.each(tags, function() {
			    var tag = this, name = tag.name, attrs = tag.attributes || {}, content = tag.content || null;
			    $(append).append(HTML.tag(name, attrs, content));
		    });
	    });
	    if (data.stylesheets) {
		    $.each(data.stylesheets, function() {
			    var tag = this, name = tag.name, attrs = tag.attributes || {}, content = tag.content || null;
			    if (name === "link") {
				    if (attrs.href && Zesk.stylesheet_loaded(attrs.href, attrs.media)) {
					    return;
				    }
				    Zesk.log("Loading stylesheet " + attrs.href + "(media=" + attrs.media + ")");
			    }
			    $('head').append(HTML.tag(name, attrs, content));
		    });
	    }
	    if (data.scripts) {
		    $.each(data.scripts, function() {
			    if (!Zesk.script_loaded(this)) {
				    Zesk.log("Loading " + this);
				    total++;
				    Zesk.page_scripts[this] = this;
				    $.ajax({
				        url: this,
				        dataType: 'script',
				        success: success,
				        error: error,
				        async: false
				    });
			    }
		    });
	    }
	    if (data.message) {
		    if (is_array(data.message)) {
			    $.each(data.message, function() {
				    Zesk.message(this, data.message_options || {});
			    });
		    } else {
			    Zesk.message(data.message);
		    }
	    }
	    total++;
	    success();
	}
}));