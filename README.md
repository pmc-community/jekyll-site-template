# Create a documentation website
This repo contains the code needed to publish your great documentation. There are two deployment examples in this repo, with Netlify which allow you to add some backend if needed and with GitHub pages if a static site is enough for you. This documentation site template allows including its own content developed under `doc-contents` folder or external content from public, or private GitHub Repositories generated at build time, or content added at runtime, or any combination of these.

`Related pages` and `Excerpt kewords` information can be manually added to each document or can be generated automatically at build time and the `sensitivity` of the generation process can be tuned from the settings, depending on the specifics of your content.

# Taxonomies
Apart from the taxonomies provided by default (tags and categories), each user can organise the documentation using its own defined taxonomies (custom tags, custom categories, document comments, document annotations). Multiple ways of organising the docs can be used, **but only one can be active at a moment**. Users can also share the documentation organisation templates.

# Search features
Advanced search features are provided either through native search or through Algolia DocSearch (free for use with documentations). We strongly recommend to use Algolia since the search features included in this code are really good. 

Other integrations that can be configured (or disabled):
- GA4 with custom events; GTM with custom tags
- NewRelic browser apps and logs

# Extensions
We provide a hooking mechanism (normally used for logging or for custom GTM tags). In any moment, for any executed function, you can extend the functionality as needed. Just hook to the function you want, add extra args to it (if applicable) and extend the functionality.

# Deployment
- from main: deployed with Netlify on [dst.innohub.space](https://dst.innohub.space). 
- from gh-pages: deployed to GitHub pages on [docaroo.innohub.space](https://docaroo.innohub.space).

We provide dedicated CI/CD actions to deploy your site (for GitHub pages and Netlify). There are some limitations for multilanguage as will be further described. However, the build process may consume some time and resources because it self-generates some information by running some models. For this reason, we highly recommend to build locally your site (including each language version) and then run the deployment action(s) if you use a cloud environment such as GitHub pages. The deployment process is made in such way that it does not run complex tasks if the conntent was not changed from the previous deployment. Otherwise, the deployment process may take long, consuming your build minutes or your pay-as-you-go build time/resources. Nevertheless, the deployment actions are able build the site directly on the deployment environment.

# Integrations
We provide out-of-the-box a series of integrations that will enhance the functionality of your documentation site. Integrations are available as `no-code` or `low-code` in most of the cases. However, through the extensions possibilities offered by Docaroo, `advanced` integrations requiring development skills are also available. Among the most important integrations we offer are:
- Google Analytics/Google Tag Manager
- HubSpot
- New Relic
- Algolia (DocSearch) and Algolia search
- Github 

# Multilanguage
This documentation site template fully supports multilanguage when deployed with GitHub pages. Each language version must reside in its own branch named with the language code. The GitHub deployment action (currently configured to be manually triggered, but you can easily make it automatically triggered and/or include it in larger CI/CD piplelines) will deploy all language versions, there is nothing expected form your side in order to achieve this (of course, except for actually creating each language version and put it in a separate branch).
For other deployments (such as Netlify or custom deployment), you have to handle on your own the multilanguage deployment. Wehat we fully support is building the site in the language you configure to be built. Then, deployment of each language version is your task, based on the specifics of your deployment environment.

# FAQ feature
We provide an advanced faq generation feature. Each question and answer can be defined as separate md file, under doc-contents/_faq directory. If faq feature is activated for the site, when building the site, the faq section is automatically generated. The faq md file supports complex md syntax and liquid tags. Combined with the option to embedd external content at build time, you can refer directly the answer to a question to some content from other files (from your docs or from other public/private repos). 
