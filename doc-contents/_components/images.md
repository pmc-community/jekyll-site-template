---
layout: page
title: Image
permalink: /components/image/
categories: [Components]
tags: [image, component]
---

# Summary
This component allows placing images into your content. Images can have captions (let's say you need to show some credits or copyright information) or not. The compoenent is designed to work with responsive images. You can specify a desired height and with (or only one of these), but we do not recommend this approach since it may break thre responsiveness. Images can be stored in any place inside the documents root folder (`doc-contents`). Depending on how you want to organise your documentation, images may be stored in the same folder of the parent document (or in a sub-folder of it) or you can create a dedicated media folder inside `doc-contents`, the image is found based on the relative path inside `doc-content`.

# Examples
The following examples are based on a dedicated media folder:

{% DirStructure doc-contents/partials/media %}

## Simple image

{% raw %}
```javascript
{% include elements/image.html 
  source="partials/media/home-600.png" 
  caption="Image caption"
  captionBorder="true"
  link="https://pmc-expert.com"
  newTab="true"
%}
```
{% endraw %}

Observe that the `height` and `width` parameters were not provided to not break the responsiveness. If really needed, these parameters shall be provided like `h="...px"` and `w="...px"`. Any known unit is accepted (`px`, `vh`, `vw`, `%`, `auto`). When only one value is provided (`h` or `w`), the other one is automatically assigned with `auto` value.

{% include elements/image.html 
  source="partials/media/home-600.png" 
  caption="Image caption"
  captionBorder="true"
  link="https://pmc-expert.com"
  newTab="true"
%}

# Parameters
- `source`: path to the image file provided as relative path from the root of doc-contents folder
- `caption`: image caption if needed
- `captionBorder`: specify it to render a thin border between the image and the caption
- `link`: link to an external target if you want to have the image as link to another internal or external page
- `newTab`: specify if to open `link` in the same or a new tab