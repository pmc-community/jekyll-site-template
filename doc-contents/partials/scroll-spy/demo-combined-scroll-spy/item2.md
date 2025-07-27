---
name: Item 2
---

**External conntent below:**

{% 
    ExternalSiteContent  {
        "markdown": true,
        "file_path":"partials/external-content-demo/ec1.md", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "fullFile", 
        "include_start_marker": false,
        "end_marker": "fullFile",
        "include_end_marker": false,
        "needAuth": false 
    }
%}