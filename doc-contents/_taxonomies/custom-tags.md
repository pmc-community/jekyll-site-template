---
layout: page
title: Custom tags
permalink: /taxonomies/custom-tags/
categories: [Taxonomies]
tags: [tag, custom, taxonomy]
nav_order: 2
---

# Summary
Adding and managing custom tags features are accessible in three different places of the site. Custom tags can be added and removed (from the document or from all documents) in the document info section. Custom tags can be removed from all documents and updated globally in the Tags section of the Tags Management tool. Custom tags can be removed only from a document and renamed in the Tag Details section of the Tags Management tool. Custom tags can be added to the current document directly selecting a group of words (usually, max. 3 words or 20 characters) and applying Tag document option (this feature is available on desktop only).

If the site uses Algolia DocSearch, there is another feature available when selecting text in a document body. That option is named `Tag all documents` and will tag all the documents containing the words selected.

{% include elements/alert.html 
  class="primary" 
  content="Site tags cannot be modified or removed. Also, it is not possible to duplicate a site tag with a custom tag."
  title="Note" 
%}

# Add custom tag
{% include elements/youtube.html 
    id="PbTqgrdKW2w" 
    width="640" 
    height="360"
%}

{% include elements/alert.html 
  class="warning" 
  content="Note that adding custom taxonomies to documents works only if the document reference is saved locally."
  title="Saved docs" 
%}

# Manage custom tags
{% include elements/youtube.html 
    id="fe8DI0AMWqI" 
    width="640" 
    height="360"
%}

{% include elements/alert.html 
  class="warning" 
  content="Note that tagging all documents containing the selected word(s) works on only on desktop and only if `Algolia DocSearch` is used. Tagging the active document works only on desktop but it does not depend on Algolia DocSearch."
  title="Custom tag" 
%}