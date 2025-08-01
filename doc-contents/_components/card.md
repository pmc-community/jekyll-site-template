---
layout: page
title: Card
permalink: /components/card/
categories: [Components]
tags: [card, content, external, button, link, gallery]
---

# Summary
A card is a great way to emphasise a piece of information and provide also relevant visual experience with images as well as references to more detailed sources (internal or external), while a card gallery is a great way to list elements of the same type (such as projects or categories). This component is designed to allow including cards and card galeries into your documents. A card is made of an image header, a title, some content and a footer with links to more detailed sources.

As many other Docaroo components, card supports embedding external content through other docaroo components. This a very powerful way of creating cards but shoud be used with care since cards should have a very short and relevant content. The next examples shows how to create cards with other Docaroo components.

Cards can be included as single items or in galleries of cards. As much as possible avoid using single simple cards. Use them only when you want to break the monotony of a text or to emphahis something really important. Try to use cards with aside content or galleries of cards

The size of the cards is based on the best practice in creating components able to ensure both readability and good visual effects. However, the card settings can be modified as per your preferences by changing the default values in `_data/buildConfig` file.

```yaml
{% 
    ExternalRepoContent  { 
        "markdown": true,
        "owner":"pmc-community", 
        "repo":"jekyll-site-template", 
        "branch":"gh-pages", 
        "file_path":"_data/buildConfig.yml", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "card:",
        "include_start_marker": true,
        "end_marker": "0.775rem\"" ,
        "include_end_marker": true,
        "needAuth": true
    }
%}
```

{% include elements/alert.html class="warning" 
    content="These are global settings. Changing them will affect all cards used in your documents"
%}

The default size of the card is optimised for best readability and for using aside content with cards. If the `width` of the card is decreased, there is no impact on the alignment of the card and of its aside content, but the card may become to narrow, thus affecting its own visual aspect and readability. Increasing the card width may lead to overlapping between the card and its aside content, thus making the document unreadable. For large card widths it may become impossible to use aside content anymore. Remember, changing the card settings affects all the cards from the documentation. When doing such changes **always test the appearance of all cards before publishing the documentation**.

{% include elements/alert.html class="warning" 
    content="We recommend to use `rem` as the unit for card settings" 
%}

The card width can be increased up to `20rem` while keeping the same aspect ratio between the card and its aside content. or it can be set to `100%` to fill in the whole available space. Note that a card without aside content and having the width set to 100% will fill the whole viewport (page) width.

# Simple card
Adding simple cards is easy, only add the code shown below. However, as visual effect on a page, a simple card in a document section may not look quite well and can unbalance the aspect of the document. For this reason we added the option to put some aside content near to the card. This aside content can be simple text or build from other Docaroo components as the next example illustrates. If `contentAside` parameter is not set, the card is rendered as single element in the midle of its section, all further content will be rendered under the card and the space around the card will remain empty.

{% include elements/alert.html class="warning" 
    content="Note that the aside content will be shown under the card on narrow screens (mobile devices) and, normally, stays hidden until made visible using the small icon button on the right of the card title." 
%}

{% include elements/alert.html class="primary" 
    content="Avoid large texts in cards content. Best experience is achieved when the card content has less than 6 rows, ideally 3-4 rows. When you need more content related to a card, better use cards with aside content as will be shown below." 
    title="Tip" 
%}

# Example

{% raw %}
```javascript
{% capture buttons %}
    type=link|outline=true|border=true|text=Galleries|href="/components/image/#id_image_gallery"|newTab=true,
    type=link|border=false|text=Content|href="/content/ec/#id_import_external_repo_content"|newTab=true,
    type=link|border=false|text=Buttons|href="/components/link-button/#id_button_link_groups"|newTab=true
{% endcapture %}

{% include elements/card.html 
    img="partials/media/joy-s.png"
    title="Docaroo card"
    file="partials/external-content-demo/card-content-demo.md"
    contentAside="partials/external-content-demo/card-content-aside-demo.md"
    buttons=buttons
%}
```
{% endraw %}

{% include elements/alert.html class="primary" 
    content="Best experience is achieved when using images with transparent background in cards" 
    title="Tip" 
%}

{% capture buttons %}
    type=link|outline=true|border=true|text=Galleries|href="/components/image/#id_image_gallery"|newTab=true,
    type=link|border=false|text=Content|href="/content/ec/#id_import_external_repo_content"|newTab=true,
    type=link|border=false|text=Buttons|href="/components/link-button/#id_button_link_groups"|newTab=true
{% endcapture %}

{% include elements/card.html 
    img="partials/media/joy-s.png"
    title="Docaroo card"
    file="partials/external-content-demo/card-content-demo.md"
    contentAside="partials/external-content-demo/card-content-aside-demo.md"
    buttons=buttons
%}

{% include elements/alert.html class="primary" 
    content="As much as possible avoid using cards without link buton(s) in the footer. Apart from the purpose of focusing on short conclusions, the links to more detailed information which can be provided in the card footer are also important for the overall user experience" 
    title="Tip" 
%}

# Parameters
- `img`: path to the image to be the rendered in the card header
- `title`: the card title
- `file`: path to the file for the content of the card
- `contentAside`: path to the file for the aside content. Will be ignored when for card galleries
- `buttons`: the link buttons to be rendered in the footer of the card