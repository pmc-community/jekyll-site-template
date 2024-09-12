require_relative "../../tools/modules/globals"

module Jekyll
    
    module JSONStringToObject
        def json_string_to_object(input)
            begin
                JSON.parse(input) if input
            rescue
                Globals.putsColText(Globals::YELLOW, "#{input} string is not a valid JSON\n")
            end
        end
    end

end
  
Liquid::Template.register_filter(Jekyll::JSONStringToObject)