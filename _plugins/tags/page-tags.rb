require 'json'

module Jekyll

    module SitePages
        class SitePages < Liquid::Tag
  
            def initialize(tag_name, input, context)
                super
                @input = input
            end

            def render(context)
                begin
                    if( !@input.nil? && !@input.empty? )
                        info = JSON.parse(@input)
                    end
                    rescue
                end
                context.registers[:site].data["page_list"]
            end
        end
    end
end
  
Liquid::Template.register_tag('SitePages', Jekyll::SitePages::SitePages)
  
