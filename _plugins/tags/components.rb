require_relative "../../tools/modules/globals"
require_relative "../../tools/modules/content-utilities"
require_relative "../../tools/modules/file-utilities"

require "shellwords"
require 'uri'
require "psych"

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
                inputPath = param.strip
                inputPath = "/#{param}"
                inputPath = inputPath.gsub("//", "/")

                if inputPath.downcase.start_with?("/partials")
                    fullPath = "/#{Globals::DOCS_ROOT}/#{inputPath.strip}"
                else
                    fullPath = inputPath
                end

                site = context.registers[:site] 

                fullPath = fullPath.gsub("//", "/").strip        
                fullPath = Globals.remove_leading_underscore_from_path_if_collection(fullPath, site)

                fullPath
            end
            
        end

        class CardGalleryContent < Liquid::Tag
  
            def initialize(tag_name, input, context)
                super
                @input = input
            end

            def render(context)
                param = Liquid::Template.parse(@input).render(context)
                fullPath = "/#{Globals::DOCS_ROOT}/#{param.strip}"
                cards=[]
                Dir.glob(File.join(Dir.pwd + fullPath, "**", "*.md")).each do |file|
                    front_matter, buttons = FileUtilities.parse_front_matter(File.read(file))
                    cardObj = {
                        img: front_matter["img"],
                        title: front_matter["cardTitle"],
                        file: front_matter["file"],
                        buttons: buttons
                    }
                    cards << cardObj
                end
                JSON.generate(cards)
            end
            
        end

        class ExtPDFSummary < Liquid::Tag
            def initialize(tag_name, input, tokens)
                super
                @template_variable = Liquid::Template.parse("{{" + input + "}}")
            end

            def render(context)
                param = @template_variable.render(context)
                param = param.gsub("{{", "")
                param = param.gsub("}}", "")
                param = param.strip

                fullPath = File.join(Globals::DOCS_ROOT, param)
                script_path = File.expand_path("tools_py/ext-doc-summary/pdf-summary.py", Dir.pwd)

                filename_no_ext = File.basename(fullPath, File.extname(fullPath))
                dir_path = File.dirname(fullPath)
                sum_file = "#{dir_path}/#{filename_no_ext}__pdf_summary.txt"
                
                if !File.exist?(File.expand_path(sum_file, Dir.pwd))
                    # Run the script safely without shell, passing arguments as separate params
                    system("python3", script_path, fullPath)
                end

                #"fp: #{fullPath}  fn: #{sum_file} full: #{File.expand_path(sum_file, Dir.pwd)}"
                front_matter, content = FileUtilities.parse_front_matter(File.read(sum_file))
                content
            end
        end

        class ExtPDFImg < Liquid::Tag
            def initialize(tag_name, input, tokens)
                super
                @template_variable = Liquid::Template.parse("{{" + input + "}}")
            end

            def render(context)
                param = @template_variable.render(context)
                param = param.gsub("{{", "")
                param = param.gsub("}}", "")
                param = param.strip

                fullPath = File.join(Globals::DOCS_ROOT, param)
                script_path = File.expand_path("tools_py/ext-doc-summary/pdf-to-img.py", Dir.pwd)

                filename_no_ext = File.basename(fullPath, File.extname(fullPath))
                dir_path = File.dirname(fullPath)
                img_file = "#{dir_path}/#{filename_no_ext}__pdf_firstpage.png"
                
                if !File.exist?(File.expand_path(img_file, Dir.pwd))
                    # Run the script safely without shell, passing arguments as separate params
                    system("python3", script_path, fullPath)
                end
                img_file = img_file.gsub(Globals::DOCS_ROOT,"")
                img_file = img_file.sub(%r{^/}, "")
                img_file.strip
                site = context.registers[:site] 
                img_file = Globals.remove_leading_underscore_from_path_if_collection(img_file, site)

                img_file
            end
        end

        class ExtDOCXSummary < Liquid::Tag
            def initialize(tag_name, input, tokens)
                super
                @template_variable = Liquid::Template.parse("{{" + input + "}}")
            end

            def render(context)
                param = @template_variable.render(context)
                param = param.gsub("{{", "")
                param = param.gsub("}}", "")
                param = param.strip

                fullPath = File.join(Globals::DOCS_ROOT, param)
                script_path = File.expand_path("tools_py/ext-doc-summary/word-summary.py", Dir.pwd)

                filename_no_ext = File.basename(fullPath, File.extname(fullPath))
                dir_path = File.dirname(fullPath)
                sum_file = "#{dir_path}/#{filename_no_ext}__word_summary.txt"
                
                if !File.exist?(File.expand_path(sum_file, Dir.pwd))
                    # Run the script safely without shell, passing arguments as separate params
                    system("python3", script_path, fullPath)
                end

                #"fp: #{fullPath}  fn: #{sum_file} full: #{File.expand_path(sum_file, Dir.pwd)}"
                front_matter, content = FileUtilities.parse_front_matter(File.read(sum_file))
                content
            end
        end

        class ExtDOCXImg < Liquid::Tag
            def initialize(tag_name, input, tokens)
                super
                @template_variable = Liquid::Template.parse("{{" + input + "}}")
            end

            def render(context)
                param = @template_variable.render(context)
                param = param.gsub("{{", "")
                param = param.gsub("}}", "")
                param = param.strip

                fullPath = File.join(Globals::DOCS_ROOT, param)
                script_path = File.expand_path("tools_py/ext-doc-summary/word-to-img.py", Dir.pwd)

                filename_no_ext = File.basename(fullPath, File.extname(fullPath))
                dir_path = File.dirname(fullPath)
                img_file = "#{dir_path}/#{filename_no_ext}__word_firstpage.png"
                
                if !File.exist?(File.expand_path(img_file, Dir.pwd))
                    # Run the script safely without shell, passing arguments as separate params
                    system("python3", script_path, fullPath)
                end
                img_file = img_file.gsub(Globals::DOCS_ROOT,"")
                img_file = img_file.sub(%r{^/}, "")
                img_file.strip
                site = context.registers[:site] 
                img_file = Globals.remove_leading_underscore_from_path_if_collection(img_file, site)

                img_file
            end
        end

    end

end
  
Liquid::Template.register_tag('ScrollSpy', Jekyll::Components::ScrollSpy)
Liquid::Template.register_tag('XLSXToHtmlTable', Jekyll::Components::XLSXToHtmlTable)
Liquid::Template.register_tag('XLSXToHtmlChart', Jekyll::Components::XLSXToHtmlChart)
Liquid::Template.register_tag('ImgFullPath', Jekyll::Components::ImgFullPath)
Liquid::Template.register_tag('CardGalleryContent', Jekyll::Components::CardGalleryContent)
Liquid::Template.register_tag('ExtPDFSummary', Jekyll::Components::ExtPDFSummary)
Liquid::Template.register_tag('ExtPDFImg', Jekyll::Components::ExtPDFImg)
Liquid::Template.register_tag('ExtDOCXSummary', Jekyll::Components::ExtDOCXSummary)
Liquid::Template.register_tag('ExtDOCXImg', Jekyll::Components::ExtDOCXImg)


