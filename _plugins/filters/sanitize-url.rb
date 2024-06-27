require_relative "../../tools/modules/globals"
require 'uri'

module Jekyll
    
    module SanitizeURL
        def sanitize_url(input)
            begin
                uri = URI(input)
                uri.to_s
            rescue
                Globals.putsColText(Globals::YELLOW, "#{input} string is not a valid URL\n")
            end
        end
    end

end
  
Liquid::Template.register_filter(Jekyll::SanitizeURL)