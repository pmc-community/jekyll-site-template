
{% 
    ExternalRepoContent  { 
        "markdown": true,
        "owner":"PMCDevOnlineServices", 
        "repo":"Ihs-docs", 
        "branch":"main", 
        "file_path":"Support-Center/eng/use-support-center.md", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "# Innohub Support Center",
        "include_start_marker": true,
        "end_marker": "services." ,
        "include_end_marker": true,
        "needAuth": true
    }
%}

{% capture img %}
    source="partials/media/home-s.png"|caption="Image 1"|captionBorder="true",
    source="partials/media/doc-site-s.png"|caption="Image 2"|captionBorder="true"|imgLink="https://pmc-expert.com"|imgLinkNewTab="true",
    source="partials/media/w2s-gr-s.png"|caption="Image 3"|captionBorder="true"|imgLink="https://hub.innohub.space"|imgLinkNewTab="false",
    source="partials/media/man-s.png",
    source="partials/media/joy-s.png",
    source="partials/media/man-thinking.png"
{% endcapture %}

{% include elements/image-gallery.html 
  img=img 
  border="false" 
  hg="400px"
  oneRow="all" 
%}

{% capture buttons %}
    type=primary|outline=false|text=Internal link|href="/intro/"|newTab=true,
    type=secondary|outline=false|text=External link|href="https://pmc-expert.com"|newTab=true,
    type=success|outline=false|text=Other external|href="https://hub.innohub.space"|newTab=false
{% endcapture %}

{% include elements/link-btn-group.html buttons=buttons %}
