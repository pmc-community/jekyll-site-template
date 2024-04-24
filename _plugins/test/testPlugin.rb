require 'dotenv'
require 'json'
require_relative '../../tools/modules/globals'
require_relative '../modules/testModule'

Dotenv.load


module Jekyll
  
    module TestPlugin
      class TestCustomTag < Liquid::Tag
  
        def initialize(tag_name, input, context)
          super
          @input = input
        end

        def render(context)
          
          param1 = ""
          param2 = ""
          begin
            if( !@input.nil? && !@input.empty? )
              jdata = JSON.parse(@input)
              if( jdata.key?("param1") )
                param1 = jdata["param1"].strip
              end
              if( jdata.key?("param2") )
                param2 = jdata["param2"].strip
              end
            end
            rescue
          end
  
          "#{ENV["TEST_VAL"]} &copy; #{Time.now.year} #{Globals::DOCS_DIR} * #{Dir.pwd} * #{TestModule.getValue()} * #{param1} * #{param2}"
        end
      end
    end
  end
  
  Liquid::Template.register_tag('customTag', Jekyll::TestPlugin::TestCustomTag)
  