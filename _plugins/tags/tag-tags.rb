require 'json'

module Jekyll

    module Tags
        class TagList < Liquid::Tag
  
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
                context.registers[:site].data["tag_list"]
            end
        end

        class TagDetails < Liquid::Tag

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
                context.registers[:site].data["tags_details"]
            end
        end

    end
end
  
Liquid::Template.register_tag('TagList', Jekyll::Tags::TagList)
Liquid::Template.register_tag('TagDetails', Jekyll::Tags::TagDetails)
  
