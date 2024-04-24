---
layout: page
permalink: /categories/
title: Categories
nav_order: 1
---

{% CatList %}

{% CatDetails %}

{% TagList %}

{% TagDetails %}

{% SitePages %}

[Tag1](http://localhost:4000/tag?tag=tag1){: .btn .btn-green }

{% assign selected_tag = 'tag1' %}
{% assign tag_key = '' %}
{% assign tag_value = '' %}

{% for tag in site.data.tags_details %}
  {% if tag[0] == selected_tag %}
    {% assign tag_key = tag[0] %}
    {% assign tag_value = tag[1] %}
    {% break %}
  {% endif %}
{% endfor %}

First tag key: {{ tag_key }}
First tag value: {{ tag_value }}

<h1>Tag = {{ selected_tag }}</h1>

<ul>
  {% for page in tag_value.pages %}
  <li><a href="{{ page.permalink }}">Title = {{ page.title }}</a></li>
  {% endfor %}
</ul>
