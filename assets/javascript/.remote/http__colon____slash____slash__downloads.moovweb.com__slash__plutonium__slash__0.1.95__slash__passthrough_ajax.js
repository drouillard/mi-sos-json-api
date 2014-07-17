/* * * * * * * * * * * 
 * Tritium usage:
 * 1 - Add this script, and gsub script
 * 2 - Add an element on the page to configure the replacement:
 * 
     insert("div") {
       attribute("id", "mw_link_passthrough_config")
       attribute("rewrite_link_matcher", $rewrite_link_matcher)
       attribute("rewrite_link_replacement", $rewrite_link_replacement)
     }
 * 
 * 
 */

(function(){

    var matcher = null;
    var replace = null;

    function get_config(config_element) {
        var raw_matcher = config_element.getAttribute("rewrite_link_matcher");
				if (raw_matcher !== null) {
        	matcher = new RegExp(raw_matcher, "g");
				}

        replace = config_element.getAttribute("rewrite_link_replacement");
    }

		function normalize_host(host) {
			if (host[host.length-1] == "/") {
				host = host.slice(0,host.length-1);
			}
			return host;
		}	

		function split_schema_and_host(schema_and_host) {
			parts = schema_and_host.split("//");
			schema = parts[0];
			host = parts[1];
			return {
				"schema" : schema + "//",
				"host" : normalize_host(host)
			}
		}
			
		// Splits into schema / host / path			
		function url_components(url) {
			length = url.length;
			var previous = "";
			var found_slash = false;
			
			for(var i=0; i < length; i++) {
				if (url[i] == "/") {
					if (previous != "/" && found_slash) {
						path = url.slice(i+1, length);
						parts = split_schema_and_host(url.slice(0, i+1));

						return {
							"schema" : parts.schema,
							"host" : parts.host,							
							"path" : path							
						}
					} else {
						found_slash = false;
					}
					
					found_slash = true;					
				}
				previous = url[i];
			}
			
			// Never found the start of path ... the whole thing is the 'host' part
			parts = split_schema_and_host(url);
			
			return {
				"schema" : parts.schema,
				"host" : parts.host,							
				"path" : ""							
			}			
			
		}


    function passthrough_url(url) {
      var temp_url = url;
      var config_element = document.getElementById('mw_link_passthrough_config');  
			var use_host_map = false;


      if (config_element !== null) {
        if (!matcher && !replace) {
          get_config(config_element);
        }

				if (!matcher && !replace) {
					use_host_map = true;
				} else {
        	temp_url = gsub(url, matcher, replace);
				}
      } else {
				return mw.originURLToProxy(url);
			}
			
      return temp_url;
    }


    function hijack_open(method, url, some_boolean) {
        var new_url = passthrough_url(url);
        this._open(method, new_url, some_boolean);

        // Semi-standard header used by tritium to differentiate Ajax requests from regular page requests
        if (this._headers && !this._headers["X-Requested-With"])
          this.setRequestHeader("X-Requested-With", "XMLHttpRequest")

    }

    if (XMLHttpRequest)
    {
        XMLHttpRequest.prototype._open = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = hijack_open;
    } else if (ActiveXObject)
    {
        ActiveXObject.prototype._open = ActiveXObject.prototype.open;
        ActiveXObject.prototype.open = hijack_open;
    }

})();
