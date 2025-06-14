# generating sitemap.xml which is useful for SEO and Algolia search
# should be :site and :after-init to be triggered only once per build/serve.
# otherwise may lead to a endless loop when building/serving the site

require 'yaml'
require "json"
require_relative "../../tools/modules/globals"
require_relative "../../tools/modules/file-utilities"
require 'dotenv'

Dotenv.load

Jekyll::Hooks.register :site, :after_init do |site|
    # need to read the _data/buildConfig.yml because site vars are not ready at this moment
    content = File.open("_data/buildConfig.yml","" "rb", &:read).encode('UTF-8', invalid: :replace, undef: :replace)
    buildConfig = YAML.load(content);
    if (buildConfig["faq"]["enabled"])
        Globals.putsColText(Globals::PURPLE,"Generating FAQ page ...")

        faqDir = "#{Globals::DOCS_DIR}/_faq/"
        if !Dir.exist?(faqDir)
            Globals.moveUpOneLine
            Globals.clearLine
            Globals.putsColText(Globals::PURPLE,"Generating FAQ page ... failed! Did not find faq folder.")
        else
            
            faq_contents = Dir.glob("#{faqDir}**/*.md")
            numFaq = 0;
            faq_contents.each do |file_path|
                #content = File.read(file_path)
                content.force_encoding('UTF-8').encode!('UTF-8', invalid: :replace, undef: :replace)
                front_matter, content = FileUtilities.parse_front_matter(File.read(file_path))
                next if !front_matter
                next if !content
                next if !front_matter["q"]
                numFaq +=1
            end

            if (numFaq > 0 )
                content = File.open("_data/siteConfig.yml","" "rb", &:read).encode('UTF-8', invalid: :replace, undef: :replace)
                siteConfig = YAML.load(content);
                siteLanguageId = siteConfig["multilang"]["siteLanguage"]
                siteLanguageCode = siteConfig["multilang"]["availableLang"][siteLanguageId]["lang"]
                faqTitle = "FAQ"
                faqExcerpt = "Frequently asked questions"
                langFilePath = "assets/locales/#{siteLanguageCode}.json"
                if (File.exist?(langFilePath))
                    translations = File.read(langFilePath)
                    begin
                        translationsObj = JSON.parse(translations)
                        faqTitle = translationsObj["faq_menu_item_text"]
                        faqExcerpt = translationsObj["faq_page_excerpt"]
                    rescue
                        faqTitle = "FAQ"
                        faqExcerpt = "Frequently asked questions"
                    end
                end
                faqPageContent = "---\nlayout: faq\npermalink: /faq\ntitle: #{faqTitle}\nnav_order: 1\nexcerpt: #{faqExcerpt}\n---"
                faqPageFilePath = "#{Globals::DOCS_DIR}/_tools/faq.md"
                FileUtilities.overwrite_file(faqPageFilePath, faqPageContent)
                Globals.moveUpOneLine
                Globals.clearLine
                Globals.putsColText(Globals::PURPLE,"Generating FAQ page ... done (#{numFaq} questions)")
            else
                Globals.moveUpOneLine
                Globals.clearLine
                Globals.putsColText(Globals::PURPLE,"Generating FAQ page ... skipped (no questions found)")
            end
        end
        
    else
        faqPageFilePath = "#{Globals::DOCS_DIR}/_tools/faq.md"
        File.delete(faqPageFilePath)
        Globals.putsColText(Globals::PURPLE,"FAQ not active for this site, skipping ...")
    end
end

