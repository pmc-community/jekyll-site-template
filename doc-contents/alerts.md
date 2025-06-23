---
layout: page
title: Alerte
permalink: /alerts/
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
{% include elements/alert.html class="primary" content="primary alert" title="Title" %}
```
{% endraw %}

{% include elements/alert.html class="primary" content="primary alert" title="Title" %}

# Rich external content alert
Add content taken from external files to your alerts like this. Content is taken from another file that can be in the same repo or in other pubic (or private) repo.

{% raw %}
```javascript
{% capture c %}
    {% ExternalSiteContent  {
        "markdown": true,
        "file_path":"_collection-2/Z/z.md", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "<!-- START MARKER 1 -->", 
        "include_start_marker": false,
        "end_marker": "<!-- END MARKER 1 -->",
        "include_end_marker": false,
        "needAuth": true 
    } 
    %}
{% endcapture %}
{% include elements/alert.html class="success" content=c %}
```
{% endraw %}

{% capture c %}
  {% ExternalSiteContent  {
        "markdown": true,
        "file_path":"_collection-2/Z/z.md", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "<!-- START MARKER 1 -->", 
        "include_start_marker": false,
        "end_marker": "<!-- END MARKER 1 -->",
        "include_end_marker": false,
        "needAuth": true 
    } 
  %}
{% endcapture %}
{% include elements/alert.html class="success" content=c %}

# Simple alerts
Add simple alerts to your page like this:
{% raw %}
```javascript
{% include elements/alert.html class="danger" content="danger alert" title="Title" %}
{% include elements/alert.html class="warning" content="warning alert" title="Title" %}
{% include elements/alert.html class="info" content="info alert" title="Title" %}
```
{% endraw %}

{% include elements/alert.html class="danger" content="danger alert" title="Title" %}
{% include elements/alert.html class="warning" content="warning alert" title="Title" %}
{% include elements/alert.html class="info" content="info alert" title="Title" %}

# Rich content alert
## Content from other file
Add selected content from another file from your doc-contents folder using the following code. First, it captures the content of the external file into `file_content_result`. Second, it captures only the first occurrence of the text between the given markers into `substr_result`. When using start and end markers, be sure that these exists in the source file. The markers are not included in the returned text. Empty markers are not accepted.

{%raw%}
```javascript
{% capture included_content %}
    {% include_relative 00-intro.md %}
{% endcapture %}
{% include siteIncludes/modules/utilities.liquid fileContent=included_content %}
{% include siteIncludes/modules/utilities.liquid baseString=file_content_result markerStart="(RO)" markerEnd="It has" %}
{% include elements/alert.html class="warning" content=substr_result title="Title" %}
```
{%endraw%}

{% capture included_content %}
    {% include_relative intro.md %}
{% endcapture %}
{% include siteIncludes/modules/utilities.liquid fileContent=included_content %}
{% include siteIncludes/modules/utilities.liquid baseString=file_content_result markerStart="(RO)" markerEnd="It has" %}
{% include elements/alert.html class="warning" content=substr_result title="Title" %}

## Content and rich media
Add selected content from another file from your doc-contents folder using the following code. Add also rich media to your alert content.
It captures the content of the external file into `file_content_result`. The captured content must be between the standard exposed section markers defined in `site.data.siteConfig.extContentMarkers.startExposedSection` (`{{site.data.siteConfig.extContentMarkers.startExposedSection}}` and `{{site.data.siteConfig.extContentMarkers.endExposedSection}}`). If the external file does not have these markers, the captured content will be empty string. The next example shows how to add rich media content (in this case we added a `Lottie animation`) to the alert title (the same is applicable to alert body)

{%raw%}
```javascript
{% capture included_content %}
    {% include_relative partials/part1.md %}
{% endcapture %}
{% include siteIncludes/modules/utilities.liquid fileContent=included_content %}

{% capture animation %}
    {% include elements/lottie.html id="b9c3d8e8-0304-49ea-8c47-1fb872d8cae3/UUN7MtiRMP" h=15 w=15 pad=0 %}
{% endcapture %}

{% assign title = animation | append: "Animation title" %}

{% include elements/alert.html class="danger" content=file_content_result title=title %}
```
{%endraw%}

{% capture included_content %}
    {% include_relative partials/part1.md %}
{% endcapture %}
{% include siteIncludes/modules/utilities.liquid fileContent=included_content %}

{% capture animation %}
    {% include elements/lottie.html id="b9c3d8e8-0304-49ea-8c47-1fb872d8cae3/UUN7MtiRMP" h=15 w=15 pad=0 %}
{% endcapture %}

{% assign title = animation | append: "Animation title" %}

{% include elements/alert.html class="danger" content=file_content_result title=title %}