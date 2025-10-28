---
layout: page
title: Set appearance
permalink: /go-live/appearance/
categories: [Start, Go live]
tags: [appearance, build, test, deploy]
parent: Go live
nav_order: 1
---

# Summary
Setting the appearance means to set the branding an colors of the site. The branding elements are the logo, the site title, the addtional buttons on the header and the footer visible at the bottom of the left sidebar. Additionally the following colors can be set: background and text colors for light and dark themes and the header background color.

{% include elements/alert.html 
  class="warning" 
  content="Do not forget to build and deploy the site after making changes to appearance settings!!!"
  title="Change appearance" 
%}

# Logo and Title
Site logo is an image located in `assets/img` folder. To set the site logo, copy the image file that you want in the mentioned folder, edit `_data/siteConfig.yml` and use the name of the file (only the name, not the full path) in the right place. Then build, test, deploy ... 

## Logo

The setting for the site logo is placed in `_data/siteConfig.yml`.

{% include elements/alert.html 
  class="warning" 
  content="Do not forget to copy the image file for the logo in `assets/img` folder before setting the file name in `_data/siteConfig.yml`!!!"
  title="Logo img file" 
%}

{% DirStructure assets/img %}

```yml
{% 
    ExternalRepoContent  { 
        "markdown": true,
        "owner":"pmc-community", 
        "repo":"jekyll-site-template", 
        "branch":"gh-pages", 
        "file_path":"_data/siteConfig.yml", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "layouts:",
        "include_start_marker": true,
        "end_marker": "\"logo-s.webp\"" ,
        "include_end_marker": true,
        "needAuth": true
    }
%}
```

## Title
Site title setting is placed in `_config.yml` file.
```yml
{% 
    ExternalRepoContent  { 
        "markdown": true,
        "owner":"pmc-community", 
        "repo":"jekyll-site-template", 
        "branch":"gh-pages", 
        "file_path":"_config.yml", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "title:",
        "include_start_marker": true,
        "end_marker": "Docaroo" ,
        "include_end_marker": true,
        "needAuth": true
    }
%}
```

# Auxiliary buttons
These buttons are placed on the right side of the site header and are used to point the user to some external sites that may be related or of interest (such as the company website). Technically, there is no limit of how many buttons ccan be added, but it is not recommended to have more than two buttons. Auxiliary buttons setting is placed in `_config.yml` file.

```javascript
{% 
    ExternalRepoContent  { 
        "markdown": true,
        "owner":"pmc-community", 
        "repo":"jekyll-site-template", 
        "branch":"gh-pages", 
        "file_path":"_config.yml", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "aux_links:",
        "include_start_marker": true,
        "end_marker": "aux_links_new_tab: true" ,
        "include_end_marker": true,
        "needAuth": true
    }
%}
```

# Theme text and background
The settings for the text and background colors of the dark and light themes are placed in `_data/siteConfig.yml`.

```javascript
{% 
    ExternalRepoContentMM  {
        "needAuth": false,
        "markdown": true,
        "owner":"pmc-community", 
        "repo":"jekyll-site-template", 
        "branch":"gh-pages", 
        "file_path":"_data/siteConfig.yml", 
        "ignore_wp_shortcodes": true,
        "markers": [
            {
                "start_marker": "backgroundColorOnElementsAffected:",
                "include_start_marker": true, 
                "end_marker": "elementsWithTextAffected:",
                "include_end_marker": false
            },
            {
                "start_marker": "textColorOnElementsAffected:",
                "include_start_marker": true,
                "end_marker": "elementsWithBorderTopAffected:",
                "include_end_marker": false
            }
        ]
        
    }
%}
```

# Sidebar footer
The settings for the footer visible on the bottom of the left sidebar are placed in `_data/buildConfig.yml`. Configuring a nice footer requires basic knowledge of HTML. The footer is made of a number of rows, each row can be individually designed. Technically there is no limitation in how many rows to configure in the footer, but the recommendation is to not have more than two rows.

```javascript
{% 
    ExternalRepoContent  { 
        "markdown": true,
        "owner":"pmc-community", 
        "repo":"jekyll-site-template", 
        "branch":"gh-pages", 
        "file_path":"_data/buildConfig.yml", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "siteFooter:",
        "include_start_marker": true,
        "end_marker": "googleAnalytics:" ,
        "include_end_marker": false,
        "needAuth": false
    }
%}
```

# Header background and text
The settings for changing the header background and text colors are placed in `_sass/custom/custom-vars.scss`.

```yml
{% 
    ExternalRepoContent  { 
        "markdown": true,
        "owner":"pmc-community", 
        "repo":"jekyll-site-template", 
        "branch":"gh-pages", 
        "file_path":"_sass/custom/custom-vars.scss", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "$siteHeaderBackground:",
        "include_start_marker": true,
        "end_marker": "$c-white;" ,
        "include_end_marker": true,
        "needAuth": false
    }
%}
```
# Config options

Detailed information about all the configuration options are here:
{% include 
    elements/link-btn.html 
    type="warning" 
    outline="false" text="Config options" 
    href="/get-started/config-options/" 
    newTab="true" 
%}