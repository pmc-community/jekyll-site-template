---
name: 👍 Use post hook
---

🪝 Define hook
{: .text-primary}

```javascript
{% 
    ExternalRepoContent  { 
        "markdown": true,
        "owner":"pmc-community", 
        "repo":"jekyll-site-template", 
        "branch":"gh-pages", 
        "file_path":"assets/js/post-hooks.js", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "addNoteAction:",
        "include_start_marker": true,
        "end_marker": "}," ,
        "include_end_marker": true,
        "needAuth": false
    }
%}
```

🏹 Activate hook
{: .text-primary}

```javascript
{% 
    ExternalRepoContent  { 
        "markdown": true,
        "owner":"pmc-community", 
        "repo":"jekyll-site-template", 
        "branch":"gh-pages", 
        "file_path":"assets/js/post-hooks.js", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "hooks.addAction('addNote'",
        "include_start_marker": true,
        "end_marker": "'post');" ,
        "include_end_marker": true,
        "needAuth": false
    }
%}
```