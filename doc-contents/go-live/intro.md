---
layout: page
title: Go live
permalink: /go-live/
categories: [Start, Go live]
tags: [appearance, build, test, deploy]
has_children: true
nav_order: 6
---

# Summary
Going live with the site is a pretty straight forward process which involves tuning of the appearance (if needed), building and testing in the development environment and publishing (deploying) in production environment. We make available the necessary tools for each step of this process, including a set of automatic tests carried out during the build process to identify those errors that, usually, can generate the highest level of frustration when dealing with content heavily based on text (thus, being subject to potential many spelling issues) or content which can contain a high number of internal and external links (which may become broken sometimes) or content imported from external sources (which may become unavailable sometimes).  

# Usage
A normal flow for going live would be:

{% include elements/alert.html 
  class="primary" 
  content="[**`Set appearance`**](/go-live/appearance/){: target=\"_blank\"} ↔️ [**`Build`**](/go-live/build/){: target=\"_blank\"} ↔️ **`Corrections`** ↔️ [**`Test locally`**](/go-live/build/){: target=\"_blank\"} ➡️ [**`Deploy`**](/go-live/deploy/){: target=\"_blank\"}"
%}

- [**`Set appearance`**](/go-live/appearance/){: target="_blank"}  means to set the branding an colors of the site
- [**`Build`**](/go-live/build/){: target="_blank"}  means go generate the site, running the automatic testing and the spell checking
- [**`Test locally`**](/go-live/build/){: target="_blank"}  means to serve the site on the development environment and test its functionality
- [**`Deploy`**](/go-live/deploy/){: target="_blank"} means to update the production environment (such as on-prem, or Github pages or Netlify, or similar) 