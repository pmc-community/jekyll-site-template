---
layout: page
title: Link button
permalink: /components/link-button/
categories: [Components]
tags: [button, link, anchor]
---

# Summary
Learn how to add link buttons to your content. Link buttons helps users to navigate inside your documentation or access external sites.
Docaroo provides link buttons in `bootstrap` style. Check [`Bootstrap button styles`](https://getbootstrap.com/docs/5.3/components/buttons/){: target="_blank" } for more details. You can add individual link buttons or group link buttons. Additionally, you can place anchors anywhere in the document and references to them. As example, here is an {%- include elements/anchor.html id="anchorInDocumentSummary" -%} [`anchor`](#docarooTestAnchorId) placed in this document.

We do not overwrite the known markdown syntax for links, we only complement it by adding new functionalities for links.

# Single button link
Primary outline link button targeting external link in a new tab.

{% raw %}
```javascript
{% include elements/link-btn.html 
    type="primary" 
    outline="true" 
    text="External link" 
    href="https://pmc-expert.com" 
    newTab="true" 
%}
```
{% endraw %}

{% include elements/link-btn.html type="primary" outline="true" text="External link" href="https://pmc-expert.com" newTab="true" %}

Warning button targeting a documentation permalink in the same tab

{% raw %}
```javascript
{% include elements/link-btn.html 
    type="warning" 
    text="Internal link" 
    href="/components/intro/" 
%}
```
{% endraw %}

{% include elements/link-btn.html type="warning" text="Internal link" href="/components/intro/" %}

# Button link groups
Add more buttons in the same section like this:

{% raw %}
```javascript
{% capture buttons %}
    type=primary|outline=false|text=Internal link|href="/intro/"|newTab=true,
    type=secondary|outline=false|text=External link|href="https://pmc-expert.com"|newTab=true,
    type=success|outline=false|text=Other external|href="https://hub.innohub.space"|newTab=false
{% endcapture %}

{% include elements/link-btn-group.html buttons=buttons %}
```
{% endraw %}

Please observe and respect the syntax as shown in the example above. Changing the form in which the buttons are defined may lead to unexpected render of the buttons.

{% capture buttons %}
    type=primary|outline=false|text=Internal link|href="/intro/"|newTab=true,
    type=secondary|outline=false|text=External link|href="https://pmc-expert.com"|newTab=true,
    type=success|outline=false|text=Other external|href="https://hub.innohub.space"|newTab=false
{% endcapture %}

{% include elements/link-btn-group.html buttons=buttons %}

# Parameters
- `type`: type of the link (`primary`, `secondary`, `warning`, `succees`, `danger`, `info`, `light`, `dark`, `link`). See also [Bootstrap buttons](https://getbootstrap.com/docs/5.3/components/buttons/). Default value is `primary`. If type=`link`, `outline` and `border` are ignored.
- `outline`: See [Bootstrap buttons](https://getbootstrap.com/docs/5.3/components/buttons/)
- `border`: specify if the button has or not a border, default value is `false`
- `href`: link to be targeted when click on the button
- `newTab`: specify if to open `href` in the same or a new tab
- `text`: the text to be rendered on the button

# Anchor links
Place anchors anywhere in the document like this:

{% raw %}
```javascript
This is {%- include elements/anchor.html id="docarooTestAnchorId" -%} anchor inside the document.
```
{% endraw %}

This is {%- include elements/anchor.html id="docarooTestAnchorId" -%} anchor inside the document. Observe the [`anchor`](#anchorInDocumentSummary) word in the Summary above and click on it.
