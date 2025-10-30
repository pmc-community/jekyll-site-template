---
layout: page
title: Build and test
permalink: /go-live/build/
categories: [Start, Go live]
tags: [appearance, build, test, deploy]
parent: Go live
nav_order: 2
---

# Summary
Building and testing the site means go generate the site, running the automatic testing and the spell checking. Following the site build and tests results, corrections may be needed. When everything is fine, is time to serve the site locally and test its appearance and functionality. 

# Build

{% include elements/alert.html 
  class="warning" 
  content="The best practice is to build the site in the development environment and only after that, to deploy it in the production environment. It is not recommended to build directly in the production environment, mostly when this environment is hosted by Github pages or Netlify or similar (build time can be long and can consume CI/CD minutes for tasks that are not necessary to be executed in production environment)."
  title="Building site" 
%}

Docaroo provides a ready-made script for building and running automatic tests on the development environment. This script is optimised for MacOS and Linux and can be started with `./build` command. In a similar way, on Windows machines, `build.bat` can be used. 

To build the site:
1. open a terminal window
2. navigate to the root directory of the site
3. run `./build` (or `build.bat` on Windows)

The build command will execute three main sections as shown next:

{% capture moments %}
    text=Check|sec=12,
    text=Generate|sec=35.8,
    text=Spelling|sec=37.2
{% endcapture %}

{% include elements/youtube.html 
    id="5KjcT6kfzFs" 
    width="640" 
    height="360"
    moments=moments
%}

# Auto tests
First section executed by the build command is running some automatic testing on the site. These tests are at least:
- Checking the consistency of `permalinks`. The permalinks must be exactly in the format `/.../.../.../`, observe that permalinks must start and end with `/`. This test also detects potential permalink duplicates.
- Checking `include` tags. Since the site is based on Jekyll and Liquid, `include` tags can be used for including content from different site source files. The source files may become unavailable as certain moment (mostly for sites where the content is created in a collaborative way). This test will check the availability of sources for `include` tags.
- Checking `internal links`. This test detects the `broken links` to other documents/pages of the site.
- Checking `external links`. This test detects the `broken links` to external sites.
- Checking `external content`. This test detects the unavailability of external content imported at `run time`. For the content imported at `build time` it is not necessary to have a dedicated test since the potential import errors will be visible directly on the resulted document.

Running automatic tests will show the results on screen while building the site and will also save them inside the `tools/checks` folder.

{% DirStructure tools/checks %}

{% include elements/alert.html 
  class="primary" 
  content="To see more details about how automatic test behave during the build process, click on the `Check` moment of the build process video."
  title="Auto tests" 
%}

# Generate
The second section executed by the build command is to generate the static assets (the documents/pages of the site). In essence, this is Jekyll build command, please consult [Jekyll documentation](https://jekyllrb.com){: target="_blank"} to understand more about how the site assets are generated.

{% include elements/alert.html 
  class="primary" 
  content="To see more details about how assets generation looks like during the build process, click on the `Generate` moment of the build process video."
  title="Generate" 
%}

To minimise the build time, the asset generation process is incremental, only the modified content since last build will be processed.

{% include elements/alert.html 
  class="primary" 
  content="If you need to force full build, simply remove `doc-raw-contents` directory and build the site. Use with care as full build may be longer when all features (automatic keyword generation, auto summary, related pages, similar pages) are enabled."
  title="✳️ Tip" 
%}

{% include elements/alert.html 
  class="primary" 
  content="If you need to force generating a page even if its content was not modified, locate the related raw content file inside `doc-raw-contents` directory, remove it and build the site. Each site page/document has a related raw content file inside `doc-raw-contents` directory, named exactly as the page/document permalink, but having `/` replaced by `_`."
  title="✳️ Tip" 
%}

{% include elements/alert.html 
  class="warning" 
  content="When removing a page/document and building the site, it may be possible to get build errors because its related raw content is still present. Locate the related raw content file inside `doc-raw-contents` directory and remove it before building the site."
  title="Removing pages" 
%}

# Spelling
The last section executed by the build command is to check the spelling, since it is expected that such sites contains mostly text content, thus being subject of spelling errors. The spelling is only flagging the potential errors, it does not suggest corrections. Spelling will show the brief results on screen while building the site and will also save detailed information them inside the `tools/checks/misspelled_words.txt` file.

{% include elements/alert.html 
  class="primary" 
  content="To see more details about how spelling results looks like during the build process, click on the `Spelling` moment of the build process video."
  title="Spelling" 
%}

Spell checking at build time can be enabled/disabled by setting the related `spellCheck` value to `true/false` in `_data/buildConfig.yml`.

# Dictionaries

{% include elements/alert.html 
  class="warning" 
  content="Be aware that spelling is based on frequency dictionaries for the site languages. Also take into consideration that, sometimes, the dictionaries are not 100% updated, thus, to maintain a good performance for the spelling checks you may need to maintain them."
  title="Dictionaries" 
%}

There are various sources for frequency dictionaries available for download and free usage. Feel free to choose the best option for your site as long as it respects the required format which is to have one word and its frequency, separated by space, on a single line. A potential source for dictionaries is [here](https://github.com/hermitdave/FrequencyWords){: target="_blank"}.

# Installing dictionaries
The spell check feature is built around a Python package, `symspellpy`. To install a new language dictionary do:
1. download the dictionary from an external source
2. locate `symspellpy` directory on the machine where the development environment is
3. copy the dictionary in the `symspellpy` directory
4. edit `tools_py/spell-check/spell-check.py`, locate the code shown below and add the reference to the new dictionary, following the model
5. build and test the site

{% include elements/alert.html 
  class="primary" 
  content="The site is coming by default with the English dictionary. If you have trouble locating the `symspellpy` directory, search for the English dictionary file, usually `frequency_dictionary_en_82_765.txt`. However, the exact name of the default English frequency dictionary file is shown in the `tools_py/spell-check/spell-check.py` script."
  title="✳️ Tip" 
%}

```python
{% 
    ExternalRepoContent  { 
        "markdown": true,
        "owner":"pmc-community", 
        "repo":"jekyll-site-template", 
        "branch":"gh-pages", 
        "file_path":"tools_py/spell-check/spell-check.py", 
        "ignore_wp_shortcodes": true, 
        "start_marker": "SUPPORTED_LANGS",
        "include_start_marker": true,
        "end_marker": "}" ,
        "include_end_marker": true,
        "needAuth": true
    }
%}
```

{% include elements/alert.html 
  class="warning" 
  content="Be aware that it is needed to use the 2 digits language ISO code as it is detected by the `langdetect` Python package."
  title="Language code" 
%}

# Maintaining dictionaries
Installing and using frequency dictionaries from external sources does not guarantee that the highest quality spell check is guaranteed. Allmost in any cases, the dictionaries may not contain specific domain words (such as tech words) and, for sure, does not contain words in other languages (such as Latin) in the case when the content is mixing languages. These situations will lead to false positive misspellings reported by the spell checking. There is no problem to ignore these false positive misspellings. 

However, in some situations (mostly when many false positives misspellings are detected), will be visually dificult to identify the real misspellings which are mixed with the false positive ones. For this reason, it is recommended to maintain a list of words that should be ignored and not reported as false positive misspellings. This can be achieved by maintaining the `dict-ignore-....txt` files inside `assets/locales` directory. The site has one `dict-ignore-<lang_code>.txt` file per each language and one `dict-ignore-global.txt` file as next shown.

{% DirStructure assets/locales %}

The `dict-ignore-....txt` files have a very simple structure, one word per line, no nore than that. The recommended usage is very logical, if (for example) you use words from Latin laguage in all your content regardless of the content language, then add those words to `dict-ignore-global.txt`. If you use specific english tech words or is you use specific English abbreviations, then add those to `dict-ignore-en.txt`.

# Test
Docaroo provides a ready-made script for serving the site in the development environment. This script is optimised for MacOS and Linux and can be started with `./serve` command. In a similar way, on Windows machines, `serve.bat` can be used. In essence, this script is building the site (but without automatic tests) and serving it on the machine where the site is built, the site being accessible from the local network as `https://<dev-machine-IP-or-URL>:4000`. Please consult [Jekyll documentation](https://jekyllrb.com){: target="_blank"} to understand more about how the site is served in the development environment.