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
Google Analytics and Google Tag Manager are installed by default if enabled and configured in _data/buildConfig.yml. This will enable the collection of data about the site. When GA and GTM are connected, GA collects the information available when a GTM tag fires, this being a default feature of GA platform.  However, the most important feature of the integration is the capability to integrate GTM custom tags. 

We achieve this with by combining the customisations/configurations made on GA/GTM side (such as defining custom tags) with the `hooks` extension capabilities of Docaroo. This allows hooking into a functions and firing a custom GTM tag with parameters, once the function is executed, thus being able to monitor relevant features of the site. Here is an example of firing a custom tag each time when a document custom note is added. The hook below fires the `Add_Custom_Note` event, which it is assumed to be defined as custom tag in GTM and connected to its related custom event active in GA. 

Using this integration requires a little bit of code and GA/GTM knowledge. First, it is needed to do the needed configurations in GTM and in GA to define the custom tag and event. Second, locate the function which you want to fire the event (in the example we use `addNote` which is located in `assets/js/saved-items.js`) and bring it into global scope. Then, define the hook in `assets/js/post-hooks.js` and, finally, activate it.  

{% include elements/tabs.html 
    source="/integrations/ga-gtm"
%}

{% include elements/alert.html 
  class="primary" 
  content="You may need to consult GA and GTM documentation. Folow the instructions from that documentation to configure and activate the custom tag and event."
%}

{% include elements/alert.html 
  class="warning" 
  content="Don't forget to re-build and re-deploy the site after doing such code modifications!!!"
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
