---
layout: page
title: Integrate
permalink: /integrate/
categories: [General, Start]
tags: [integration, log, monitor, feedback, measure, search]
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
Docaroo provides out-of-the-box a series of integrations with other platforms as listed below. The main purpose is to enhance the functionalities of the site and to provide means to monitor and measure the performance as well as to collect feedback from the users or advanced search features.

{% include elements/alert.html 
  class="primary" 
  content="Use the integrations only in the case you really need to monitor/measure performance or you want advanced search or you need to collect feedback or you need to communicate somehow with your users through various forms. If not the case, you may simple disable them all or only some of them as further instructed. Everything will work fine even without integrations."
  title="Use integrations"
%}

As general rule, the integrations are provided in `no code`/`low code` way. However, the framework on which Docaroo is built provides the options to extend the functionalities and enhance integrations in a traditional way ... writing code.

{% include elements/xlsx-to-html-table.html 
    file="integrations.xlsx" 
    range="B2:I8" 
    sheet="integrations"
    source=page.path
    simple="true"
    showHead="true"
    freeze=1
%}

As general rule and except GA/GTM integration which does not depend at all on a Google paid plan or similar because Analytics and Tag Manager are free to use, all the other integrations `can work well on the related platform free plans`. In fact, for small/medium sites, the free plans of the integrated platforms are enough for regular operations. However, if the site gains more users and the traffic grows (which we all want 😁), paid plans for the integrated platforms should be considered. 

While `Algolia` and `HubSpot` are less sensitive to this aspect (having a paid plan depends more on what additional features your business requires rather than on those features necessary for integration), `New Relic` may need a superior plan due its data retention and data ingestion limits in the free plan and `Github` may require a paid plan to increase the API limits. 