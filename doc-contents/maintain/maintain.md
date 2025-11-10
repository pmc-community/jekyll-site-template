---
layout: page
title: Maintain
permalink: /maintain/
categories: [Start, Go live]
tags: [docs, documents, maintain]
nav_order: 7
---

# Summary
Maintaining the documentation is about keeping the content up-to-date, removing obsolete content or adding new content. Updating content can be related to refreshing the associated taxonomies (site tags, site categories) as well. Custom taxonomies cannot be modified when maintaining the site since these are not on the server and are kept by the users on their devices. 

{% capture c %}
  {% 
    ExternalRepoContent  { 
        "markdown": true,
        "owner":"pmc-community", 
        "repo":"jekyll-site-template", 
        "branch":"gh-pages", 
        "file_path":"doc-contents/maintain/update-content.md", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "fullFile",
        "include_start_marker": false,
        "end_marker": "fullFile" ,
        "include_end_marker": false,
        "needAuth": false
    }
%}
{% endcapture %}
{% include elements/alert.html 
  class="warning" 
  content=c 
  title="Update content" 
%}

# Doc format
Documents must be created/maintained in `markdown` format, having `.md` extension. This a very simple text format and really easy to be learned even from scratch. Using a markdown editor is by far more easier than using a complex text editor (such as Word). There are some free/open source editors available. Of course, for technical persons aiming to extend the site functionality or already using it for development we can recommend [`VS Code`](https://code.visualstudio.com/){: target="_blank"}. For non technical persons, [`Zettlr`](https://www.zettlr.com/){: target="_blank"} may be a good alternative. A great value for money is provided by [`iAWriter`](https://ia.net/writer){: target="_blank"} and this is an excellent option to write/maintain the site content (iOS mobile version is available too).

{% capture buttons %}
    type=primary|outline=false|text=VS Code|href="https://code.visualstudio.com/"|newTab=true,
    type=warning|outline=false|text=Zettlr|href="https://www.zettlr.com/"|newTab=true,
    type=success|outline=false|text=iAWriter|href="https://ia.net/writer"|newTab=true
{% endcapture %}

{% include elements/link-btn-group.html buttons=buttons %}

{% include elements/alert.html 
  class="primary" 
  content="Note that the easiest option for having multiple authors is to clone the site repository on a shared folder in your network (✳️ this will be the development environment ✳️) ➡️ install the editor of your choice on the devices of the authors ➡️ add shared `doc-contents` to the editors ➡️ build and test in development environment ➡️ deploy to production environment." 
  title="Tip" 
%}

# Add document
Adding a document means to create its file (having `.md` extension) inside the `doc-contents` folder or in any sub-folder it may be needed. Be aware that the browser url `path` to the document is not related at all to its position inside `doc-contents` folder, it is related to its `permalink` definition. Adding a new document usually requires re-serving the site with `./serve` or `serve.bat` command (when you work with the site served on port 4000 of the development environment).

The most important part of any document is its `front matter` where document data such as the `permalink` is defined. It is important to have correctly defined front matters which shall start at the first character of the document. For example, leaving an empty row or even a space before the front matter leads to build errors. See also [this doc](https://jekyllrb.com/docs/step-by-step/03-front-matter/){: target="_blank"} for more details about how to define a correct front matter.

Note that, for complex documents, the best option is to have a dedicated document folder and to place inside all the components of the documents (media, downloads, reusable pieces of content) in a sub-folder structure of your choice as in the next example:

{% DirStructure doc-contents/environments %}

# Update document
Updating a document means to change its content and/or site taxonomies. Be aware that, in the case when the site is served in the development environment (with `./serve` or `serve.bat`) and the site taxonomies are modified, it may be necessary to stop it and run the serve command again to reflect the changes. Otherwise, the modifications are automatically processed when saving the document. 

# Remove document
A document can be removed by simply deleting its file or its folder. However, when removing a document it is highly recommended to check if its related raw content was removed too, otherwise building the site may raise some errors. To do this, check `doc-raw-contents` folder, locate (if exists) the related `.txt`file and remove it. The related `.txt` file is easy to be found by name, its name is `the removed document permalink having '/' replaced by '_'` (example: a document having the permalink `/experiments/docx-summary/` will have a related raw content file named `_experiments_docx-summary_.txt`).

{% include elements/alert.html 
  class="primary" 
  content="As general rule, when is needed to force processing a document, removing its related raw content txt file will trigger this."
  title="Tip" 
%}
