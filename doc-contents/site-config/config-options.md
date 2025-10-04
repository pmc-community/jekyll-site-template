---
layout: page
title: Config Options
permalink: /get-started/config-options/
categories: [General, Start, Site config]
tags: [documentation, docs, collections, configuration, options]
parent: Get started
nav_order: 3
---

All the options available for site appearance and functionalities are shown in the next table. These options are available in _config.yml or in the configuration files and will allow personalisation of the documentation site. Personalisation means that the appearance and functionalities of the site can be modified from the configuration files.

{% include elements/alert.html class="warning" 
    content="The config files may contain a lot more sections/keys/values additionally to the ones shown in the next table. If a key from a file is not shown in the next table, it means that **`it must not be changed because is not a configuration option`**. Changing other keys/values except for the ones listed on this page may cause site build fail or unexpected behavior/appearance of the site." 
%}

{% include elements/alert.html class="primary" 
    content="The site must be built and deployed (where applicable) in order to make new config options to be visible. If the site runs in dev mode, it has to be stopped and served again (using `serve` script)." title="Note" 
%}

{% include elements/xlsx-to-html-table.html 
    file="config-files.xlsx" 
    range="C2:G119" 
    sheet="Options"
    source=page.path
    simple="false"
    showHead="true"
    h="300px"
    freeze=1
%}

{% include elements/link-btn.html type="warning" outline="false" text="Config files" href="/get-started/config-files/" newTab="true" %}