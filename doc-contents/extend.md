---
layout: page
title: Extend
permalink: /extend/
categories: [General]
tags: [extend, hooks, low-code, code]
has_children: false
nav_order: 4
---

# Summary
We offer out-of-the-box the possibility to extend the functionality of the site by hooking on the execution of the functions on browser side. Although this feature was initially designed to allow different integrations (such as GA/GTM or New Relic), it is perfectly adapted to extend the functionality of the site as it may be needed. Be aware that using extensions requires development skills (mostly on Javascript). The level of the required skills depends on the complexity of the extension. 

The basic principle of hooks is that are executed immediately after the execution of the target function (which has to be known in the global scope), it is aware of the result of the execution of the target function, it is aware of the arguments used to execute the target function and it can take additional parameters to further extend the functionality.

{% include elements/alert.html 
  class="primary" 
  content="The possibility to extend the functionality on server side is provided by default by [Jekyll plugins](https://jekyllrb.com/docs/plugins/){: target=\"_blank\"}"
  title="SERVER SIDE" 
%}

# Target function
The target function needs to be known in the global scope to be hookable. You may take a look to [this document](/integrations/ga-gtm/#id_usage){: target="_blank"} to see an example of how to [make a function hookable](/integrations/ga-gtm/#id_usage){: target="_blank"}.

The hook is set by `hooks.addAction` method which takes the following parameters:
- `hookable function`: the name of the target function
- `additional arguments`: array of values which will be attached to the hook besides of the target function arguments which are passed by default to any hook
- `priority` (0 is the highest): sets the order of execution for the hooks attached to the same target function
- `hook type`: string which can be `init` or `pre` or `post`

# Hook type
There are three types of hooks, depending on what target function is needed to be extended. 
There are three intervals in which the potential target functions are executed:
1. Executed outside/before `document.ready` (`INIT-HOOKS`).
2. Executed after `document.ready` and before the document/page is fully loaded, including all async functions (`PRE-HOOKS`)
3. Executed on user action such as click on buttons (`POST-HOOKS`)

{% include elements/alert.html 
  class="primary" 
  content="The key of using hooks is to set them before the execution of the target function. If the hook is set after the execution of the target function, it has no effect since the target function execution cannot be captured anymore."
   title="IMPORTANT!" 
%}

## INIT-HOOKS
These hooks are ideally for inline functions executed within `<script> tags` and for functions executed outside `document.ready` blocks. These hooks are located in `_includes/siteIncludes/partials/init-hooks.html`.

{% include elements/alert.html 
  class="warning" 
  content="INIT-HOOKS does not have access to any asset (variables, functions) since these are not available at the time of such target function execution. Only the super globals are available at the moment of the execution of the INIT-HOOKS target functions."
%}

Example of an init hook:

```javascript
{% 
    ExternalRepoContent  { 
        "markdown": true,
        "owner":"pmc-community", 
        "repo":"jekyll-site-template", 
        "branch":"gh-pages", 
        "file_path":"_includes/siteIncludes/partials/init-hooks.html", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "fullFile",
        "include_start_marker": false,
        "end_marker": "fullFile" ,
        "include_end_marker": false,
        "needAuth": false
    }
%}
```

## PRE_HOOKS
These hooks are ideally for functions executed after `document.ready` and before the document/page is fully loaded. These hooks are located in `assets/js/pre-hooks.js`.

{% include elements/alert.html 
  class="warning" 
  content="PRE-HOOKS may not have access to some assets (variables, functions) since these may not be available at the time of such target function execution. When setting the hooks it is recommended to always test if the assets you want to use are available. Such test can be easily performed by a simple `console.log(<asset>)`."
%}

Examples of pre-hooks:

```javascript
{% 
    ExternalRepoContent  { 
        "markdown": true,
        "owner":"pmc-community", 
        "repo":"jekyll-site-template", 
        "branch":"gh-pages", 
        "file_path":"assets/js/pre-hooks.js", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "hooks.addAction",
        "include_start_marker": true,
        "end_marker": "7, 'pre');" ,
        "include_end_marker": true,
        "needAuth": false
    }
%}
```

## POST-HOOKS
These hooks are ideally for functions executed in user actions such as click on buttons (`POST-HOOKS`). These hooks are located in `assets/js/post-hooks.js`.

{% include elements/alert.html 
  class="warning" 
  content="POST-HOOKS have access to all assets (variables, functions) since all of these are available at the time of such target function execution."
%}

Examples of post-hooks:

```javascript
{% 
    ExternalRepoContent  { 
        "markdown": true,
        "owner":"pmc-community", 
        "repo":"jekyll-site-template", 
        "branch":"gh-pages", 
        "file_path":"assets/js/post-hooks.js", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "postHooksActions",
        "include_start_marker": true,
        "end_marker": ",3, 'post')" ,
        "include_end_marker": true,
        "needAuth": false
    }
%}
```