---
layout: page
title: Taxonomies
permalink: /taxonomies/intro/
nav_order: 1
start: true
categories: [Taxonomies]
tags: [tags, categories, notes, annotations]
nav_order: 1
---

# Summary
One of the most powerful features we offer out-of-the-box is defining and using custom taxonomies. This feature allows the users to organise the information in a way that suits their preference, making the usage of documentation to be customised as per the goal and purpose needed by the user. There is no limit in how many ways the documentation can be organised using custom taxonomies, meaning that the users can have one taxonomy system for each purpose. For example, if the purpose is to define a way to understand some workflows, this can be realised with one taxonomy system. In the same time, if for the same documentation, it is necessary to group the documents for understanding concepts, this can be another taxonomy system. The only limitation is that, at one moment, only one taxonomy system can be active. The taxonomy systems can be saved and loaded at any time and users can even share them.

{% include elements/alert.html 
  class="warning" 
  content="Taxonomy systems are composed from tags, categories, document notes and in-document annotations. Be aware that custom tags and categories cannot duplicate the ones coming defined at build time."
  title="Custom taxonomy" 
%}

# Tags
We will use the following classification:
- `Site tags`: The built-in tags created when the documents are drafted. Once the site is built, these tags cannot be further modified by the user
- `Custom tags`: Tags that can be added/modified/removed by the user. These can be seen and used only by the user who created them. However, sharing with other users it is possible.

{% include elements/link-btn.html 
    type="warning" 
    text="Custom tags" 
    href="/taxonomies/custom-tags/"
    newTab="true" 
%}

# Categories
We will use the following classification:
- `Site categories`: The built-in categories created when the documents are drafted. Once the site is built, these categories cannot be further modified by the user
- `Custom categories`: Categories that can be added/modified/removed by the user. These can be seen and used only by the user who created them. However, sharing with other users it is possible.

{% include elements/link-btn.html 
    type="warning" 
    text="Custom categories" 
    href="/taxonomies/custom-cats/"
    newTab="true" 
%}

# Notes
These are comments added by the user to the documents. Can be seen and used only by the user who created them. However, sharing with other users it is possible.

{% include elements/alert.html 
  class="warning" 
  content="The traditional blog posts comments feature is not available since the site is a static site (no backend provided by default). If such feature is mandatory for the goals you follow, consider to deploy on Netlify and use Netlify functions or comments plugins (if available) or consider to develop your won backend (Cloudflare workers and turnstile may be a good option for developing a backend)"
  title="Info" 
%}

{% include elements/link-btn.html 
    type="warning" 
    text="Custom notes" 
    href="/taxonomies/custom-notes/"
    newTab="true" 
%}

# Annotation
These are comments added by users to specific sections or parts of the text from a document. Can be seen and used only by the user who created them. However, sharing with other users it is possible.

{% include elements/alert.html 
  class="warning" 
  content="The traditional blog posts comments feature is not available since the site is a static site (no backend provided by default). If such feature is mandatory for the goals you follow, consider to deploy on Netlify and use Netlify functions or a comments plugins (if available) or consider to develop your own backend (Cloudflare workers and turnstile may be a good option for developing such backend)"
  title="Info" 
%}

{% include elements/link-btn.html 
    type="warning" 
    text="Custom annotations" 
    href="/taxonomies/custom-annotations/"
    newTab="true" 
%}

# Manage taxonomies
We provide the features needed for managing the custom taxonomy system. Additionally, custom taxonomies are completely integrated in the site search as long as Algolia is used (DocSearch or Search) as search engine.

{% capture buttons %}
    type=primary|outline=false|text="Tags"|href="/tag-info/"|newTab=true,
    type=danger|outline=false|text="Categories"|href="/cat-info/"|newTab=true,
    type=warning|outline=false|text="Documents"|href="/site-pages/"|newTab=true
{% endcapture %}
{% include elements/link-btn-group.html buttons=buttons %}

# Enable custom taxonomies
To use custom taxonomies on documents it is necessary to `save` a reference to the document to the user's device. This can be made from the document info panel or from the document management tool.