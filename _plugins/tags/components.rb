require_relative "../../tools/modules/globals"
require_relative "../../tools/modules/content-utilities"

require "shellwords"
require 'uri'

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
                scrollSpy
            end
            
        end

        class XLSXToHtmlTable < Liquid::Tag
            def initialize(tag_name, input, context)
                super
                @input = input.strip
                @params =  @input.scan(/"([^"]+)"/).flatten
            end

            def render(context)
                rendered_params = @params.map do |p|
                    Liquid::Template.parse(p).render(context)
                end

                file = ""
                range = ""
                shhet = ""
                source = ""
                file, range, sheet, source = rendered_params
                #puts "File: #{file}, Range: #{range}, Sheet: #{sheet}, Source:#{source}"
                #Dir.pwd
                script_path = File.expand_path("tools_py/xlsx-to-html-table/xlsx-to-html-table.py", Dir.pwd)
                sourceDir = Globals.extract_directory_from_path(source)
               
                #puts "source: #{source}"
                #puts "sourceDir: #{sourceDir}"
                #puts "\n"

                filePath = sourceDir.include?(Globals::DOCS_ROOT) ?
                    "#{sourceDir}/#{file}" : 
                    "#{Globals::DOCS_ROOT}/#{sourceDir}/#{file}" 

                file_full_path = sourceDir.include?(Globals::DOCS_ROOT) ? 
                    filePath :
                    File.expand_path(filePath, Dir.pwd)
                    
                #puts "filePath: #{filePath}"
                #puts "file_full_path: #{file_full_path}"
                #puts "\n"
                
                #puts "file: #{file_full_path}"
                cmd = "#{script_path} #{Shellwords.escape(file_full_path)} #{Shellwords.escape(range)} #{Shellwords.escape(sheet)}"
                tableOutput = IO.popen(cmd, "r", &:read)
                #puts tableOutput
                tableOutput
                
            end

        end

    end

end
  
Liquid::Template.register_tag('ScrollSpy', Jekyll::Components::ScrollSpy)
Liquid::Template.register_tag('XLSXToHtmlTable', Jekyll::Components::XLSXToHtmlTable)
