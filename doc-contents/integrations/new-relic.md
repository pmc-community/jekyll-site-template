---
layout: page
title: New Relic
permalink: /integrations/new-relic/
categories: [Integrations, Start]
tags: [integration, new relic, log, monitor, measure, performance]
parent: Integrate
nav_order: 3
---

# Summary


# Usage

```javascript
{% 
    ExternalRepoContent  { 
        "markdown": true,
        "owner":"pmc-community", 
        "repo":"jekyll-site-template", 
        "branch":"gh-pages", 
        "file_path":"doc-contents/environments/env-doc.txt", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "# New Relic",
        "include_start_marker": true,
        "end_marker": "app beacon, see New Relic documentation>" ,
        "include_end_marker": true,
        "needAuth": false
    }
%}
```

{% capture img %}
    source="partials/media/integrations/nr-img/nr-logs.png"|caption="Logs"|captionBorder="true"|imgLink="https://www.newrelic.com"|imgLinkNewTab="true",
    source="partials/media/integrations/nr-img/nr-web-app.png"|caption="Web Vitals"|captionBorder="true"|imgLink="https://www.newrelic.com"|imgLinkNewTab="true",
    source="partials/media/integrations/nr-img/nr-web-app-1.png"|caption="Performance"|captionBorder="true"|imgLink="https://www.newrelic.com"|imgLinkNewTab="true"
{% endcapture %}

{% include elements/image-gallery.html 
  img=img 
  border="true" 
  hg="400px"
  oneRow="all" 
%}
