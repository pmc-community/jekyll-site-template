---
layout: page
title: GitHub
permalink: /integrations/github/
categories: [Integrations, Start]
tags: [integration, github, code, content, no-code]
parent: Integrate
nav_order: 4
---

# Summary
Docaroo offers out-of-the-box the possibility to integrate with Github and to import content from public and private repositories. While there is no limit when it comes to how many public repositories can be accessed, for the private repositories, content can be imported only from the repositories within the scope of the personal access token that must be configured. 

Content from external public Github repositories can be also imported at run time. For the moment, we do not support importing content from private Github repositories at run time, this being possible only at build time.

{% capture buttons %}
    type=primary|outline=false|text=Build time|href="/content/ec/#id_import_external_repo_content"|newTab=true,
    type=warning|outline=false|text=Run time|href="/content/ec/#id_import_content_at_run_time"|newTab=true
{% endcapture %}

{% include elements/link-btn-group.html buttons=buttons %}

# Usage
Using the Github integration depends on the deployment type. When testing on local dev environment or when the deployment is on a custom infrastructure, the settings from `.env` file are used as shown next.

{% include elements/alert.html 
  class="warning" 
  content="When using this integration, please note the Github API limits, mostly when using content imported at run time. At the moment Docaroo does not have a request caching mechanism, thus overusing the run time imported content may reach the limits of Github API. Reaching Github API limits for content imported at build time is less probable but still possible if this feature is heavily used (like imported content on each document). However, for content imported at build-time, once the site is built, there wii be no more requests to Github."
  title="GitHub API Limits" 
%}

{% include elements/alert.html 
  class="primary" 
  content="When importing multiple parts from the same external file, avoid making requests to Github for each part, you can get all in one request. See details [here](/content/ec/#id_import_multiple_external_repo_content){: target=\"_blank\"}."
  title="Tip!!!" 
%}

Github integration is based on some parameters shown below.

```javascript
{% 
    ExternalRepoContent  { 
        "markdown": true,
        "owner":"pmc-community", 
        "repo":"jekyll-site-template", 
        "branch":"gh-pages", 
        "file_path":"doc-contents/environments/env-doc.txt", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "# External content",
        "include_start_marker": true,
        "end_marker": "to the personal access token>" ,
        "include_end_marker": true,
        "needAuth": false
    }
%}
```

When the deployment is on `Github pages` or `Netlify`, then the Github integration parameters should be configured in as `action secrets` in Github or `environment variables` in Netlify. The names of the integration parameters is the same, regardless of the deployment environment (local, custom, Github pages or Netlify).

{% include elements/alert.html 
  class="primary" 
  content="You may need to consult the Github documentation or the Netlify documentation to find out how to create your personal access token and how to define action secrets (Github) or environment variables (Netlify)."
%}

{% include elements/alert.html 
  class="warning" 
  content="Check here the deployment of this site on **[`Netlify`](https://dst.innohub.space){: target=\"_blank\" }**."
  title="Netlify"
%}

