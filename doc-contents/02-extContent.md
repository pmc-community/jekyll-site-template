---
layout: page
title: External content
permalink: /ec/
tags: [tag1, tag4, tag3]
---
```
Content from an exernal private repo
```

{% 
    ExternalRepoContent  { 
        "owner":"PMCDevOnlineServices", 
        "repo":"Ihs-docs", 
        "branch":"main", 
        "file_path":"Get-Started/eng/get-started-with-innohub.space.md", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "<!-- START EXPOSED SECTION -->", 
        "end_marker": "<!-- END EXPOSED SECTION -->" 
    }
%}
