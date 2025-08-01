---
layout: page
title: FAQ Item
permalink: /components/qitem/
categories: [Components]
tags: [embed, faq, content]
---

# Summary
Learn how to add `faq-item` like elements to your documents. `faq-item` element contain a question.header and an answer/body to the question. While the question should always be a text, the answer to the question can be simple text or any rich content that is allowed in markdown. Any Docaroo component can be used to render the answer to a question, including importing content from external sources, at build time or run time.

# Simple FAQ item
In a simple FAQ item both question and answer are simple texts. Markdown syntax for text format can be used to enrich the annswer. 
{% raw %}
```javascript
{% assign q = "This is a question" %}
{% assign a = "This is the answer to " | append: q  %}
{% include elements/faq-item.html q=q a=a %}
```
{% endraw %}

`SIMPLE FAQ ITEM`

{% assign q = "This is a question" %}
{% assign a = "This is the answer to " | append: q  %}
{% include elements/faq-item.html q=q a=a %}

`END SIMPLE FAQ ITEM`

# Rich content FAQ item
In a rich content FAQ item the question is always simple texts. Markdown syntax for text format can be used. The answer to the question (the content of the FAQ item) is a rich media content. Any Docaroo component can be used to render the answer to a question, including importing content from external sources, at build time or run time.

{% raw %}
```javascript
{% assign q = "How was rock invented?" %}
{% capture vid %}
  {% include elements/youtube.html id="_IVyPi5-t1s" center=true %}
{% endcapture %}
{% include elements/faq-item.html q=q a=vid %}
```
{% endraw %}

`RICH CONTENT FAQ ITEM`

{% assign q = "How was rock invented?" %}
{% capture vid %}
  {% include elements/youtube.html id="_IVyPi5-t1s" center=true %}
{% endcapture %}
{% include elements/faq-item.html q=q a=vid %}

`END RICH CONTENT FAQ ITEM`

# External content FAQ item
Faq items can contain imported content too, but only in the body. The question (header) shall be always simple text.

{% raw %}
```javascript
{% assign q = "External content here" %}
{% capture ec %}
{% 
    ExternalSiteContent  {
        "markdown": true,
        "file_path":"partials/external-content-demo/faq-demo.md", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "fullFile", 
        "include_start_marker": false,
        "end_marker": "fullFile",
        "include_end_marker": false,
        "needAuth": false 
    }
%}
{% endcapture %}
{% include elements/faq-item.html q=q a=ec %}
```
{% endraw %}

`EXTERNAL CONTENT FAQ ITEM`

{% assign q = "External content here" %}
{% capture ec %}
{% 
    ExternalSiteContent  {
        "markdown": true,
        "file_path":"partials/external-content-demo/faq-demo.md", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "fullFile", 
        "include_start_marker": false,
        "end_marker": "fullFile",
        "include_end_marker": false,
        "needAuth": false 
    }
%}
{% endcapture %}
{% include elements/faq-item.html q=q a=ec %}

`END EXTERNAL CONTENT FAQ ITEM`

# FAQ section
Adding FAQ items one after the other will result in a FAQ section.

{% raw %}
```javascript
{% assign q = "This is a question" %}
{% assign a = "This is the answer to " | append: q  %}
{% include elements/faq-item.html q=q a=a %}

{% assign q = "External content here" %}
{% capture ec %}
{% 
    ExternalSiteContent  {
        "markdown": true,
        "file_path":"partials/external-content-demo/faq-demo.md", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "fullFile", 
        "include_start_marker": false,
        "end_marker": "fullFile",
        "include_end_marker": false,
        "needAuth": false 
    }
%}
{% endcapture %}
{% include elements/faq-item.html q=q a=ec %}
```
{% endraw %}

`FAQ SECTION`

{% assign q = "This is a question" %}
{% assign a = "This is the answer to " | append: q  %}
{% include elements/faq-item.html q=q a=a %}

{% assign q = "External content here" %}
{% capture ec %}
{% 
    ExternalSiteContent  {
        "markdown": true,
        "file_path":"partials/external-content-demo/faq-demo.md", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "fullFile", 
        "include_start_marker": false,
        "end_marker": "fullFile",
        "include_end_marker": false,
        "needAuth": false 
    }
%}
{% endcapture %}
{% include elements/faq-item.html q=q a=ec %}

`END FAQ SECTION`

{% include elements/alert.html class="primary" content="Observe that the FAQ item question/header will be included in the page ToC" title="Note" %}

Take a look to the FAQ page of this site to understand better the layout of multiple FAQ items. We do not recommend to overuse this component. It is always better to alternate regular content and FAQ items and to not have more than 5 such items in one section because the readibility of the document may be affected.

{% include elements/link-btn.html type="warning" text="Site FAQ" href="/faq" newTab="true" %}