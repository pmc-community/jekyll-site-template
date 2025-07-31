---
layout: page
title: Card
permalink: /components/card/
categories: [Components]
tags: [card]
---

{% include elements/card.html 
    img="partials/media/joy-s.png"
    title="Docaroo card"
    file="partials/external-content-demo/card-content-demo.md"   
%}

{% include elements/alert.html class="primary" 
    content="Best experience is achieved when using images with transparent background in cards" 
    title="Tip" 
%}

 ```yaml
{% 
    ExternalRepoContent  { 
        "markdown": true,
        "owner":"pmc-community", 
        "repo":"jekyll-site-template", 
        "branch":"gh-pages", 
        "file_path":"_data/buildConfig.yml", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "card:",
        "include_start_marker": true,
        "end_marker": "0.875rem\"" ,
        "include_end_marker": true,
        "needAuth": true
    }
%}
```