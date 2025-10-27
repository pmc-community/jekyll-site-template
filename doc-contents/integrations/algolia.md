---
layout: page
title: Algolia
permalink: /integrations/algolia/
categories: [Integrations, Start]
tags: [integration, algolia, search]
parent: Integrate
nav_order: 3
---

# Summary
Docaroo provides out-of-the-box full integration with Algolia DocSearch. Full integration means that we provide both Algolia index customisation as well as a very powerful and extended UI experience. For Algolia search, at the moment, we provide full indexing and index update during site build, but we do not provide (yet) the UI experience. However, for most of the potential use cases of Docaroo, Algolia DocSearch covers any search need. Also it is free for ever as long as you meet Algolia DocSearch eligibility.

Algolia DocSearch UI experience is provided by default once this integration is enabled and properly configured. The search experience has multilanguage support by default. Additionally, we provide a very nice `search-on-site` feature, meaning that is not always necessary to open the search box to do your search. Host select a text on page and see `Search in site` option in the context menu. 

# Usage
Using Algolia DocSearch is a `no-code` configuration but requires minimum knowledge about Algolia. Integration with Algolia DocSearch needs only to configure the parameters of the integration after getting them from Algolia. Activating this integration means:
1. [**`sign-up for Algolia DocSearch`**](https://docsearch.algolia.com/){: target="_blank"}. After receiving the Algolia DocSearch app information, configure it in `.env` file and/or as `Github actions secrets` or `Netlify build environment variables`
2. modify the default crawler with the script we provide and test the updated crawler
3. configure the index using the configuration we provide (this will generate the minimum necessary index configuration)
4. manually crawl the site and check the records generated in the index
5. re-build and re-deploy the site

{% include elements/alert.html 
  class="primary" 
  content="You may need to consult Algolia documentation to understand how to use the crawler editor and how to apply settings on the index."
%}

The Algolia DocSearch integration is based on the next parameters:

```javascript
{% 
    ExternalRepoContent  { 
        "markdown": true,
        "owner":"pmc-community", 
        "repo":"jekyll-site-template", 
        "branch":"gh-pages", 
        "file_path":"doc-contents/environments/env-doc.txt", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "# Algolia",
        "include_start_marker": true,
        "end_marker": "read(public) key, see Algolia documentation>" ,
        "include_end_marker": true,
        "needAuth": false
    }
%}
```

When the deployment is on `Github pages` or `Netlify`, then the Github integration parameters should be configured in as `action secrets` in Github or `environment variables` in Netlify. The names of the integration parameters is the same, regardless of the deployment environment (local, custom, Github pages or Netlify).

{% include elements/alert.html 
  class="primary" 
  content="You may need to consult the Github documentation or the Netlify documentation to find out how to define action secrets (Github) or environment variables (Netlify)."
%}

Here is an example of how the elements of a well configured Algolia DocSearch integration may look like:

{% capture img %}
    source="partials/media/integrations/algolia/alg-1.png"|caption="Index"|captionBorder="true"|imgLink="https://www.algolia.com"|imgLinkNewTab="true",
    source="partials/media/integrations/algolia/alg-3.png"|caption="Crawler test"|captionBorder="true"|imgLink="https://www.algolia.com"|imgLinkNewTab="true",
    source="partials/media/integrations/algolia/alg-2.png"|caption="Crawler"|captionBorder="true"|imgLink="https://www.algolia.com"|imgLinkNewTab="true"
{% endcapture %}

{% include elements/image-gallery.html 
  img=img 
  border="true" 
  hg="400px"
  oneRow="all" 
%}

# Advanced
As described earlier, for Algolia search, at the moment, we provide full indexing and index update during site build, but we do not provide (yet) the UI experience. For this reason, using the integration with Algolia search requires more advanced developer skills since it is needed to build the UI search experience over the index which is automatically updated when building the site.

To use Algolia search integration it is needed to:
1. create the Algolia search app and (if allowed by your plan) the crawler
2. (if applicable) modify the crawler using the crawler script we provide. Test your crawler
3. apply minimum index configuration with the configuration we provide for custom indexes
4. if you already have content published, force full re-build of the site by removing `doc-raw-contents` folder. `Be aware that it may take a while, depending on how much content you already have`. This will create the records in the index.
5. create the search UI experience. `You may need to consult Algolia documentation at this point!`
6. deploy the site

The Algolia search integration is based on the next parameters:

```javascript
{% 
    ExternalRepoContent  { 
        "markdown": true,
        "owner":"pmc-community", 
        "repo":"jekyll-site-template", 
        "branch":"gh-pages", 
        "file_path":"doc-contents/environments/env-doc.txt", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "ALGOLIA_CUSTOM_ENABLED =",
        "include_start_marker": true,
        "end_marker": "admin key, see Algolia documentation>" ,
        "include_end_marker": true,
        "needAuth": false
    }
%}
```
{% include elements/alert.html 
  class="primary" 
  content="Algolia DocSearch and regular Algolia search can be both active in the same time, although for search purposes DocSearch does the job. However, if you are not eligible for Algolia DocSearch, you may need to use the regular Algolia search (on free or paid plans)."
%}

{% include elements/alert.html 
  class="warning" 
  content="Updating the algolia search index at build time will add records to the index only for the site content that was modified since last build (incremental build). If you want to activate Algolia search at one moment, be aware that you need to force full re-build of the site. Remove `doc-raw-contens` folder to force full rebuild and first initialisation of the Algolia search index. `Be aware that this operation may lead to a longer build time for that build!!!`"
  title="Algolia search index"
%}