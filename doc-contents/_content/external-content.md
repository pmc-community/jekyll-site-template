---
layout: page
title: External content
permalink: /content/ec/
categories: [Content]
tags: [embed, external, import]
---

# Summary
Docaroo allows `importing content at build time` to your documents. External content is important because it allows you to create `resusable parts` of content and import these parts in multiple places in your documents. It is possible to import content from external public and private Github repositories but **you must be sure that the content you want to import is available at the time when you build your site**, as the imported content is added at build time. 

It is also possible to `import content at run time`, but be aware this type of content may be not indexed for search (when using Algolia, capturing the client rendered content depends on the behaviour of the crawler and on the response time of the site; when using native search, it is not indexed at all). This content will be reflected in the page ToC, you can tag (with custom tags) or classify (custom categories) based. on this content and you can also add comments to your docs based on this content, but this content will not be returned by site search features (regardless if you use native searching or Algolia search). We recommend to use this type of content for short pieces of content that are not very relevant to the core subject of the documentation (such as some news or announcements). 

This type of content can be imported from any source that returns markdown and follows the same logic of selecting the content between start and end markers. This type of content can be imported only from `public sources` as we currently do not support custom authentication on client side. It is also important to be aware of the API limitations of the source and to not abuse of the usage of run time imported content since this content is loaded each time when the page containing it is loaded (for example, Github has some limits related to raw content reading API). Currently we do not support run time content caching yet.

{% include elements/alert.html 
  class="warning" 
  content="Observe the **`ignore_wp_shortcodes`** setting below. This setting makes that potential Wordpress shortcodes that may be present in the content imported from external sources (in the case if that content is also used on a Wordpress site) to be ignored, thus to not produce non-sense texts on your docs. If you are sure that the imported content does not contain Wordpress shortcodes, you can set it to `false`. Be aware that when set to `true`, texts in the form `[...]` may not appear in your imported content"
  title="Wordpress" 
%}

# Import site content
Import content from another file from your site, between start and end markers. Markers can be set by you (in which case it must be in the from of HTML comments to not affect the rendering of the source file), or can be any placeholders (existing text) of the source file. The path to the source file should be given as relative path from the root documents directory. 

{% include elements/alert.html class="warning" content="Always check if the markers are present in the source file!!!" title="Markers" %}

{% raw %}
```javascript
{% 
    ExternalSiteContent  {
        "markdown": true,
        "file_path":"partials/external-content-demo/ec1.md", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "<!-- START MARKER 1 -->", 
        "include_start_marker": false,
        "end_marker": "<!-- END MARKER 1 -->",
        "include_end_marker": false,
        "needAuth": false 
    }
%}
```
{% endraw %}

`IMPORTED CONTENT`

{% 
    ExternalSiteContent  {
        "markdown": true,
        "file_path":"partials/external-content-demo/ec1.md", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "<!-- START MARKER 1 -->", 
        "include_start_marker": false,
        "end_marker": "<!-- END MARKER 1 -->",
        "include_end_marker": false,
        "needAuth": false 
    }
%}

`END IMPORTED CONTENT`

If you want to import the full source file, use the reserved `fullFile` marker.

{% raw %}
```javascript
{% 
    ExternalSiteContent  {
        "markdown": true,
        "file_path":"partials/external-content-demo/ec2.md", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "fullFile", 
        "include_start_marker": false,
        "end_marker": "fullFile",
        "include_end_marker": false,
        "needAuth": false 
    }
%}
```
{% endraw %}

`IMPORTED CONTENT`

{% 
    ExternalSiteContent  {
        "markdown": true,
        "file_path":"partials/external-content-demo/ec2.md", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "fullFile", 
        "include_start_marker": false,
        "end_marker": "fullFile",
        "include_end_marker": false,
        "needAuth": false 
    }
%}

`END IMPORTED CONTENT`

# Import multiple site content
You can import multiple parts from a source file from you documentation. Each part should be found between a start and end markers. Parts can overlap.

{% raw %}
```javascript
{% 
    ExternalSiteContentMM  {
        "needAuth": false,
        "markdown": true, 
        "file_path":"intro.md", 
        "ignore_wp_shortcodes": true, 
        "markers": [
            {
                "start_marker": "Welcome",
                "include_start_marker": true, 
                "end_marker": "organization.",
                "include_end_marker": true 
            },

            {
                "start_marker": "Use",
                "include_start_marker": true, 
                "end_marker": "Each",
                "include_end_marker": false 
            }
        ]
    }
%}
```
{% endraw %}

`IMPORTED CONTENT`

{% 
    ExternalSiteContentMM  {
        "needAuth": false,
        "markdown": true, 
        "file_path":"intro.md", 
        "ignore_wp_shortcodes": true, 
        "markers": [
            {
                "start_marker": "Welcome",
                "include_start_marker": true, 
                "end_marker": "organization.",
                "include_end_marker": true 
            },

            {
                "start_marker": "Use",
                "include_start_marker": true, 
                "end_marker": "Each",
                "include_end_marker": false 
            }
        ]
    }
%}

`END IMPORTED CONTENT`

# Import external repo content
You can import into your documents content from external `Github repositories`. These repositories can be public (`"needAuth": false`) or private (`"needAuth": true`). Any number of public repositories can be used to import content. For private repositories, the number of repositories that can be used to import content to your documents depends on the access key that is configured. The access key and user (organisation) should be configured in `.env` for development environment (`JEKYLL_ACCESS_TOKEN` and `JEKYLL_GIT_USER`) and as Github action secret (same names) for production environment.

{% include elements/alert.html class="info" content="The private repositories must belong to a single Github user or organisation" title="Private repositories" %}
{% include elements/alert.html class="warning" content="Currently we support only GitHub repositories" title="Repositories" %}

{% raw %}
```javascript
{% 
    ExternalRepoContent  { 
        "markdown": true,
        "owner":"PMCDevOnlineServices", 
        "repo":"Ihs-docs", 
        "branch":"main", 
        "file_path":"Support-Center/eng/use-support-center.md", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "# Innohub Support Center",
        "include_start_marker": true,
        "end_marker": "services." ,
        "include_end_marker": true,
        "needAuth": true
    }
%}
```
{% endraw %}

`IMPORTED CONTENT`

{% 
    ExternalRepoContent  { 
        "markdown": true,
        "owner":"PMCDevOnlineServices", 
        "repo":"Ihs-docs", 
        "branch":"main", 
        "file_path":"Support-Center/eng/use-support-center.md", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "# Innohub Support Center",
        "include_start_marker": true,
        "end_marker": "services." ,
        "include_end_marker": true,
        "needAuth": true
    }
%}

`END IMPORTED CONTENT`

# Import multiple external repo content
Exactly as for the content from other files from your documentation, you can import multiple parts of content from external Github repositories

{% raw %}
```javascript
{% 
    ExternalRepoContentMM  {
        "needAuth": true,
        "markdown": true,
        "owner":"PMCDevOnlineServices", 
        "repo":"Ihs-docs", 
        "branch":"main", 
        "file_path":"Register-to-innohub/eng/register-to-innohub.md", 
        "ignore_wp_shortcodes": true,
        "markers": [
            {
                "start_marker": "# Registration to innohub",
                "include_start_marker": true, 
                "end_marker": "Be aware that the registration will not give you",
                "include_end_marker": false
            },
            {
                "start_marker": "by providing your email address and a password.",
                "include_start_marker": false,
                "end_marker": "Be aware that, if you are already logged in",
                "include_end_marker": false
            }
        ]
        
    }
%}
```
{% endraw %}

`IMPORTED CONTENT`

{% 
    ExternalRepoContentMM  {
        "needAuth": true,
        "markdown": true,
        "owner":"PMCDevOnlineServices", 
        "repo":"Ihs-docs", 
        "branch":"main", 
        "file_path":"Register-to-innohub/eng/register-to-innohub.md", 
        "ignore_wp_shortcodes": true,
        "markers": [
            {
                "start_marker": "# Registration to innohub",
                "include_start_marker": true, 
                "end_marker": "Be aware that the registration will not give you",
                "include_end_marker": false
            },
            {
                "start_marker": "by providing your email address and a password.",
                "include_start_marker": false,
                "end_marker": "Be aware that, if you are already logged in",
                "include_end_marker": false
            }
        ]
        
    }
%}

`END IMPORTED CONTENT`

# Import code from external repo
Importing code from external repositories is exactly as importing any other content (as earlier explained). The only addition is that you need to wrap the import in markdown code block ticks.

{% raw %}
````javascript
<code block ticks>
{%
    ExternalRepoContent  { 
        "markdown": true,
        "owner":"florinhoinarescu", 
        "repo":"IHS-Master", 
        "branch":"master", 
        "file_path":"app/ihs-main-app/src/loader/app-loader.js", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "fullFile",
        "include_start_marker": false,
        "end_marker": "fullFile" ,
        "include_end_marker": false,
        "needAuth": true
    }
%}
<code block ticks>
````
{% endraw %}

`IMPORTED CONTENT`

```javascript
{%
    ExternalRepoContent  { 
        "markdown": true,
        "owner":"florinhoinarescu", 
        "repo":"IHS-Master", 
        "branch":"master", 
        "file_path":"app/ihs-main-app/src/loader/app-loader.js", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "fullFile",
        "include_start_marker": false,
        "end_marker": "fullFile" ,
        "include_end_marker": false,
        "needAuth": true
    }
%}
```

`END IMPORTED CONTENT`

# Import content at run time
Import content at run time like shown below. Use with care and check if there are potential limitations of the source APIs for reading files.

{% raw %}
```javascript
{% include elements/run-time-content.html 
    source="https://raw.githubusercontent.com/pmc-community/business-booster/main/LICENSE" 
    startMarker="fullFile" 
    endMarker="The above"
    caller=page.url
    header="**This is a custom `header` for the run time imported content**\n" 
%}
```
{% endraw %}

`RUN-TIME IMPORTED CONTENT`

{% include elements/run-time-content.html 
    source="https://raw.githubusercontent.com/pmc-community/business-booster/main/LICENSE" 
    startMarker="fullFile" 
    endMarker="The above"
    caller=page.url
    header="**This is a custom `header` for the run time imported content**\n" 
%}

`END RUN-TIME IMPORTED CONTENT`