---
layout: page
title: Config Files
permalink: /get-started/config-files/
categories: [General, Start, Site config]
tags: [documentation, docs, collections, configuration]
parent: Get started
nav_order: 2
---

# Summary
Docaroo provide multiple options to configure the the site functionality and appearence. The configurations can be made in _config.yml and in the configuration files placed in _data folder. As a general rule, each time when a configuration is changed, it is necessary to re-build the site to make the configuration effective (if the site is running in test mode, it is necessary to stop it and serve it again).

Docaroo configurations are of two categories:
- necessary at build time
- necessary at run time

The configuration files are named in an intuitive way to make a clear distinction on what is necessary at build time and what is necessary to be passed to the browser to be used at run time. 

# Config files
Except for `_config.yml`, Docaroo configuration files are located in `_data` folder:

{% DirStructure _data %}

{% include elements/xlsx-to-html-table.html 
    file="config-files.xlsx" 
    range="B2:D7" 
    sheet="Tables"
    source=page.path
    simple="true"
    showHead="true"
%}