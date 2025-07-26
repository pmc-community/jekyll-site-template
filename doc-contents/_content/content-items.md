---
layout: page
title: Content items
permalink: /content/content-items/
categories: [Components]
tags: [items, content]
---

# Summary
Docaroo makes available a series of content items that can be used to enrich your documents and to be very efficient when wanting to incorporate piecers of content in a fast and robust way. As main difference from the regular components, content items are, usually, designed to provide smaller pieces of content that can be incorporated directly in your documents or are used in components.

# Directory structure
This content item renders the structure of any folder/directory from your documentation project. It us useful when wanting to point out the source of some pats of your documentation. Use it like:

{% raw %}
```javascript
{% DirStructure doc-contents/partials/scroll-spy %}
```
{% endraw %}

{% DirStructure doc-contents/partials/scroll-spy %}

# External content
This content item renders parts of the content from other documents form your documentation. It renders the content found between defined markers or the full external file content. It also can render content from multiple sets of markers from the external file. This feature is very important for at least several reasons.

Using this feature you can create re-usable pieces of content and place those into your documentation. When you modify one of such pieces of content, the modification will be reflected everywhere where the piece of content is placed.

Another important aspect is that you can create your documentation outside the project directory, in another branch of the project repository or even in external repositories. This can be really helpful for multilanguage documentations and allows you to keep good consistency of your content creation process.

Last, but not least, you are able to import content at run time (not only at build time). This can be very helpful whrn you want to add pieces of content that are very dynamic and subject of frequent changes and you don't want to re-build your site each time. 

However, `when importing content from external repositories, be aware of potential API limits` imposed by GitHub. Click on the next button to find out how you can import content from other sources into your docs.

{% include elements/link-btn.html type="warning" outline="false" text="Import content" href="/content/ec/" newTab="true" %}

# Table and charts
These two content items are designed to add the power of Excel to your docs. Usually, creating complex tables directly in markdown can be a challenge even for experienced authors. Creating charts in markdown is not even possible by default. So, we created these content items to allow you to focus on what is important and to use the right tools for tables and charts. This tool is Excel ... so feel free to create your tables and charts in Excel files and then import them to your docs.

{% capture buttons %}
    type=warning|outline=false|text=Tables|href="/components/xlsx-tables/"|newTab=true,
    type=warning|outline=false|text=Charts|href="/components/xlsx-charts/"|newTab=true
{% endcapture %}
{% include elements/link-btn-group.html buttons=buttons %}

