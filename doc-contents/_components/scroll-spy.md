---
layout: page
title: Scroll Spy & Tabs
permalink: /components/scrollspy/
categories: [Components]
tags: [scrollspy, content, tabs]
---

# Summary
`Scroll Spy` and `Tabs` are great ways of organising information inside your documents. We made them flexible and easy to be included in the documents. Any Docaroo component, including importing esternal content or rich content ones, can be used to populate scroll spies and tabs. 

# Scroll spy
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
    spyBorder="false" 
%}
`END SCROLLSPY DEMO`

Feel free to size the height according to your needs, the default one is 300px, applicable when `h` parameter is not provided.

# Parameters
Here are the default values for scroll spy parameters. If you don't provide a parameter, then the default value will be used.

- `h`: "300px"
- `btn`: "false"
- `btnType`: "primary"
- `outline`: "false"
- `separators`: "false"
- `spyBorder`: "false"

# Tabs

{% raw %}
```javascript
{% include elements/tabs.html 
    source="partials/scroll-spy/demo-scroll-spy"
%}
```
{% endraw %}

`START TABS DEMO`

{% include elements/tabs.html 
    source="partials/scroll-spy/demo-scroll-spy"
%}
`END TABS DEMO`

# Combined
It is possible to combine tabs and scroll spies (or the other way around). We do not recommend to include `tabs` into `scroll spies` (although it is possible) because of potential readability issues on mobile phone screens. Including `scroll spies` into `tabs` looks well on mobile screens too.
Here is an example based on the content from the folder `demo-combined-scroll-spy`:

{% DirStructure doc-contents/partials/scroll-spy %}

{% raw %}
```javascript
{% include elements/tabs.html 
    source="partials/scroll-spy/demo-combined-scroll-spy"
%}
```
{% endraw %}

`START TABS SCROLLSPY DEMO`
{% include elements/tabs.html 
    source="partials/scroll-spy/demo-combined-scroll-spy"
%}
`END TABS SCROLLSPY DEMO`