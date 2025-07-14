require_relative "../../tools/modules/globals"
require_relative "../../tools/modules/file-utilities"

Dotenv.load

module Jekyll

    module Utilities

        class UUID < Liquid::Tag
  
            def initialize(tag_name, input, context)
                super
                @input = input
            end

            def render(context)
                Globals.uuid_gen()
            end
        end

        class DirStructure < Liquid::Tag
  
            def initialize(tag_name, input, context)
                super
                @input = input
            end

            def render(context)
                param = Liquid::Template.parse(@input).render(context)
                structure = FileUtilities.generate_folder_structure("#{Dir.pwd}/#{param.strip}/")
                structure
            end
            
        end

    end

end
  
Liquid::Template.register_tag('UUID', Jekyll::Utilities::UUID)
Liquid::Template.register_tag('DirStructure', Jekyll::Utilities::DirStructure)
