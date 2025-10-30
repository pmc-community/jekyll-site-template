---
layout: page
title: HubSpot
permalink: /integrations/hubspot/
categories: [Integrations, Start, Extensions]
tags: [integration, hubspot, analytics, forms, no-code, code]
parent: Integrate
nav_order: 2
---

# Summary
HubSpot tracking code is installed by default if HubSpot integration is enabled in `_data/siteConfig.yml`. This will enable the features that are related to the tracking code such as monitoring the visits on the site, the cookies banner, call to actions and others.

{% include elements/alert.html 
  class="primary" 
  content="You may need to consult the HubSpot documentation to understand more what are the features enabled with the HubSpot tracking code."
%}

# Usage
The second out-of-the-box HubSpot integration feature offered by Docaroo is the feedback form which can be located on the right-bottom corner of each page, in the `Feedback and Support` section. Using this feature requires to have an active HubSpot account (can be even on free plan) and to do some configurations in HubSpot. These configuration are:
- create a custom property to the `Contact` object, named `Was this useful?`, internal name=`was_this_useful_`, type=`Radio select`, having 2 options (`YES` and `NO`);
- create a custom property to the `Contact` object, named `Subject`, internal name=`subject`, type=`Single line of text`;
- create a custom property to the `Contact` object, named `Source of last submission`, internal name=`source`, type=`Dropdown select` having as options the values you want to use as sources for the form submissions (i.e. the site name);
- use the form designer to create your form as shown in the next gallery;
- in the form designer click `Embed` button to get the form information (formID, region, portalID) and configure these in `_data/buildConfig.yml` under `hubspot` key;    

{% include elements/alert.html 
  class="primary" 
  content="Please consult the HubSpot documentation to learn how to add custom props to HubSpot objects and HubSpot forms designer documentation to learn how to design a HubSpot form."
%}

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

# Advanced
HubSpot forms integration is not limited to the feedback form which is provided out-of-the-box and in a no-code way. Docaroo offers the possibility to embed any HubSpot form created in the HubSpot forms designer, but this requires a bit more advanced coding skills. Even in this case, it is not necessary to start everything from scratch, Docaroo assists you with:
- a framework to embed any form: see `assets/js/hs-integrate.js`
- a very easy to understand model to style and adjust the form to your needs and preferences: see `assets/js/hs/hs-feedback-form.js` and `assets/css/hs`
- the easiest way to activate your form in a page, and to apply the custom features and styles: see `assets/js/site-page.js`, function `page__getPageFeedbackForm`

When using the pattern above, embedding a HubSpot form into the documents means:
1. design your form in HubSpot forms designer
2. create your own style for the form, to fit the design of the site and save it in `assets/css/hs` directory
3. add features (such as translations) as a js script and save it in `assets/js/hs` directory
4. create the form activation function and call it where you need it

{% include elements/alert.html 
  class="primary" 
  content="You may use the HubSpot multilanguage support for forms, but, usually, this may require to create a different instance of form for each language which leads to the necessity to monitor multiple forms submissions for consolidated submission reports. Adding custom translation features (as the feedback form has) makes that all submissions to be consolidated under a single HubSpot form, having also a language identifier."
  title="Translations" 
%}

{% include elements/alert.html 
  class="primary" 
  content="There is no limitations to the number of style and js scripts to can use to customise your form. Feel free to split your code in as many files as you need, but do not forget to include them all in the form activation function. You may also use SASS/SCSS to generate your styles, but be aware that only CSS files can be sent to the form for styling"
  title="Style/Customisations" 
%}