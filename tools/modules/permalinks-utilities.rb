require_relative 'globals'
require_relative 'file-utilities'

module PermalinksUtilities

    def self.getPermalinks(docsFolder)
        permalinks = []
        Find.find(docsFolder) do |file|
        next unless file =~ /\.html$|\.md$/ # Only process .html or .md files
            contents = File.read(file)
            permalink = contents[/permalink: (.*)/, 1]
            permalinks << permalink if permalink
        end
        return permalinks.compact
    end

    def self.checkPermalinks(site_dir, sitePermalinks, silent)
        badPermalinks = 0;
        badPatterns = 0
        normalizedPermalinks = Globals.removeSlashesFromArrayElements(sitePermalinks)

        Globals.putsColText(Globals::WHITE, "Checking duplicates:") if !silent
        duplicates = Globals.getArrayDuplicates(normalizedPermalinks)

        if (duplicates.length > 0)
            result = "#{duplicates.length} permalink(s) duplicate(s) found"
            FileUtilities.write_file("#{Globals::ROOT_DIR}/tools/checks/permalinks.log", "#{result}\n")
            Globals.putsColText(Globals::YELLOW, " - #{result}") if !silent
            duplicates.each do |duplicate|
                siteDuplicatesInfo = {}
                siteDuplicates = sitePermalinks.compact.select { |element| element.include?(duplicate) }
                siteDuplicates.each do |siteDuplicate|
                    siteDuplicatesInfo[siteDuplicate] = FileUtilities.getFileFromPermalink(site_dir, siteDuplicate)
                end
                result = "For normalized permalink \"#{duplicate}\" #{Globals::ARROW_RIGHT} #{siteDuplicatesInfo}"
                Globals.putsColText(Globals::YELLOW, " - #{result}") if !silent
                FileUtilities.write_file("#{Globals::ROOT_DIR}/tools/checks/permalinks.log", "#{result}\n")
            end
        end

        Globals.putsColText(Globals::WHITE, "Checking consistency:") if !silent
        sitePermalinks.compact.each do |permalink|
            permalinkPattern = 0
            permalinkPattern = permalink.include?(".html") ? 0 : checkPermalinkPattern(permalink);
            badPatterns += permalinkPattern
            if (permalinkPattern == 1)
                result = "Inconsistent pattern for permalink \"#{permalink}\" #{Globals::ARROW_RIGHT} #{FileUtilities.getFileFromPermalink(site_dir, permalink)}; Consider to use: \"/#{Globals.removeFirstAndLastSlash(permalink)}/\""
                Globals.putsColText(Globals::YELLOW, " - #{result}") if !silent
                FileUtilities.write_file("#{Globals::ROOT_DIR}/tools/checks/permalinks.log", "#{result}\n")
            end
            if (permalinkPattern == 2)
                result = "Invalid characters for permalink \"#{permalink}\" #{Globals::ARROW_RIGHT} #{FileUtilities.getFileFromPermalink(site_dir, permalink)}"
                Globals.putsColText(Globals::YELLOW, " - #{result}") if !silent
                FileUtilities.write_file("#{Globals::ROOT_DIR}/tools/checks/permalinks.log", "#{result}\n")
            end
        end

        badPermalinks = duplicates.length | badPatterns
        return badPermalinks
    end

    def self.checkPermalinkPattern(permalink)

        if permalink.match?(/^[a-zA-Z0-9_\/-]+$/)
            if permalink =~ /^\// && permalink =~ /\/$/
                return 0
            else
                return 1
            end
        else
            return 2
        end
    end

    def self.find_collection_name_by_permalink(filtered_collections, permalink)
        filtered_collections.each do |collection|
          collection['docs'].each do |doc|
            if doc['permalink'] == permalink
              return collection['custom_name']
            end
          end
        end
        nil
    end
    
end