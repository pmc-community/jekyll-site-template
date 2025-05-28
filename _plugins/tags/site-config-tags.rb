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

    end
end
  
Liquid::Template.register_tag('SiteLanguage', Jekyll::SiteConfigSettings::SiteLanguage)