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
Docaroo provides out-of-the-box a series of integrations. The purpose of the integrations is to make available in a no-code or low-code mode some important features such as monitoring the performance of the site, collecting feedback, assessing the way in which the users are interacting with the site and more. Using these integrations offers a full image about the site and provides valuable information about how to improve it.

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

## GA/GTM

{% capture img %}
    source="partials/media/integrations/ga/ga-1.png"|caption="GA custom events"|captionBorder="true"|imgLink="https://analytics.google.com/"|imgLinkNewTab="true",
    source="partials/media/integrations/ga/gtm-1.png"|caption="GTM custom tags"|captionBorder="true"|imgLink="https://tagmanager.google.com/"|imgLinkNewTab="true"
{% endcapture %}

{% include elements/image-gallery.html 
  img=img 
  border="true" 
  hg="400px"
  oneRow="all" 
%}

## HubSpot

{% capture img %}
    source="partials/media/integrations/hs/hs-1.png"|caption="Sessions"|captionBorder="true"|imgLink="https://www.hubspot.com"|imgLinkNewTab="true",
    source="partials/media/integrations/hs/hs-2.png"|caption="Feedback form"|captionBorder="true"|imgLink="https://www.hubspot.com"|imgLinkNewTab="true",
    source="partials/media/integrations/hs/hs-3.png"|caption="Submissions"|captionBorder="true"|imgLink="https://www.hubspot.com"|imgLinkNewTab="true"
{% endcapture %}

{% include elements/image-gallery.html 
  img=img 
  border="true" 
  hg="400px"
  oneRow="all" 
%}

## New Relic

{% capture img %}
    source="partials/media/integrations/nr-img/nr-logs.png"|caption="Logs"|captionBorder="true"|imgLink="https://www.newrelic.com"|imgLinkNewTab="true",
    source="partials/media/integrations/nr-img/nr-web-app.png"|caption="Web Vitals"|captionBorder="true"|imgLink="https://www.newrelic.com"|imgLinkNewTab="true",
    source="partials/media/integrations/nr-img/nr-web-app-1.png"|caption="Performance"|captionBorder="true"|imgLink="https://www.newrelic.com"|imgLinkNewTab="true"
{% endcapture %}

{% include elements/image-gallery.html 
  img=img 
  border="true" 
  hg="400px"
  oneRow="all" 
%}

## GitHub

## Algolia

{% capture img %}
    source="partials/media/integrations/algolia/alg-1.png"|caption="Index"|captionBorder="true"|imgLink="https://www.algolia.com"|imgLinkNewTab="true",
    source="partials/media/integrations/algolia/alg-2.png"|caption="Crawler"|captionBorder="true"|imgLink="https://www.algolia.com"|imgLinkNewTab="true",
    source="partials/media/integrations/algolia/alg-3.png"|caption="Crawler test"|captionBorder="true"|imgLink="https://www.algolia.com"|imgLinkNewTab="true"
{% endcapture %}

{% include elements/image-gallery.html 
  img=img 
  border="true" 
  hg="400px"
  oneRow="all" 
%}
