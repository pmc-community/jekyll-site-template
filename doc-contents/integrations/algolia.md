---
layout: page
title: Algolia
permalink: /integrations/algolia/
categories: [Integrations, Start]
tags: [integration, algolia, search]
parent: Integrate
nav_order: 3
---

# Summary
Docaroo provides out-of-the-box full integration with Algolia DocSearch. Full integration means that we provide both Algolia index cusotmisation as well as a very powerful and extended UI experience. For Algolia search, at the moment, we provide full indexing and index update during site build, but we do not provide (yet) the UI experience. However, for most of the potential use cases of Docaroo, Algolia DocSearch covers any search need. Also it is free for ever as long as you meet Algolia DocSearch eligibility.  

# Usage

{% capture img %}
    source="partials/media/integrations/algolia/alg-1.png"|caption="Index"|captionBorder="true"|imgLink="https://www.algolia.com"|imgLinkNewTab="true",
    source="partials/media/integrations/algolia/alg-2.png"|caption="Crawler"|captionBorder="true"|imgLink="https://www.algolia.com"|imgLinkNewTab="true",
    source="partials/media/integrations/algolia/alg-3.png"|caption="Crawler test"|captionBorder="true"|imgLink="https://www.algolia.com"|imgLinkNewTab="true"
{% endcapture %}

{% include elements/image-gallery.html 
  img=img 
  border="true" 
  hg="400px"
  oneRow="all" 
%}
