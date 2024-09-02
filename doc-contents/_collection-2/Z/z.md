---
layout: page
title: Collection-2/Z
permalink: /collection-2/Z/z/

parent: Collection-2/X

categories: [general, intro]
---

<!-- START_EXPOSED_SECTION -->
# General
This is a file from a collection

<!-- START MARKER 1 -->
<div id="test_inline_external_content-1"></div>

## External content
This file loads some external content from another repo and place it inline.

[Link to file in different folder](/pwc/){: .btn .btn-green }

<!--- HEADS UP!
    siteAttr = "externalContent" will force the removal of the script tag after loading page 
    This should be the normal approach since the script will be totally useless after loading page 
--->
<script siteAttr = "externalContent">
    getExternalContent (
        'https://raw.githubusercontent.com/pmc-community/business-booster/main/LICENSE', 
        'inline',
        'fullFile',
        'fullFile',
        '```Markdown content generated from a part of partial which loads a part from an external md file and place it inline```\n',
        'test_inline_external_content-1',
        'doc-contents/_collection-2/Z/z.md'
    );
</script>
<!-- END MARKER 1 -->

<script siteAttr = "externalContent">
    getExternalContent (
        'https://raw.githubusercontent.com/pmc-community/business-booster/main/LICENSE_XXX', 
        'after',
        'fullFile',
        'fullFile',
        '```Markdown content generated from a part of partial which loads a part from an external md file and place it inline```\n',
        'test_inline_external_content-1',
        'doc-contents/_collection-2/Z/z.md'
    );
</script>

<!-- END_EXPOSED_SECTION -->
