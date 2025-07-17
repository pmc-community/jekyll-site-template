---
layout: page
title: Scroll Spy
permalink: /components/scrollspy/
categories: [Components]
tags: [scrollspy]
---

# Summary
Scroll Spy is a great way of organising information inside your documents. We made it flexible and easy to be included in the documents. Any Docaroo component, including importing esternal content or rich content ones, can be used to populate a scroll spy. 

# Example
The content of a scroll spy consist in a number of markdown files placed anywhere inside your `doc-contents` folder. Our recommendation is to place this content either in `partials` sub-folder (as it is in the following example), or in a folder created for the document in which the scroll spy is used.
For the following example we use a scroll spy content stored in the following structure:

{% DirStructure doc-contents/partials %}

The scroll spy is simply added to document like this:

{% raw %}
```javascript
{% include elements/scroll-spy.html
    source="partials/scroll-spy/demo-scroll-spy" 
    h="400px" 
    btn="true" 
    btnType="primary" 
    outline="false" 
    separators="true" 
    spyBorder="fale"
%}
```
{% endraw %}

`START SCROLLSPY DEMO`
{% include elements/scroll-spy.html 
    source="partials/scroll-spy/demo-scroll-spy"
    h="300px" 
    btn="true" 
    btnType="primary" 
    outline="false" 
    separators="true" 
    spyBorder="false" %}
`END SCROLLSPY DEMO`

Feel free to size the height according to your needs, the default one is 300px, applicable when `h` parameter is not provided.

# Default parameters
- `h`: "300px"
- `btn`: "false"
- `btnType`: "primary"
- `outline`: "false"
- `separators`: "false"
- `spyBorder`: "false"