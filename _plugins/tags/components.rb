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
                sheet = ""
                source = ""
                file, range, sheet, source = rendered_params
                script_path = File.expand_path("tools_py/xlsx-to-html-table/xlsx-to-html-table.py", Dir.pwd)
                sourceDir = Globals.extract_directory_from_path(source)
               
                filePath = sourceDir.include?(Globals::DOCS_ROOT) ?
                    "#{sourceDir}/#{file}" : 
                    "#{Globals::DOCS_ROOT}/#{sourceDir}/#{file}" 

                file_full_path = sourceDir.include?(Globals::DOCS_ROOT) ? 
                    filePath :
                    File.expand_path(filePath, Dir.pwd)
                cmd = "#{script_path} #{Shellwords.escape(file_full_path)} #{Shellwords.escape(range)} #{Shellwords.escape(sheet)}"
                tableOutput = IO.popen(cmd, "r", &:read)
                tableOutput
                
            end

        end

        class XLSXToHtmlChart < Liquid::Tag
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
                sheet = ""
                chart = ""
                source = ""
                file, sheet, chart, source = rendered_params
                script_path = File.expand_path("tools_py/xlsx-to-html-chart/xlsx-to-html-chart.py", Dir.pwd)
                sourceDir = Globals.extract_directory_from_path(source)
               
                filePath = sourceDir.include?(Globals::DOCS_ROOT) ?
                    "#{sourceDir}/#{file}" : 
                    "#{Globals::DOCS_ROOT}/#{sourceDir}/#{file}" 

                file_full_path = sourceDir.include?(Globals::DOCS_ROOT) ? 
                    filePath :
                    File.expand_path(filePath, Dir.pwd)
                cmd = "#{script_path} #{Shellwords.escape(file_full_path)} #{Shellwords.escape(sheet)} #{Shellwords.escape(chart)}"
                chartOutput = IO.popen(cmd, "r", &:read)
                chartOutput
                
            end

        end

        class ImgFullPath < Liquid::Tag
  
            def initialize(tag_name, input, context)
                super
                @input = input
            end

            def render(context)
                param = Liquid::Template.parse(@input).render(context)
                fullPath = "/#{Globals::DOCS_ROOT}/#{param.strip}"
                fullPath
            end
            
        end


    end

end
  
Liquid::Template.register_tag('ScrollSpy', Jekyll::Components::ScrollSpy)
Liquid::Template.register_tag('XLSXToHtmlTable', Jekyll::Components::XLSXToHtmlTable)
Liquid::Template.register_tag('XLSXToHtmlChart', Jekyll::Components::XLSXToHtmlChart)
Liquid::Template.register_tag('ImgFullPath', Jekyll::Components::ImgFullPath)


