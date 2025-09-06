---
layout: page
title: Documents
permalink: /get-started/doc-contents/
categories: [General, Start]
tags: [documentation,docs]
parent: Get started
nav_order: 1
---

# Doc-contents
Doc-contents is the root folder of the documents and collections. The way in which this folder is organised is stricly depending on the structure you want to have for your documentation, there is no limitation in this matter. 

However, some sub-folders are necessary to be present:
- `_faq`: the collection folder where the Q&A files must be placed if a FAQ section is enabled for the site
- `downloads`: the folder where is recommended to place the download files, see also **[`Download component`](/components/download-link/){: target="_blank" }**
- `general`: 404 page is placed here
- `partials`: the folder where is recommended to place reusable content. The structure of this folder is not limited.
- `tools`: the folder in which the helper pages are placed

{% include elements/alert.html class="warning" content="These folders must not be removed as they are used for specific purposes when building the site." %}

# Init
After cloning or downloading **[Docaroo repository](https://github.com/pmc-community/jekyll-site-template){: target="_blank" }** it is needed to setup your documentation roor folder (`doc-contents`). Remove the default one (which contains this documentation) and replace it with the one found in the `start-up` folder, having the structure shown below. 

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

Inside the documentation root folder (`doc-contents`), the collections are defined as folders having the name starting with `_`. Besides of the collections folders, collections are defined in `_config.yml` configuration file as is shown below.

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