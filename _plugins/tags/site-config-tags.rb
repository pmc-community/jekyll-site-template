
require_relative "../../tools/modules/globals"
require_relative "../../tools/modules/file-utilities"
require 'dotenv'

Dotenv.load

module Jekyll

    module SiteConfigSettings

        class SiteLanguage < Liquid::Tag
  
            def initialize(tag_name, input, context)
                super
                @input = input
            end

            def render(context)
                langSettings = context.registers[:site].data["siteConfig"]["multilang"]
                siteLang = ""
                if (ENV["JEKYLL_ENV"] != "production" ) # JEKYLL_ENV is set by the GitHub deployment action (deploy-site-multilang.yml from gh-pages branch). On local is not set
                    siteLang = ""                     
                else
                    if (langSettings["siteLanguage"] == 0)
                        siteLang = ""
                    else
                        siteLang = langSettings["availableLang"][langSettings["siteLanguage"]]["lang"]
                    end      
                end
                env = ENV["JEKYLL_ENV"]
                sl = langSettings["siteLanguage"]
                #"l: #{siteLang} / e: #{env}/ lc: #{sl}"
                siteLang
            end
        end


        class SiteLanguageForSearch < Liquid::Tag

            def initialize(tag_name, input, context)
                super
                @input = input
            end

            def render(context)
                langSettings = context.registers[:site].data["siteConfig"]["multilang"]
                siteLang = langSettings["availableLang"][langSettings["siteLanguage"]]["lang"]
                siteLang
            end

        end

        class SiteLanguagesExceptActiveLanguage < Liquid::Tag

            def initialize(tag_name, input, context)
                super
                @input = input
            end

            def render(context)
                langSettings = context.registers[:site].data["siteConfig"]["multilang"]
                siteLang = langSettings["availableLang"][langSettings["siteLanguage"]]["lang"]
                allLanguages = langSettings["availableLang"]
                filtered = allLanguages.reject { |item| item["lang"] == siteLang }
                noTranslation = []
                
                filtered.each do |language|
                    if (FileUtilities.file_exists?("assets/locales/#{language["lang"]}.json", Globals::ROOT_DIR))
                        noTranslation << language["lang"]
                    end
                end

                result = filtered.reject { |item| !noTranslation.include?(item["lang"]) }
                result
            end
            
        end

        class SiteDefaultLanguageCode < Liquid::Tag

            def initialize(tag_name, input, context)
                super
                @input = input
            end

            def render(context)
                langSettings = context.registers[:site].data["siteConfig"]["multilang"]
                availableLang = langSettings["availableLang"]
                defaultLanguage = langSettings["fallbackLang"]
                defaultLanguageCode = availableLang[defaultLanguage]["lang"]
                defaultLanguageCode
            end

        end

    end
end
  
Liquid::Template.register_tag('SiteLanguage', Jekyll::SiteConfigSettings::SiteLanguage)
Liquid::Template.register_tag('SiteLanguageForSearch', Jekyll::SiteConfigSettings::SiteLanguageForSearch)
Liquid::Template.register_tag('SiteLanguagesExceptActiveLanguage', Jekyll::SiteConfigSettings::SiteLanguagesExceptActiveLanguage)
Liquid::Template.register_tag('SiteDefaultLanguageCode', Jekyll::SiteConfigSettings::SiteDefaultLanguageCode)