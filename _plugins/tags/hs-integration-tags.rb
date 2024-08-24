require 'dotenv'

Dotenv.load

module Jekyll

    module HSIntegration
        class HSPortalID < Liquid::Tag
  
            def initialize(tag_name, input, context)
                super
                @input = input
            end

            def render(context)
                context.registers[:site].data["siteConfig"]["hsIntegration"]["enabled"]
                if (context.registers[:site].data["siteConfig"]["hsIntegration"]["enabled"])
                    portalID = ENV["HS_PORTAL_ID"]                      
                else
                    portalID = ""
                end
                portalID 
            end
        end



    end
end
  
Liquid::Template.register_tag('HSPortalID', Jekyll::HSIntegration::HSPortalID)
  