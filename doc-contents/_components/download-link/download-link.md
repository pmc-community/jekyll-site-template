---
layout: page
title: Downloads
permalink: /components/download-link/
categories: [Components]
tags: [download, file, link, button]
---

# Summary
The download-link component generates a button link for downloading files from your documentation site. Only downloading from your site is allowed, for security reasons it is not allowed to create download links targeting files hosted on external sites. There are two prossible approaches for placing the downloadable files into the doc-contents root documentation directory, in the same directory with the parent document or in a dedicated downloads directory, under the doc-contents directory. No other option is allowed.

# Download from same directory
Downloading from the same directory as the current document is the recommended approach. This approach requires to create a directory for your document and to place the document and its download(s) in that directory. Then, creating the download link is as simple as it is shown below:

{% DirStructure doc-contents/_components/download-link %}

{% raw %}
```javascript
{% include elements/downloads.html 
    type="warning" 
    outline="false" 
    text="Download" 
    file="lorem-ipsum.pdf"
    downloadName="lorem_ipsum.pdf"    
%}
```
{% endraw %}

{% include elements/downloads.html 
    type="warning" 
    outline="false" 
    text="Download" 
    file="lorem-ipsum.pdf"
    downloadName="lorem_ipsum.pdf"    
%}

# Download from `downloads` directory
If it make more sense to have an unique directory containing all the downloads of your site, then create a `downloads` directory inside `doc-contents` root documentation directory and place your download(s) there, all in the root directory or in separate sub-folders inside `doc-contents/downloads` directory. Creating the download link is as shown below. 

{% DirStructure doc-contents/downloads %}

{% raw %}
```javascript
{% include elements/downloads.html 
    type="danger" 
    outline="false" 
    text="Download" 
    file="lorem-ipsum.pdf"
    downloadName="lorem_ipsum_alt.pdf" 
    downloadsDir="true"   
%}
```
{% endraw %}

{% include elements/downloads.html 
    type="danger" 
    outline="false" 
    text="Download"
    file="lorem-ipsum.pdf"
    downloadName="lorem_ipsum_alt.pdf" 
    downloadsDir="true"
%}

# Parameters
- `type` the button link type; default value is `primary`
- `outline` specify of the button is outlined button or not; default value is `false`
- `text` the text rendered on the link button
- `file` the name of the downloadable file
- `downloadName` the name under which the file is downloaded; if not provided, the file is downloaded with its name
- `downloadsDir` specify if the downloadable file is in the same directory as the parent document or is in doc-contents/downloads directory; default is `true` 

# Download links group
Use this component when you want to group multiple download links in the same section.

{% raw %}
```javascript
{% capture downloads %}
      type=primary|outline=false|text=Download link 1|file="lorem-ipsum.pdf"|downloadName="lorem-ipsum-group.pdf"|downloadsDir="false",
      type=secondary|outline=false|text=Download link 2|file="lorem-ipsum.pdf"|downloadName="lorem-ipsum-group-alt.pdf"|downloadsDir="true"
{% endcapture %}
{% include elements/downloads-group.html downloads=downloads %}
```
{% endraw %}

{% capture downloads %}
      type=primary|outline=false|text=Download link 1|file="lorem-ipsum.pdf"|downloadName="lorem-ipsum-group.pdf"|downloadsDir="false",
      type=secondary|outline=false|text=Download link 2|file="lorem-ipsum.pdf"|downloadName="lorem-ipsum-group-alt.pdf"|downloadsDir="true"
{% endcapture %}
{% include elements/downloads-group.html downloads=downloads %}