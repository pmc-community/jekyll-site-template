require 'yaml'

module PageConfigUtilities

    def self.getPermalinks(docsFolder)
        permalinks = []
        Find.find(docsFolder) do |file|
        next unless file =~ /\.html$|\.md$/ # Only process .html or .md files
            contents = File.read(file)
            permalink = contents[/permalink: (.*)/, 1]
            permalinks << permalink
        end
        return permalinks
    end

    def self.getPageConfigPermalinks(pagConfigFile)
        return YAML.safe_load(File.read(pagConfigFile)).keys
    end

    def self.checkPageConfigPermalinks (docsDir, pageConfigFile, sitePermalinks, pageConfigPermalinks, silent)
        pageConfigErrors = 0
        
        pageConfigPermalinks.each do |permalink|
            puts "checking #{permalink}" if !silent
            if (!sitePermalinks.include?(permalink))
                pageConfigErrors += 1
                result = "Permalink \"#{permalink}\" from #{pageConfigFile} not found in site permalinks"
                Globals.putsColText(Globals::YELLOW, " - #{result}") if !silent
                FileUtilities.write_file("#{Globals::ROOT_DIR}/tools/checks/page-config.log", "#{result}\n")
                permalinkNoSlashes = Globals.removeFirstAndLastSlash(permalink)
                sitePermalinksNoSlashes = Globals.removeSlashesFromArrayElements(sitePermalinks)
                if (!sitePermalinksNoSlashes.include?(permalinkNoSlashes))
                    result = "Permalink \"#{permalink}\" #{Globals::ARROW_RIGHT} no possible matches"
                    FileUtilities.write_file("#{Globals::ROOT_DIR}/tools/checks/page-config.log", "#{result}\n")
                    Globals.putsColText(Globals::YELLOW, " - #{result}") if !silent
                else
                    variants = sitePermalinks.compact.select { |element| element.include?(permalinkNoSlashes) }
                    variantOptions = {}
                    variants.compact.each do |variant|
                        variantOptions[variant] = FileUtilities.getFileFromPermalink(docsDir, variant)
                    end
                    result = "Permalink \"#{permalink}\" #{Globals::ARROW_RIGHT} Possible match: #{variantOptions}"
                    FileUtilities.write_file("#{Globals::ROOT_DIR}/tools/checks/page-config.log", "#{result}\n")
                    Globals.putsColText(Globals::YELLOW, " - #{result}") if !silent
                end
            else
                print (Globals::BACK_1_ROW) if !silent
                puts "checking #{permalink} #{Globals::ARROW_RIGHT} file: #{FileUtilities.getFileFromPermalink(docsDir, permalink)}" if !silent
            end
        end
        puts "\nPages on site: #{sitePermalinks.length}" if !silent
        puts "Pages configured: #{pageConfigPermalinks.length}" if !silent
        puts "Config errors: #{pageConfigErrors}" if !silent
        correctPageConfiguration = pageConfigPermalinks.length > pageConfigErrors ? pageConfigPermalinks.length - pageConfigErrors : 0
        puts "Correct page configurations: #{correctPageConfiguration}" if !silent
        if (pageConfigErrors > 0)
            summary = "SUMMARY: Pages on site: #{sitePermalinks.length} / Pages configured: #{pageConfigPermalinks.length} / Config errors: #{pageConfigErrors}"
            FileUtilities.write_file("#{Globals::ROOT_DIR}/tools/checks/page-config.log", "#{summary}\n")
        end
        return pageConfigErrors
    end
end