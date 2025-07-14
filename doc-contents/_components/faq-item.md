---
layout: page
title: FAQ Item
permalink: /components/qitem/
---

{% assign q = "This is a question" %}
{% assign a = "This is the answer to " | append: q  %}
{% include elements/faq-item.html q = q a = a %}

{% assign q = "How was rock invented?" %}
{% capture vid %}
  {% include elements/youtube.html id="_IVyPi5-t1s" center=true %}
{% endcapture %}
{% include elements/faq-item.html q = q a = vid %}
