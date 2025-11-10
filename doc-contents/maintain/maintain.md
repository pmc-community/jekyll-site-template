---
layout: page
title: Maintain
permalink: /maintain/
categories: [Start, Go live]
tags: [docs, documents, maintain]
nav_order: 7
---

# Summary
Maintaining the documentation is about keeping the content up-to-date, removing obsolete content or adding new content. Updating content can be related to refreshing the associated taxonomies (site tags, site categories) as well. Custom taxonomies cannot be modified when maintaining the site since these are not on the server and are kept by the users on their devices. 

{% capture c %}
    {% ExternalSiteContent  {
        "markdown": true,
        "file_path":"doc-contents/maintain/update-content.md", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "fullFile", 
        "include_start_marker": false,
        "end_marker": "fullFile",
        "include_end_marker": false,
        "needAuth": false 
    } 
    %}
{% endcapture %}

{% include elements/alert.html 
  class="warning" 
  content=c 
  title="Update content" 
%}