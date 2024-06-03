---
layout: page
permalink: /devtest/
title: DevTest
nav_order: 1
---

{% CatList %}

{% CatDetails %}

{% TagList %}

{% TagDetails %}

{% SitePages %}

[T a g 1](http://localhost:4000/tag-info?tag=t%20a%20g%201){: .btn .btn-green }
[Tag1](http://localhost:4000/tag-info?tag=tag1){: .btn .btn-green }

{%assign s = "/collection1/g11/" %}
{% capture json_string %}
{
    "permalink": "{{ s }}"
}
{% endcapture %}

{% assign my_object = json_string | json_string_to_object %}
{{my_object}}

{% PageExcerpt {{ my_object }} %}

{% 
    PageExcerpt {
        "permalink":"/collection1/g11/"
    } 
%}

{{ site.data.category_list | cat_main_menu }}

