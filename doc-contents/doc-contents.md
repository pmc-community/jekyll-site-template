---
layout: page
title: Docs root
permalink: /get-started/doc-contents/
categories: [General, Start]
tags: [documentation, docs, collections]
parent: Get started
nav_order: 1
---

# Doc contents
Doc-contents is the root folder of the documents and collections. The way in which this folder is organised is strictly depending on the structure you want to have for your documentation, there is no limitation in this matter. 

However, some sub-folders are necessary to be present:
- `_faq`: the collection folder where the Q&A files must be placed if a FAQ section is enabled for the site
- `downloads`: the folder where is recommended to place the download files, see also **[`Download component`](/components/download-link/){: target="_blank" }**
- `general`: 404 page is placed here
- `partials`: the folder where is recommended to place reusable content. The structure of this folder is not limited.
- `tools`: the folder in which the helper pages are placed

{% include elements/alert.html class="warning" content="These folders must not be removed as they are used for specific purposes when building the site." %}

# Doc init
After cloning or downloading **[Docaroo repository](https://github.com/pmc-community/jekyll-site-template){: target="_blank" }** it is needed to setup your documentation root folder (`doc-contents`). Remove the default one (which contains this documentation) and replace it with the one found in the `start-up` folder, having the structure shown below. 

{% DirStructure start-up/doc-contents %}

Observe that we provide also an example of the entry point to your documentation (`intro.md`). Feel free to modify it as needed. This document is already configured as the entry point to your documentation (a button link pointing to it is visible in the head section of the home page). You can always modify it in `_data/pageBuildConfig.yml`, under the home page (`\`) configuration section. The permalink of the entry point document is the value of `startPermalink` key, while the text shown on the link button is the value of `startBtnText` key.

```javascript
{% 
    ExternalRepoContent  { 
        "markdown": true,
        "owner":"pmc-community", 
        "repo":"jekyll-site-template", 
        "branch":"gh-pages", 
        "file_path":"_data/pageBuildConfig.yml", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "/",
        "include_start_marker": true,
        "end_marker": "featuredMedia" ,
        "include_end_marker": false,
        "needAuth": false
    }
%}
```

After creating the root folder of your documentation, you can start adding documents and collections of documents. Remember, the key of a good documentation is the way in which you structure it. Another key success point is to identify the reusable content and to not duplicate pieces of content in your documentation. This way you will avoid heavy documentation maintenance and inconsistency of your content.

{% include elements/link-btn.html 
    type="warning" 
    text="Content strategy" 
    href="/content/intro/"
    newTab="true" 
%}

# Collections
Using collections is the best way to group your documentation in thematic sections. Docaroo works with two types of collections, `custom collections` and `default collections`. 

{% include elements/alert.html class="warning" content="While there is no limitations when defininig `custom collections`, the `default collections` configuration must not be changed." %}

## Definition

Inside the documentation root folder (`doc-contents`), the collections are defined as folders having the name starting with `_`. Besides of the collections folders, collections are defined in `_config.yml` configuration file as is shown below.

{% include elements/alert.html class="warning" content="It is not enough to create a folder having the name starting with `_` to use it as collection. It is necessary to do the proper configurations in `_config.yml` too." %}

```javascript
{% 
    ExternalRepoContent  { 
        "markdown": true,
        "owner":"pmc-community", 
        "repo":"jekyll-site-template", 
        "branch":"gh-pages", 
        "file_path":"_config.yml", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "# MARKER COLLECTIONS START",
        "include_start_marker": false,
        "end_marker": "# MARKER COLLECTIONS END" ,
        "include_end_marker": false,
        "needAuth": false
    }
%}
```

{% include elements/alert.html class="warning" content="Even if structuring your documentation in folders does not have limitations, it is strongly recommended to not give names starting with `_` for folders placed on the first level under `doc-contents` since is better to keep this naming convention for `collection folders`" %}

## Home page
Collections are shown on the home page in a dedicated collection section (after the home page header section). The default settings for the `home page, collection settings` are defined in `_data/pageBuildConfig.yml` as shown next:


```javascript
{% 
    ExternalRepoContent  { 
        "markdown": true,
        "owner":"pmc-community", 
        "repo":"jekyll-site-template", 
        "branch":"gh-pages", 
        "file_path":"_data/pageBuildConfig.yml", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "collections_section",
        "include_start_marker": true,
        "end_marker": "mostRecentAndPopular_section" ,
        "include_end_marker": false,
        "needAuth": false
    }
%}
```

- `enabledInHome`: the collection section is shown or not in the home page
- `except`: list of collections that must be not shown, given in the form `["posts", "..", ".."]`
- `itemsToShow`: number of collection docs to be shown in the list on home page. Most recent documents will be selected.
- `collectionStartBtnText`: the text shown on the button link to the collection entry document (if such entry point is defined)
- `buttonsClass`: the type of the button link to the collection entry document (see **[Bootstrap buttons](https://getbootstrap.com/docs/5.3/components/buttons/){: target="_blank" }**)
- `buttonsTextClass`: the type of the text shown on he button link to the collection entry document (see **[Text colors](https://getbootstrap.com/docs/5.3/utilities/colors/){: target="_blank" }**)

## Entry point
A collection can have (or not) a document which is its entry point. In case if this document is defined, when building the side and creating the collection section of the home page, a link button is added to the list of the documents from the collection and points to the collection entry document. The `collection entry point configuration` is defined in the `front_matter` of the document which needs to be such an entry point, as shown below, as example:

```javascript
{% 
    ExternalRepoContent  { 
        "markdown": true,
        "owner":"pmc-community", 
        "repo":"jekyll-site-template", 
        "branch":"gh-pages", 
        "file_path":"doc-contents/_content/content.md", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "---",
        "include_start_marker": true,
        "end_marker": "---" ,
        "include_end_marker": true,
        "needAuth": false
    }
%}
```

- `start`: if `true`, the document will be the collection entry point. If `false` or missing, the document will not be the collection entry point. If more documents are set with `start:true`, the first one found at the build time will be the collection entry point.
- `nav_order`: not mandatory but recommended. Is the position of the document inside the collection, so it is recommended to be placed on the first position.