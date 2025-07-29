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

# Simple image

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
- `h`: image height
- `w`: image width
- `imgLink`: link to an external target if the image is included in a gallery (see `Image Gellery` below). Note that the behaviour of the `imgLink` in case of galleries is different than the behaviour of `link` in case of simple images. The navigation to external pages is not triggered directly from the gallery, is shown as button after the gallery image opens in a larger view.
- `imgLinkNewTab`: specify if to open `imgLink` in the same or a new tab (see `Image Gellery` below)

# Image galery
Galleries of images can be added to documents as further shown. The number of images per each row is limited to 3 on large screens and to 2 images for narrow screens (mobile) if the height of the gallery is not set by `oneRow`.

{% raw %}
```javascript
{% capture img %}
    source="partials/media/home-s.png"|caption="Image 1"|captionBorder="true",
    source="partials/media/doc-site-s.png"|caption="Image 2"|captionBorder="true"|imgLink="https://pmc-expert.com"|imgLinkNewTab="true",
    source="partials/media/w2s-gr-s.png"|caption="Image 3"|captionBorder="true"|imgLink="https://hub.innohub.space"|imgLinkNewTab="false",
    source="partials/media/man-s.png",
    source="partials/media/joy-s.png",
    source="partials/media/man-thinking.png"
{% endcapture %}

{% include elements/image-gallery.html 
  img=img 
  border="true" 
  hg="400px"
  oneRow="mobile" 
%}
```
{% endraw %}

{% capture img %}
    source="partials/media/home-s.png"|caption="Image 1"|captionBorder="true",
    source="partials/media/doc-site-s.png"|caption="Image 2"|captionBorder="true"|imgLink="https://pmc-expert.com"|imgLinkNewTab="true",
    source="partials/media/w2s-gr-s.png"|caption="Image 3"|captionBorder="true"|imgLink="https://hub.innohub.space"|imgLinkNewTab="false",
    source="partials/media/man-s.png",
    source="partials/media/joy-s.png",
    source="partials/media/man-thinking.png"
{% endcapture %}

{% include elements/image-gallery.html 
  img=img 
  border="true" 
  hg="400px"
  oneRow="mobile" 
%}

# Parameters
- `source`: path to the image file provided as relative path from the root of doc-contents folder
- `caption`: image caption if needed
- `captionBorder`: specify it to render a thin border between the image and the caption
- `hg`: fixed height of the whole gallery (useful for large galleries). Vertical scroll is enabled if necessary.
- `oneRow`: the gallery is rendered on a single row and horizontal scroll is enabled. 

Note that `oneRow` can be `none`, `all`, `mobile` or `desktop`. Any other value will make it to be assigned with `none`. When a device type is specified, the gallery is rendered on a single row on that device and acoording to `hg` on other devices. When `oneRow` is missing or set to `none`, the gallery is rendered on all devices with a height equal to `hg` or full height if `hg` is missing.