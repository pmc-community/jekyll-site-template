---
layout: page
title: Get started
permalink: /get-started/
categories: [General, Start]
tags: [documentation,docs]
has_children: true
nav_order: 2
---

# Organise
Getting started with Docaroo requires, first of all, to design your documentation. Organising well your documentation (or blog) is crucial. This will involve defining the folder structure and also the taxonomies. That's all you need since, Docaroo can take care of automatically generating other information about you documentation.

{% include elements/link-btn.html type="primary" outline="false" text="Organise docs" href="/content/intro/#id_organise_documents" newTab="true" %}

# Install
After you designed your documentaion, you need to install the local environment. You will need at least to:
- [install Ruby](https://www.ruby-lang.org/){: .text-primary target="_blank"}
- [install Jekyll](https://jekyllrb.com/){: .text-primary target="_blank"}
- [fork or clone or download](https://github.com/pmc-community/jekyll-site-template/tree/gh-pages){: .text-primary target="_blank"} and unzip the site framework. Rename it as you wish. 
- install Python 3.9 to use the Python based features (keywords and summary generation, related and similar pages detection) and some of the compoents (`XLSX Tables`, `XLSX Charts`)

{% include elements/alert.html class="warning" content="Py 3.9 is necessary because of some incompatibility between the `transformers` py library and Python versions > 3.9 (as of May 2025). If you have already Py>3.9 installed (i.e. MacOS 15+ comes with Py 3.13), create a Py3.9 environment for your project. However, you may check periodically if the said incompatibility is still on or not" %}

# Customise
Use configuration files for customising your site as you need. These files are located in `_data` folder and are:
- `siteConfig.yml`: contains settings that are used for building the site and are then sent to the browser to be used on client side
- `buildConfig.yml`: contains settings that are used for building the site and are NOT sent to the browser to be used on client side
- `pageConfig`: contains specific page settings that are used for building the site and are then sent to the browser to be used on client side
- `pageBuildConfig`: contains specific page settings that are used for building the site and are NOT sent to the browser to be used on client side

As in any Jekyll site, customisations can be added in `_config.yml` located in the root directory. However, we do not recommend this approach, the idea behind the customisation is to keep `_config.yml` for the minimum necessary configurations and use the other configuration files for detailed customisations. The only dynamic ocnfiguration we use inside `_config.yml` is related to the definition of the collections of documents.

# Create
Next, you need to transpose the documentation into `doc-contents` folder in your project folder. Create your content there as `markdown files` in free form and/or using the ready-made Docaroo components and re-usable content.

# Build & Test
Build and deploy locally using one simple command launched from your project directory. Open a terminal window, navigate inside your project directory and type `./serve` (for Linux/MacOS) or the Windows bat equivalent. Use `http://<your_local_IP>:4000` from any computer in your intranet (or `http://localhost:4000` from the same machine) to open the site in browser. Use `./build` to only build the site, without deploying locally. 

{% include elements/alert.html class="warning" content="Our strong recommendation is to buid and test incrementally, the build process is desigend to process only the changes from previous builds. Processing a large number of docs (more than 20) in a sigle batch may take time (mostly when you use the advanced Python based features)." %}

# Deploy
Setup a Github repository for your project, commit your project there and setup [Github pages](https://docs.github.com/en/pages){: .text-primary target="_blank"} for it. If your site shoud be multilangual, setup the multilanguage configuration (repository branches and settings), ensure that the the translation files are in their location(`assets/locales`) and all translations are complete. Run manually one of the deployment actions. 

{% include elements/alert.html class="warning" content="If you use the advanced Python based features, our strong recommendation is to build locally, commit to Github and use the `(NO-PY) Manual Deploy Multilingual Jekyll site to Pages` deployment action. Otherwise the deployment can take long time which may consume quite a lot of your Github build minutes." %}