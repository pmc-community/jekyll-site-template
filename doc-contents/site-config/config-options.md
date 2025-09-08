---
layout: page
title: Config Options
permalink: /get-started/config-options/
categories: [General, Start, Site config]
tags: [documentation, docs, collections, configuration, options]
parent: Get started
nav_order: 3
---

All the options available for site appearance and functionalities are shown in the next table. These options are available in _config.yml or in the configuration files and will allow personalisation of the documentation site. 

{% include elements/alert.html class="warning" 
    content="If a key from a file is not shown in the next table, it means that `it must not be changed because is not a configuration option`" 
%}

{% include elements/xlsx-to-html-table.html 
    file="config-files.xlsx" 
    range="B2:H11" 
    sheet="Options"
    source=page.path
    simple="false"
    showHead="true"
%}

{% include elements/link-btn.html type="warning" outline="false" text="Config files" href="/get-started/config-files/" newTab="true" %}