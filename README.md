# Create a documentation website
This repo contains the code needed to publish your great documentation. There are two deployment examples in this repo, with Netlify which allow you to add some backend if needed and with GitHub pages if a static site is enough for you. This documentation site template allows including its own content developed under `doc-contents` folder or external content from public, or private GitHub Repositories generated at build time, or content added at runtime, or any combination of these.

`Related pages` and `Excerpt kewords` information can be manually added to each document or can be generated automatically at build time and the `sensitivity` of the generation process can be tuned from the settings, depending on the specifics of your content.

Apart from the taxonomies provided by default (tags and categories), each user can organise the documentation using its own defined taxonomies (custom tags, custom categories, document comments, document annotations). Multiple ways of organising the docs can be used, **but only one can be active at a moment**. Users can also share the documentation organisation templates.

Advanced search features are provided either through native search or through Algolia DocSearch (free for use with documentations). We strongly recommend to use Algolia since the search features included in this code are really good. 

Other integrations that can be configured (or disabled):
- GA4 with custom events; GTM with custom tags
- NewRelic browser apps and logs

# Extensions
We provide a hooking mechanism (normally used for logging or for custom GTM tags). In any moment, for any executed function, you can extend the functionality as needed. Just hook to the function you want, add extra args to it (if applicable) and extend the functionality.


# Deployment
- from main: deployed with Netlify on [dst.innohub.space](https://dst.innohub.space). 
- from gh-pages: deployed to GitHub pages on [docaroo.innohub.space](https://docaroo.innohub.space).
