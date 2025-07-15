---
layout: page
title: Content
permalink: /content/intro/
nav_order: 1
start: true
---

# Summary
Learn how to structure and use the content in the most efficient way. The secret is to use to the maximum extent the features made available, out of which importing external content (at build time or at run time) is the most powerful since it allows establishing single source of truth for a lot of repetitive pieces of content that you may need to use in your documents. As such, when modifying this kind of pieces of content, you don't have to remember in which document you place it, only modify the source and the pice of content will appear in its new version in all document where is placed.

There are two types of content that you can use in your documents:
- content directly included in your documents
- content imported from `external sources`

We define an `external source` as a source of content which is outside the current document. An external source can be another file from your documentation or a file from an external Github repository (public or private). External sources are very important because allows you to create reusable pieces of content which can be placed anywhere within your documentation. The content from external sources (`external content`) can be rendered at `build time` or at `run time`. These beeing said, it becomes clear that it is very important the way in which you organise your documentation.

# Organise documents
As example, we will use the structure of Docaroo documentation. The documents are located in `doc-contents` folder inside the project folder. We name `doc-contents` as the `docs root folder`.

{% DirStructure doc-contents %}

Following the structure of Docaroo documents, you can organise your documentation based on the next recommendations:
1. Do not rename the `docs root folder`, it has to be always named `doc-contents`
2. Do not remove the following sub-folders: 
    - `general`: it contains some mandatory html files (currently 404.html, which you can customise as you need)
    - `_tools`: it contains the main tools made available by Docaroo for easy work documents and taxonomies as well as `faq` page if this feature is active
    - `_faq`: if `faq` feature is active for the site, this sub-folder contains the questions and answers
3. Use `collections` of documents to group your documents in relevant sections. A collection is a folder starting with `_` and properly declared in `_config.yml`
4. For easy find all document's components (such as images), you can put each document on it's own folder together with the media files that it uses. This approach may be bette than having a single source of many media files. However, large media files (such as videos) should not be stored in the `docs root folder` and to be rendered/played from specialized and much faster sources (such as Vimeo or Youtube).  We provide dedicated components for such situations.

{% include elements/alert.html class="primary" content="Observe the files in partials sub-folder. These files doesn't have regular front matter and should stay like this to avoid them to be rendered as documents at build time." %}
