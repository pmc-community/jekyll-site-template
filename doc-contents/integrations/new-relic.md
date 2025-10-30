---
layout: page
title: New Relic
permalink: /integrations/new-relic/
categories: [Integrations, Start]
tags: [integration, new relic, log, monitor, measure, performance, low-code]
parent: Integrate
nav_order: 3
---

# Summary
New Relic integration is provided out-of-the-box once this integration is enabled. This integration allows monitoring and measuring the performance of the site. Used in combination with the `hooks` extension capabilities, it provides a robust way to log the user interactions with site. We provide a function that logs to new Relic the execution of any target function used as part of the code base of the site. 

Hooking the logging function to the target function will send to New Relic the context information of the target function execution (timestamp, target function arguments, execution result, the page on which the target function was executed, user anonymous id, device and browser information). Using the logs brings valuable information about how the site is functioning and can lead to important optimisations and fixes.

# Usage
Using this integration requires a little bit of code and New Relic knowledge. First, it is needed to do the needed configurations in New Relic and get the integration parameters to be configured as environment variables. Second, locate the function which you want to log and bring it into global scope. Then, define the hook and, finally, activate it. 

{% include elements/alert.html 
  class="primary" 
  content="You may need to consult New Relic documentation. Follow the instructions from that documentation to create and configure a `browser app` which must be used for this integration."
  title="New Relic"
%}

{% capture c %}
  {% 
    ExternalRepoContent  { 
        "markdown": true,
        "owner":"pmc-community", 
        "repo":"jekyll-site-template", 
        "branch":"gh-pages", 
        "file_path":"doc-contents/integrations/how-to-use-hooks-alert.md", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "fullFile",
        "include_start_marker": false,
        "end_marker": "fullFile" ,
        "include_end_marker": false,
        "needAuth": false
    }
%}
{% endcapture %}
{% include elements/alert.html class="primary" content=c title="Use hooks" %}

{% include elements/alert.html 
  class="warning" 
  content="Don't forget to re-build and re-deploy the site after doing code modifications!!!"
%}

The New Relic integration is based on the next parameters:

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
When the deployment is on `Github pages` or `Netlify`, then the Github integration parameters should be configured in as `action secrets` in Github or `environment variables` in Netlify. The names of the integration parameters is the same, regardless of the deployment environment (local, custom, Github pages or Netlify).

{% include elements/alert.html 
  class="primary" 
  content="You may need to consult the Github documentation or the Netlify documentation to find out how to create your personal access token and how to define action secrets (Github) or environment variables (Netlify)."
%}

Using New Relic integration requires:
1. configure the `New Relic browser app`, retrieve the integration parameters and configure them in the `.env` file or as `Github actions secrets` or as `Netlify build environment variables`. This would be enough for monitoring and measuring the performance of the site.
2. bring into global scope the target functions that you want to log
3. hook into the target functions executions, use the `nrLog` function inside the hooks and activate the hooks

Here is an example of a logging hook that logs `createAutoSummaryPageContainer` function:

```javascript
{% 
    ExternalRepoContent  { 
        "markdown": true,
        "owner":"pmc-community", 
        "repo":"jekyll-site-template", 
        "branch":"gh-pages", 
        "file_path":"assets/js/post-hooks.js", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "hooks.addAction('createAutoSummaryPageContainer'",
        "include_start_marker": true,
        "end_marker": "'post');" ,
        "include_end_marker": true,
        "needAuth": false
    }
%}
```

Here is an example about the outcome of New Relic integration:

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
