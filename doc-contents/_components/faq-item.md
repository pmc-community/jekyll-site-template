---
layout: page
title: FAQ Item
permalink: /components/qitem/
---

# Summary
Learn how to add `faq-item` like elements to your documents. `faq-item` element contain a question and an answer to the question. While the question should always be a text, the answer to the question can be simple text or any rich content that is allowed in markdown. Any Docaroo component can be used to render the answer to a question, including importing content from external sources, at build time or run time.

# Simple FAQ item
In a simple FAQ item both question and answer are simple texts. Markdown syntax for text format can be used to enrich the annswer. 
{% raw %}
```javascript
{% assign q = "This is a question" %}
{% assign a = "This is the answer to " | append: q  %}
{% include elements/faq-item.html q=q a=a %}
```
{% endraw %}

{% assign q = "This is a question" %}
{% assign a = "This is the answer to " | append: q  %}
{% include elements/faq-item.html q=q a=a %}

# Rich content FAQ item
In a rich content FAQ item the question is simple texts. Markdown syntax for text format can be used. The answer is a rich media content. Any Docaroo component can be used to render the answer to a question, including importing content from external sources, at build time or run time.

{% raw %}
```javascript
{% assign q = "How was rock invented?" %}
{% capture vid %}
  {% include elements/youtube.html id="_IVyPi5-t1s" center=true %}
{% endcapture %}
{% include elements/faq-item.html q=q a=vid %}
```
{% endraw %}

{% assign q = "How was rock invented?" %}
{% capture vid %}
  {% include elements/youtube.html id="_IVyPi5-t1s" center=true %}
{% endcapture %}
{% include elements/faq-item.html q=q a=vid %}
