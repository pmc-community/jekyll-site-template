/*!
 * Bootstrap Table of Contents v1.0.1 
 * Based on (http://afeld.github.io/bootstrap-toc/), Copyright 2015 Aidan Feldman
 * Licensed under MIT (https://github.com/afeld/bootstrap-toc/blob/gh-pages/LICENSE.md)
 */
(function($) {
  "use strict";

  window.Toc = {
    helpers: {
      // return all matching elements in the set, or their descendants
      findOrFilter: function($el, selector) {
        var $descendants = $el.find(selector);
        return $el
          .filter(selector)
          .add($descendants)
          .filter(":not([data-toc-skip])");
      },

      generateUniqueIdBase: function(el) {
        var text = $(el).text();

        var urlText = text
          .trim()
          .replace(/['"]/g, "")                     // Remove quotes
          .replace(/[^a-zA-Z0-9]+/g, "_")           // Replace non-alphanumerics with underscores
          .replace(/_+/g, "_")                      // Collapse multiple underscores
          .replace(/^_+|_+$/g, "")                  // Trim leading/trailing underscores
          .toLowerCase();

        // Always prefix with "id_"
        urlText = "id_" + urlText;

        return urlText || "id_" + el.tagName.toLowerCase();
      },

      generateUniqueId: function(el) {
        var anchorBase = this.generateUniqueIdBase(el);
        for (var i = 0; ; i++) {
          var anchor = anchorBase;
          if (i > 0) {
            anchor += "-" + i;
          }
          if (!document.getElementById(anchor)) {
            return anchor;
          }
        }
      },

      generateAnchor: function(el) {
        var helpers = this;

        // Always generate a fresh anchor that starts with id_
        var generatedId = helpers.generateUniqueId(el);

        // Override any existing id if it's not prefixed with "id_"
        if (!el.id || !el.id.startsWith("id_")) {
          el.id = generatedId;
        } else {
          // If an existing id starts with id_ but is not unique, regenerate
          if (document.querySelectorAll(`#${el.id}`).length > 1) {
            el.id = generatedId;
          }
        }

        return el.id;
      },

      createNavList: function() {
        return $('<ul class="nav navbar-nav"></ul>');
      },

      createChildNavList: function($parent) {
        var $childList = this.createNavList();
        $parent.append($childList);
        return $childList;
      },

      generateNavEl: function(anchor, text) {
        var $a = $('<a class="nav-link"></a>');
        $a.attr("href", "#" + anchor);
        $a.text(text);
        var $li = $("<li></li>");
        $li.append($a);
        return $li;
      },

      generateNavItem: function(headingEl) {
        var anchor = this.generateAnchor(headingEl);
        var $heading = $(headingEl);
        var text = $heading.data("toc-text") || $heading.text();
        return this.generateNavEl(anchor, text);
      },

      getTopLevel: function($scope) {
        for (var i = 1; i <= 6; i++) {
          var $headings = this.findOrFilter($scope, "h" + i);
          if ($headings.length > 1) {
            return i;
          }
        }
        return 1;
      },

      getHeadings: function($scope, topLevel) {
        var topSelector = "h" + topLevel;
        var secondaryLevel = topLevel + 1;
        var secondarySelector = "h" + secondaryLevel;
        return this.findOrFilter($scope, topSelector + "," + secondarySelector);
      },

      getNavLevel: function(el) {
        return parseInt(el.tagName.charAt(1), 10);
      },

      populateNav: function($topContext, topLevel, $headings) {
        var $context = $topContext;
        var $prevNav;
        var helpers = this;

        $headings.each(function(i, el) {
          var $newNav = helpers.generateNavItem(el);
          var navLevel = helpers.getNavLevel(el);

          if (navLevel === topLevel) {
            $context = $topContext;
          } else if ($prevNav && $context === $topContext) {
            $context = helpers.createChildNavList($prevNav);
          }

          $context.append($newNav);
          $prevNav = $newNav;
        });
      },

      parseOps: function(arg) {
        var opts;
        if (arg.jquery) {
          opts = { $nav: arg };
        } else {
          opts = arg;
        }
        opts.$scope = opts.$scope || $(document.body);
        return opts;
      }
    },

    // accepts a jQuery object, or an options object
    init: function(opts) {
      opts = this.helpers.parseOps(opts);
      opts.$nav.attr("data-toggle", "toc");
      var $topContext = this.helpers.createChildNavList(opts.$nav);
      var topLevel = this.helpers.getTopLevel(opts.$scope);
      var $headings = this.helpers.getHeadings(opts.$scope, topLevel);
      this.helpers.populateNav($topContext, topLevel, $headings);
    }
  };

  $(function() {
    $('nav[data-toggle="toc"]').each(function(i, el) {
      var $nav = $(el);
      Toc.init($nav);
    });
  });
})(jQuery);
