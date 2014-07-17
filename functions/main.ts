
# Rewrite meta redirects
@func XMLNode.rewrite_meta_refresh() {
  $("/html/head/meta") {
    %refresh_tag = fetch("@http-equiv")
    match(normalize(%refresh_tag)) {
      with(/refresh/i) {
        attribute("content") {
          value() {
            replace(/(.*?;)(URL=)?(.*)/i) {
              %timeout = $1
              %prefix = $2
              %url = $3
              %url {
                rewrite_link()
              }
              set(%timeout + %prefix + %url)
            }
          }
        }
      }
    }
  }
}

# Rewrite items
@func XMLNode.rewrite_links() {
  $rewriter_url = "false"
  $("./body") {
    # Rewrite links
    $(".//a") {
      attribute("href") {
        value() {
          rewrite_link()
        }
      }
    }
    $("/html/head/base[@href]") {
      $rewriter_url = fetch("./@href")
      $rewriter_url {
        replace(/.*(\/\/[\w\.]+\/).*/, "\\1")
      }
      attribute("href") {
        value() {
          rewrite_link()
        }
      }
    }
    # Rewrite form actions
    $(".//form") {
      attribute("action") {
        value() {
          rewrite_link()
        }
      }
    }
  }
  rewrite_meta_refresh()
}

@func XMLNode.rewrite_aspnet_scripts() {
  $(".//script[contains(@src, 'ScriptResource.axd?')]") {
    attribute("src") {
      value() {
        rewrite("link")
      }
    }
  }
}

####################
### Site Functions
####################

# dollar signs in image srcs get converted to %24 by nokogiri so convert them back
@func Text.restore_dollar_sign() {
  capture(/ src="(.*?)"/) {
    %1 {
      replace("%24", "$")
    }
    set(" src=\"" + %1 + "\"")
  }
}

@func Text.protect_xmlns() {
  replace(/\<(\/)?(\w+)\:(\w+)(\>?)/, "<$1$2_mwns_$3$4")
}

@func Text.restore_xmlns() {
  replace(/\<(\/?)(\w+)_mwns_(\w+)(\>?)/, "<$1$2:$3$4")
}

# A compendium of ways to "dump" tables
#
#
# EXAMPLE::
# 
# table_dump(".//table") {
#   $("./div[@class='some-class']") {
#     add_class("mw-more-scopes")
#   }
# }
#
#
@func XMLNode.table_dump(Text %xpath) {
  $(%xpath) {
    name("div")
    add_class("mw-was-table")

    $(".//table | .//tr | .//td | .//th | .//thead | .//tfoot | .//tbody | .//col | .//colgroup | .//caption") {
      %i = index()
      %n = name()
      name("div")
      attributes(data-mw-id: concat("mw-dump-", %n, %i), width: "")
      add_class(concat("mw-was-", %n))
    }

    yield()
  }
}



# Remove Styles Functions
@func XMLNode.remove_external_styles() {
  remove(".//link[@rel='stylesheet'][not(@data-mw-keep)]")
}
@func XMLNode.remove_internal_styles() {
  remove(".//style")
}
@func XMLNode.remove_all_styles() {
  remove(".//link[@rel='stylesheet'][not(@data-mw-keep)]|.//style")
}

# Remove Scripts
@func XMLNode.remove_external_scripts() {
  remove(".//script[@src]")
}
@func XMLNode.remove_internal_scripts() {
  remove(".//script[not(@src)]")
}
@func XMLNode.remove_scripts() {
  remove(".//script")
}
@func XMLNode.remove_desktop_js() {
  remove("//script[@src and (not(@data-keep) or @data-keep='false')]")
}

# Remove HTML Comment Tags
@func XMLNode.remove_html_comments() {
  remove(".//comment()")
}

# Remove existing conflicting meta tags
@func XMLNode.remove_meta_tags() {
  # Remove only existing meta tags for which we will add our own
  remove(".//meta[@name='viewport']|.//meta[@name='format-detection']")
}

# Add Meta Tags
@func XMLNode.insert_mobile_meta_tags() {
  $("/html/head") {
    insert("meta", http-equiv: "Content-Type", content: "text/html")
    insert("meta", name: "viewport", content: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0")
    insert("meta", name: "format-detection", content: "telephone=no")
  }
}

# Add Canonical Tag
@func XMLNode.add_canonical_tag() {
  $("/html/head") {
    # Inject a canonical link as long as there isn't already one.
    $canonical_found = "false"
    $(".//link[@rel='canonical']") {
      $canonical_found = "true"
    }
    match($canonical_found) {
      with(/false/) {
        insert("link", rel: "canonical", href: concat("http://", $source_host, $path))
      }
    }
    # Remove any alternate tags
    remove(".//link[@rel='alternate']")
  }
}

# Clean Meta Tags
@func XMLNode.clean_mobile_meta_tags() {
  remove_meta_tags()
  insert_mobile_meta_tags()
}

# Add the favicon
@func XMLNode.add_favicon() {
  $("/html/head") {
    insert("link", rel: "shortcut icon", href: asset("images/favicon.ico"))
  }
}

# Add home screen icons
@func XMLNode.add_apple_touch_icons() {
  $("/html/head") {
    # The images below are placeholders, get real ones from the client
    # Change to -precomposed to not have the glass effect on the icons
    insert("link", rel: "apple-touch-icon", href: asset("images/apple-touch-icon-57x57.png"))
    insert("link", rel: "apple-touch-icon", href: asset("images/apple-touch-icon-114x114.png"))
  }
}

# Add the generated stylesheet
@func XMLNode.add_mobile_stylesheet() {
  $("/html/head") {
    insert("link", rel: "stylesheet", type: "text/css", href: sass($device_stylesheet), data-mw-keep: "true")
  }  
}

# Add the mobile javascript
# Using the variable-setting logic as relying solely on presence of script tags
# is dangerous when removing js or simply on sites with no js.
@func XMLNode.add_mobile_javascript() {
  $("/html/head") {
    $noscript="true"
    $("./script[1]") {
      $noscript="false"
      insert_before("script", data-keep: "true", type: "text/javascript", src: asset("javascript/main.js"))
    }
    match($noscript) {
      with("true") {
        insert_bottom("script", data-keep: "true", type: "text/javascript", src: asset("javascript/main.js"))
      }
    }
  }
}

# Add in our Assets
@func XMLNode.add_assets() {
  add_favicon()
  add_apple_touch_icons()
  add_mobile_stylesheet()
  add_mobile_javascript()
}

@func Text.inferred_content_type() {
  $inferred_content_type = $content_type
  match($x_requested_with, /XMLHttpRequest/) {
    match($content_type, /html/) {
      match(this(), /\A\s*(\[.*\]|{.*}|".*"|'.*'|\d+|true|false)\s*\Z/m) {
        $inferred_content_type = "application/json"
      }
    }
  }
  $inferred_content_type
}
