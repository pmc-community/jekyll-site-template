---
layout: page
title: Alerts
permalink: /alerts/
---

## Simple alert

{% include elements/alert.html class="primary" content="primary alert" title="Title" %}

## Rich content alert
Content is taken from another file that can be in the same repo or in other pubic (or private) repo.

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

## Simple alerts, again

{% include elements/alert.html class="danger" content="danger alert" title="Title" %}
{% include elements/alert.html class="warning" content="warning alert" title="Title" %}
{% include elements/alert.html class="info" content="info alert" title="Title" %}

## Rich content alert
Content is taken from another file from the doc-contents folder. 
First, it captures the content of the external file into `file_content_result`. Second, it captures only the first occurrence of the text between the given markers into `substr_result`. When using start and end markers, be sure that these exists in the source file. The markers are not included in the returned text. Empty markers are not accepted. 

{% capture included_content %}
    {% include_relative 00-intro.md %}
{% endcapture %}
{% include siteIncludes/modules/utilities.liquid fileContent=included_content %}
{% include siteIncludes/modules/utilities.liquid baseString=file_content_result markerStart="(RO)" markerEnd="It has" %}
{% include elements/alert.html class="warning" content=substr_result title="Title" %}


Content is taken from another file from the doc-contents folder. 
It captures the content of the external file into `file_content_result`. The captured content must be between the standard exposed section markers defined in `site.data.siteConfig.extContentMarkers.startExposedSection` (`{{site.data.siteConfig.extContentMarkers.startExposedSection}}` and `{{site.data.siteConfig.extContentMarkers.endExposedSection}}`). If the external file does not have these markers, the captured content will be empty string. 

{% capture included_content %}
    {% include_relative partials/part1.md %}
{% endcapture %}
{% include siteIncludes/modules/utilities.liquid fileContent=included_content %}
{% include elements/alert.html class="danger" content=file_content_result title="Title" %}