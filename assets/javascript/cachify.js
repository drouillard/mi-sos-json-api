/*
  Cachify 1.0
  by Hampton Catlin

  This is a simple library that works with Moovweb's "cache"
  mixer to make it very easy to late load content onto 
  the Moov'd site.
*/
document.addEventListener("DOMContentLoaded", function() {
  var cache = document.querySelector("[data-cache-hold]");
  if (cache) {
    var xhr = new XMLHttpRequest;
    var prefix = location.href.indexOf("?") == -1 ? "?" : "&";
    xhr.open("GET", document.location.href + prefix + "_mw_cached_fragments=true&_=" + Date.now());
    xhr.setRequestHeader("X-Requested-With", "CacheRequest");
    try { xhr.responseType = "json"; } catch(e) {}
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        if (xhr.status == 200) {
          var data = Array.isArray(xhr.response) ? xhr.response : JSON.parse(xhr.responseText);
          for (var i = 0; i < data.length; i++) {
            var node = document.querySelector("[data-cache-hold='" + (i+1) + "']");
            if (node)
              node.outerHTML = data[i];
          }
        }
        else
          console.log("Looks like the cachify process failed. Oh noes!");
      }
    };
    xhr.send();
  }
});
