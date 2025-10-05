{% capture buttons %}
    type=warning|outline=false|text="Config files"|href="/get-started/config-files/"|newTab=true,
    type=success|outline=false|text="Config options"|href="/get-started/config-options/"|newTab=true
{% endcapture %}

Only integrations using access keys/tokens are (partly) configured in the environment variables. The ones not needing such information are fully configured in the other config files.
{% include elements/link-btn-group.html buttons=buttons %}