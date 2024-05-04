---
layout: page
title: Collection-2/X
permalink: collection-2/X/x/
has_children: true
has_toc: false
---

<!-- START_EXPOSED_SECTION -->

```
Own markdown content.
```
This the content directly typed in {{ page.title }}.

<h1 class="bd-callout bd-callout-warning">Using bootstrap classes</h1>
<p class ="p-5 bg-success-subtle border border-successsubtle rounded text-dark" >
This is one good inline external link to https://pmc-expert.com and one good inline internal link to /collection-2/Z/z/. These are no tconverted into a tags, so will be not checked by broken llinks utilities.
</p>

{: .highlight .p-5 }
Using jtd classes 

| head1        | head two          | three |
|:-------------|:------------------|:------|
| ok           | good swedish fish | nice  |
| out of stock | good and plenty   | nice  |
| ok           | good `oreos`              |
| ok           | good `zoute` drop | yumm  |

```
Markdown content loaded from another md file from the same collection.
HEADS UP!
WATCH OUT THE LIMITATIONS FOR LOADING CONTENT FROM ANOTHER FILE, THE SOURCE FILE MUST BE BELOW THE DESTINATION FILE IN THE FOLDER STRUCTURE.
OTHERWISE THE CONTENT SHOULD BE LOADED CONSIDERING THE SOURCE AS EXTERNAL FILE AND USE getExternalContent(...) FUNCTION. 
```
{% capture included_content %}
    {% include_relative Y/y.md %}
{% endcapture %}

{% include siteIncludes/modules/utilities.liquid fileContent=included_content %}
{{ file_content_result }}

<script siteAttr = "externalContent">
    getExternalContent (
        'https://raw.githubusercontent.com/pmc-community/figma/main/ReactPluginTemplate/README.md', 
        'before',
        '{{ site.data.siteConfig.extContentMarkers.startExposedSection }}',
        '{{ site.data.siteConfig.extContentMarkers.endExposedSection }}',
        '```Markdown content generated from a part of partial which loads a part from an external md file and place it on top of the content area```',
        '',
        'doc-contents/partials/partExtFile.md'
    );
</script>
<!-- END_EXPOSED_SECTION -->