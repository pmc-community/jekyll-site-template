---
# Feel free to add content and custom Front Matter to this file.
layout: home
badgeWithText: '[![](https://img.shields.io/badge/Delivery-As%20A%20Service-ff6200?style=for-the-badge&logo=react)](#)'
---
 
<div id="content_container" class="container-fluid">

    <!-- content -->
    <div id="content" class="container-fluid p-3 d-flex justify-content-center">

        <!-- 3 col row -->
        <div class="row m-5 px-5 d-flex justify-content-start">

            <!-- custom HTML content -->
            <div id = "react-plugin-template" class="card h-auto col-5 shadow m-2 p-3  bg-body rounded bg-transparent">
                <div class="h-100 align-top mb-2">
                    <h2 class="text-center">React Plugin Template</h2>
                    {% capture markdown_content %} {{ site.siteVars.siteTestBadge }}  {% endcapture %} {{ site.siteVars.siteTestBadge | markdownify }}
                </div>
                <div class="h-100 align-top">
                    <p class="align-middle px-4 py-2 mt-auto card border-0 bg-transparent">This template contains what is needed to develop complex Figma plugins, based on React. Full support for mult-pages and multi-component. It is not a react app, it allows to embedd react components anywhere in the plugin pages. It also has full support for React Redux, including the whole boilerplate code. In short, you can build very complex things without being concerned about the framework and being focused on what you want to achieve.</p>
                    <a href="/intro" class="btn btn-success">Documentation</a>
                </div>
            </div>

            <!-- custom HTML content -->
            <div id = "figma-to-hs-plugin" class="card h-auto col-5 shadow m-2 p-3  bg-body rounded bg-transparent">
                <div class="h-100 align-top mb-2">
                    <h2 class="text-center">Figma-To-HubSpot</h2>
                </div>
                <div class="h-100 align-top">
                    <p class="align-middle px-4 py-2 mt-auto card bg-transparent border-0">We like Figma and we are experts in HubSpot. We also develop very complex sites on HubSpot CMS so, it was a natural thing to try to make our life easier ... and to connect Figma design with HubSpot CMS for sending assets and (as much as possible, to generate pages). We work on a Figma plugin to do the job ... still work in progress. However, when will be ready, we will share it. Meanwhile you can check what we can do in HubSpot.</p>
                    <a href="//hub.innohub.space" target=_blank class="btn btn-danger">Check this out</a>
                </div>
            </div>

            <!-- custom HTML content -->
            <div id = "simple-plugin-template" class="card h-auto col-5 shadow m-2 p-3  bg-body rounded bg-transparent">
                <div class="h-auto align-top mb-2">
                    <h2 class="text-center">Simple Plugin Template</h2>
                </div>
                <div class="h-100 align-top">
                    <p class="align-middle px-4 py-2 mt-auto card bg-transparent border-0">This is a template for a simple Figma plugin with multi page support. Webpack 5 support is included to allow bundling the modules. jQuery is included, so you are free to write and split the code as you whish. It has Bootstrap5 support, but any css library can be used.</p>
                    <a href="/intro" class="btn btn-warning">Check this out</a>
                </div>
            </div>

        </div>

    </div>

</div>

