---
layout: page
title: Integrate
permalink: /integrate/
categories: [General, Start]
tags: [integrations, log, monitor, feedback, measure, search]
has_children: true
nav_order: 3
---

# Summary
Docaroo provides out-of-the-box a series of integrations. The purpose of the integrations is to make available in a no-code/low-code mode some important features such as monitoring the performance of the site, collecting feedback, assessing the way in which the users are interacting with the site and more. Using these integrations offers a full image about the site and provides valuable information about how to improve it.

However, it is not mandatory to use the integrations, thus each integration can be independently enabled and configured or disabled. Integrations are configured using the environment variables and/or the configuration files.

{% capture buttons %}
    type=warning|outline=false|text="Config files"|href="/get-started/config-files/"|newTab=true,
    type=success|outline=false|text="Config options"|href="/get-started/config-options/"|newTab=true,
    type=danger|outline=false|text="Env variables"|href="/get-started/env/"|newTab=true
{% endcapture %}
{% include elements/link-btn-group.html buttons=buttons %}

# Integrations

{% include elements/xlsx-to-html-table.html 
    file="integrations.xlsx" 
    range="B2:H8" 
    sheet="integrations"
    source=page.path
    simple="true"
    showHead="true"
    freeze=1
%}

## Google Analytics

## Google Tag Manager

## HubSpot

## New Relic


{% capture img %}
    source="integrations/nr-img/nr-logs-s.png"|caption="Logs"|captionBorder="true",
    source="integrations/nr-img/nr-web-app-s.png"|caption="Performance"|captionBorder="true"|imgLink="https://www.newrelic.com"|imgLinkNewTab="true",
    source="integrations/nr-img/nr-web-app-1-s.png"|caption="Performance"|captionBorder="true"|imgLink="https://www.newrelic.com"|imgLinkNewTab="true"
{% endcapture %}

{% include elements/image-gallery.html 
  img=img 
  border="true" 
  hg="400px"
  oneRow="all" 
%}

## GitHub

## Algolia


