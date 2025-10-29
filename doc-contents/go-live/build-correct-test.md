---
layout: page
title: Build and test
permalink: /go-live/build/
categories: [Start, Go live]
tags: [appearance, build, test, deploy]
parent: Go live
nav_order: 2
---

# Summary
Building and testing the site means go generate the site, running the automatic testing and the spell checking. Following the site build and tests results, corrections may be needed. When everything is fine, is time to serve the site locally and test its appearance and functionality. 

# Build
Docaroo provides a ready-made script for building and running automatic tests on the development environment. This script is optimised for MacOS and Linux and can be started with `./build` command. In a similar way, on Windows machines, `build.bat` can be used. 

To build the site:
1. open a terminal window
2. navigate to the root directory of the site
3. run `./build`

{% capture moments %}
    text=Preflight test|sec=12,
    text=Spell check|sec=37.2
{% endcapture %}

{% include elements/youtube.html 
    id="5KjcT6kfzFs" 
    width="640" 
    height="360"
    moments=moments
%}
