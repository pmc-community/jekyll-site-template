---
name: 🏷️ GA/GTM config
---
⚙️ Configure GA and GTM
{: .text-primary}

- Create the custom tag in your GTM container and activate it
- Create the custom event in GA, connect it to the custom tag and activate it

{% capture img %}
    source="partials/media/integrations/ga/ga-1.png"|caption="Custom events"|captionBorder="true"|imgLink="https://analytics.google.com/"|imgLinkNewTab="true",
    source="partials/media/integrations/ga/gtm-1.png"|caption="Custom tags"|captionBorder="true"|imgLink="https://tagmanager.google.com/"|imgLinkNewTab="true"
{% endcapture %}

{% include elements/image-gallery.html 
  img=img 
  border="false" 
  hg="400px"
  oneRow="all" 
%}