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
                if (ENV["DEPLOY_ENV"] != "production"  )
                    siteLang = ""                     
                else
                    if (langSettings["siteLanguage"] == 0)
                        siteLang = ""
                    else
                        siteLang = langSettings["availableLang"][langSettings["siteLanguage"]]["lang"]
                    end      
                end
                env = {ENV["DEPLOY_ENV"]}
                sl = langSettings["siteLanguage"]
                "l: #{siteLang} / e: #{env}/ lc: #{sl}"
            end
        end

    end
end
  
Liquid::Template.register_tag('SiteLanguage', Jekyll::SiteConfigSettings::SiteLanguage)