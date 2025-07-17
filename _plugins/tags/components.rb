require_relative "../../tools/modules/globals"
require_relative "../../tools/modules/content-utilities"

Dotenv.load

module Jekyll

    module Components

        class ScrollSpy < Liquid::Tag
  
            def initialize(tag_name, input, context)
                super
                @input = input
            end

            def render(context)
                param = Liquid::Template.parse(@input).render(context)
                scrollSpy = ContentUtilities.getScrollSpy("#{Dir.pwd}/#{Globals::DOCS_ROOT}/#{param.strip}/")
                
            end
            
        end

    end

end
  
Liquid::Template.register_tag('ScrollSpy', Jekyll::Components::ScrollSpy)
