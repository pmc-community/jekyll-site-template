---
layout: page
title: Rich media
permalink: /components/rich-media/
---

# Summary
Learn how to use Docaroo components to embed rich media into your content. We do not encourage to store large media on your doc-contents folder. Since this is a documentation site, the access to the media files should be public since we don't have a backend to make the requests to get the media, thus any private access key cannot be exposed. 

# Figma files
Currently we support design, boards (fig jam), slides and deck files. **Prototypes are not supported for the moment, we are working on this.**

Limitations and warnings:
- any file you embed must be public, be careful with granting permissions
- `design`, `board` and `slides` files can be opened in Figma, thus users can comment, use this types of files if you want to collect feedback
- `slides` files my not work well on mobile, test them before releasing to your users
- `deck` and `prototype` cannot be opened in Figma, this is the best way to publish information from Figma since you can maintain your design and boards private. However, it may add some extra maintenance work for fig jam files. While `design` files are always in `sync with the prototype derived from them`, the `board files` are not, thus you may need to `put them in slides before publishing as decks` and this can generate some extra work when you change something in the board file (you need to manually update the slides)

{% include elements/alert.html class="primary" content="Note that Figma file ids are different for design, boards, slide and decks, thus you can make public (and embed) only what you really want to share form your Figma project. In the next examples, the whole Figma project is public for view only." title="Figma files" %}

{% include elements/alert.html class="warning" content="Page navigator is allowed only for slide files. For design and board files the page navigator is disabled." title="Page navigation" %}

You have to be aware that your visitors can open the embedded file in Figma. `View only` permission will allow the visitors to post comments which can be viewed and replied to by any other visitor. If you don't want this to happen, we recommend to embed `deck` and `prototype` Figma files.

{% include elements/alert.html class="primary" content="Comments are not visible on the embedded file on page, can be seen only when open the file in Figma." title="Comments on embedded file" %}

{% include elements/alert.html class="danger" content="Be very careful to what permissions you grant to the visitors when embedding Figma files. Normally, you should not allow more than `View only` permission." title="Permissions" %}

## Design
Embed Figma design, starting from a specific node, with a thin border around it.

{% highlight javascript %}
{% raw %}{% include elements/figma.html what="design" file="vJEs0lhqI4OnqzaZBKeR4k" node="10-2&t=W2N493rkaJxxmBy0-4" footer="true" border="true" %}{% endraw %}
{% endhighlight %}

{% include elements/figma.html what="design" file="vJEs0lhqI4OnqzaZBKeR4k" node="10-2&t=W2N493rkaJxxmBy0-4" footer="true" border="true" %}

## Fig jam
Embed Figma board, starting from the root node, with a thin border around it.

{% highlight javascript %}
{% raw %}{% include elements/figma.html what="board" file="jNZumE2gKxP4PE8fZBBxJt" node="0-1" border="true" %}{% endraw %}
{% endhighlight %}

{% include elements/figma.html what="board" file="jNZumE2gKxP4PE8fZBBxJt" node="0-1" border="true" %}

## Slides
{% include elements/alert.html class="warning" content="Be aware that slides may not work well on mobile, is a known issue. For this reason we recommend to embed deck files" title="Slide files on mobile" %}

To test if slides are embedded correctly on mobile, add `testSlides="true"` parameter to the include tag and check the page on mobile. If slides are shown correctly, leave it as is. If slides are not shown, remove the `testSlides` parameter from the include tag. The slides will be embedded on desktop and will be replaced with a link to the figma file on mobile.

{% highlight javascript %}
{% raw %}{% include elements/figma.html what="slides" file="D4jLYCi1QWiKbPXuHrOOd8" border="true" %}{% endraw %}
{% endhighlight %}

{% include elements/figma.html what="slides" file="D4jLYCi1QWiKbPXuHrOOd8" border="true" %}

## Decks

{% include elements/alert.html class="primary" content="Deck files doesn't need a `Reset view` button since slide navigation is added by default. Also, there is no way to lose the slides from focus as in case of design and boards with pan move. So, for deck files, resetBtn will be ignored even if you specify it." title="Reset view button" %}

{% highlight javascript %}
{% raw %}{% include elements/figma.html what="deck" file="D4jLYCi1QWiKbPXuHrOOd8" border="false" h="400px" %}{% endraw %}
{% endhighlight %}

{% include elements/figma.html what="deck" file="D4jLYCi1QWiKbPXuHrOOd8" border="false" h="400px" %}

## Prototypes

`elements/figma.html` doesn't accept prototypes, it accepts only `design`, `board`, `slides` and `deck` files. If you try something like the following include (with anything else than the accepted file types), you will get an alert.

{% highlight javascript %}
{% raw %}{% include elements/figma.html what="proto" file="D4jLYCi1QWiKbPXuHrOOd8" border="false" h="400px" %}{% endraw %}
{% endhighlight %}

{% include elements/figma.html what="proto" file="D4jLYCi1QWiKbPXuHrOOd8" border="false" h="400px" %}

# Video files
## Youtube
{% highlight javascript %}
{% raw %}{% include elements/youtube.html id="HFsPgkqMUzc" width="640" height="360" %}{% endraw %}
{% endhighlight %}

{% include elements/youtube.html id="HFsPgkqMUzc" width="640" height="360" %}

## Vimeo
{% highlight javascript %}
{% raw %}{% include elements/vimeo.html id="1089723439" width="640" height="360" %}{% endraw %}
{% endhighlight %}

{% include elements/vimeo.html id="1089723439" width="640" height="360" %}

# Graphics
## Lottie animations
{% highlight javascript %}
{% raw %}{% include elements/lottie.html id="b9c3d8e8-0304-49ea-8c47-1fb872d8cae3/UUN7MtiRMP" h=50 w=50 pad=0 %}{% endraw %}
{% endhighlight %}

{% include elements/lottie.html id="b9c3d8e8-0304-49ea-8c47-1fb872d8cae3/UUN7MtiRMP" h=50 w=50 pad=0 %}