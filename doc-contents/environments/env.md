---
layout: page
title: Environments
permalink: /get-started/env/
categories: [General, Start, Site config, Environment]
tags: [start, configuration, environment, variable]
parent: Get started
nav_order: 4
---

# Summary
The environment variables are defined in a local .env file for working in development mode and in dedicated places on the live/production site, depending on the deployment target (i.e. GitHub pages, Netlify). For example, when deploying with GitHub pages, the environment variables must be defined under the repository Secrets and variables/Actions section, when deploying with Netlify the environment variables must be defined under Deploy settings/Environment variables. 

# Variables
```javascript
{% 
    ExternalRepoContent  { 
        "markdown": true,
        "owner":"pmc-community", 
        "repo":"jekyll-site-template", 
        "branch":"gh-pages", 
        "file_path":"doc-contents/environments/env-doc.txt", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "fullFile",
        "include_start_marker": false,
        "end_marker": "fullFile" ,
        "include_end_marker": false,
        "needAuth": false
    }
%}
```

{% include elements/alert.html class="primary" 
    content="Environment variables are used only at build time. At run time (in dev or production environments) the environment variables are not used anymore."
    title="Note!" 
%}

# Purpose
Environment variables are mostly used to store values that should never be exposed, such as access keys and tokens that are used to integrate some external features and content. The external systems integrated with Docaroo ans using the environment variables are:
- `GitHub`: to include external content from private repositories, at build and run time
- `New Relic`: to monitor the performance and for logging purposes (`subject to extension hooks`)
- `Algolia`: for search in site. `Algolia DocSearch` is fully supported and the full UI experience is provided; `Algolia search` does not provide (yet) the UI experience, but the features of updating the index are provided.
- `Huggingface`: for accessing the open source models used to provide various features of Docaroo (such as auto summaries, PDF/DOCX summarisation, similar docs identification)

{% capture c %}
  {% 
    ExternalRepoContent  { 
        "markdown": true,
        "owner":"pmc-community", 
        "repo":"jekyll-site-template", 
        "branch":"gh-pages", 
        "file_path":"doc-contents/environments/integration-alert-content.md", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "fullFile",
        "include_start_marker": false,
        "end_marker": "fullFile" ,
        "include_end_marker": false,
        "needAuth": false
    }
%}
{% endcapture %}
{% include elements/alert.html class="primary" content=c title="Note!" %}