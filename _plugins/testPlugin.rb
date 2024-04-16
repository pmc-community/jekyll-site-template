require 'dotenv'
require_relative '../tools/modules/globals'
require_relative 'modules/testModule'

Dotenv.load


module Jekyll
  
    module Tags
      class CopyrightTag < Liquid::Tag
  
        def initialize(tag_name, text, context)
          super
        end
        def render(context)
          "#{ENV["TEST_VAL"]} &copy; #{Time.now.year} * #{TestModule.getValue()}"
        end
      end
    end
  end
  
  Liquid::Template.register_tag('copyright', Jekyll::Tags::CopyrightTag)
  