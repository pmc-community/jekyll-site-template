---
layout: page
title: Alerts
permalink: /components/alerts/
categories: [Components]
tags: [embed, alert]
---

# Summary
Learn how to add `alert` blocks to your content. You can add both `simple` and `rich` alerts. Alerts can be of different types as shown by the colors (`primary`, `success`, `warning`, `danger` and `info`). Alerts can contain content introduced in clear but also can refer `external content` from other documents from your documentation or from external public or private repositories. The `external content` can either added using `liquid sintax` or `custom liquid tags`.

Limitations: 
- There is no limit about how many external public repositories you refer
- The number of the external private repositories depends on the private access key type you configure. However, the current limitation is that you cannot access private repositories from more than one Github account or organisation (depending on the permissions of your private key). If you set a key to access a single private repo, then that repo is the only one that you can refer.
- Currently we support only Github repositories


# Simple primary alert
Add a simple primary alert to your page like this:

{% raw %}
```javascript
{% include elements/alert.html 
  class="primary" 
  content="primary alert" 
  title="Title" 
%}
```
{% endraw %}

{% include elements/alert.html class="primary" content="primary alert" title="Title" %}

# External content alert
Add content taken from external files to your alerts like this. Content is taken from another file that can be in the same repo or in other pubic (or private) repo.

{% raw %}
```javascript
{% capture c %}
    {% ExternalSiteContent  {
        "markdown": true,
        "file_path":"partials/external-content-demo/alert-content.md", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "fullFile", 
        "include_start_marker": false,
        "end_marker": "fullFile",
        "include_end_marker": false,
        "needAuth": true 
    } 
    %}
{% endcapture %}

{% include elements/alert.html 
  class="success" 
  content=c 
  title="Alert title" 
%}
```
{% endraw %}

{% capture c %}
  {% ExternalSiteContent  {
        "markdown": true,
        "file_path":"partials/external-content-demo/alert-content.md", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "fullFile", 
        "include_start_marker": false,
        "end_marker": "fullFile",
        "include_end_marker": false,
        "needAuth": true 
    } 
  %}
{% endcapture %}
{% include elements/alert.html class="success" content=c title="Alert title" %}

# Simple alerts
Add simple alerts to your page like this:
{% raw %}
```javascript
{% include elements/alert.html 
  class="danger" 
  content="danger alert" 
  title="Title" 
%}

{% include elements/alert.html 
  class="warning" 
  content="warning alert"
   title="Title" 
%}

{% include elements/alert.html 
  class="info" 
  content="info alert" 
  title="Title" 
%}
```
{% endraw %}

{% include elements/alert.html class="danger" content="danger alert" title="Title" %}
{% include elements/alert.html class="warning" content="warning alert" title="Title" %}
{% include elements/alert.html class="info" content="info alert" title="Title" %}