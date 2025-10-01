---
layout: page
title: Introduction
permalink: /intro/
categories: [General]
tags: [documentation,docs]
nav_order: 1
---

# Intro document
This document can be configured to appear in the home page, header section as the entry point to the documentation. The configuration shall be made in: 
- _data/pageBuildConfig.yml, `/` section, `startPermalink` key and is used in `_includes/siteIncludes/partials/home/header-section.html` as `site.data.pageBuildConfig['/'].startPermalink`
- _data/pageBuildConfig.yml, `/` section, `sections/header_section/startBtnText` key and is used in `_includes/siteIncludes/partials/home/header-section.html` as `site.data.pageBuildConfig["/"].sections.header_section.startBtnText`