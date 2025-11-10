Be aware that `updating the site content should be followed by building the site and re-deploying it to the production environment`. We also strongly recommend to `test on the development environment before deploying to production`.

{% capture buttons %}
    type=primary|outline=false|text=Build and test|href="/go-live/build/"|newTab=true,
    type=warning|outline=false|text=Deploy|href="/go-live/deploy/"|newTab=true
{% endcapture %}

{% include elements/link-btn-group.html buttons=buttons %}