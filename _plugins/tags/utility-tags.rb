require_relative "../../tools/modules/globals"

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

    end

end
  
Liquid::Template.register_tag('UUID', Jekyll::Utilities::UUID)
