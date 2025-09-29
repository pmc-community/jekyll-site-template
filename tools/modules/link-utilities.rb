require_relative 'file-utilities'
require 'net/http'
require 'uri'

module LinkUtilities

    def self.getPermalinks(docsFolder)
        permalinks = []
        Find.find(docsFolder) do |file|
        next unless file =~ /\.html$|\.md$/ # Only process .html or .md files
            contents = File.read(file)
            permalink = contents[/permalink: (.*)/, 1]
            permalinks << Globals.removeFirstAndLastSlash(permalink) if permalink
        end
        return permalinks
    end

    def self.scanFilesForLinks(folder)
        links = {}
        Find.find(folder) do |path|
          if path =~ /.*\.(html|md)$/
            links[path] = extract_links(path)
          end
        end
        return links
    end

    def self.extract_links(file)
        content = File.read(file)
        lnk = []
        content.scan(/\[([^\]]*)\]\(([^)]+)\)/) do |match|
          lnk << match[1] if match[1]
        end
        return lnk.uniq
    end

    def self.filterLinksToGetInternalOnly(links)
        links.each do |key, value|
            if value.is_a?(Array)
                value.reject! { |element| 
                    element.start_with?("https://") || 
                    element.start_with?("http://")
                }
            links[key] = value
            end
        end
        return links
    end

    def self.check_valid_uri(uri)
        uri = "http://#{uri}" unless uri.start_with?("http://", "https://")
        begin
            #parsed_uri = URI.parse(uri)
            return 0
        rescue URI::InvalidURIError
            return 1
        end
    end

    def self.filterLinksToGetExternalOnly(links)
        links.each do |key, value|
            if value.is_a?(Array)
              filtered_values = value.select do |element|
                uri = URI.parse(element) rescue nil
                uri&.scheme && uri&.host
              end
              links[key] = filtered_values.uniq
            end
        end
        return links
    end

    def self.filterLinksToRemoveSlashes(linksInPages)
        linksInPages.each do |page, links|
            modified_links = Globals.removeSlashesFromArrayElements(links)
            linksInPages[page] = modified_links.uniq
        end
        return linksInPages
    end

    def self.filterEmptyKeys(object)
        object.each do |key, value|
            if value.is_a?(Array) && value.empty?
              object.delete(key)
            end
        end
        return object
    end

    def self.checkInternalLinks(olp, spl, silent)
        brokenLinks = 0
        olp.each do |file, links|
            puts "ckecking #{file}" if !silent
            linkPos = 0
            links.each do |link|
                unless link.start_with?("#") # we don't check internal anchors
                    linkToCheck = Globals.removeFirstAndLastSlash(URI.parse(link).path)
                    #puts linkToCheck
                    found_value = spl.find { |value| Globals.removeFirstAndLastSlash(value) == linkToCheck }
                    if (!found_value)
                        result = "#{file}: Broken link: #{link}"
                        Globals.putsColText(Globals::YELLOW, " - #{result}") if !silent
                        FileUtilities.write_file("#{Globals::ROOT_DIR}/tools/checks/broken-internal-links.log", "#{result}\n")
                        brokenLinks += 1
                    end
                    linkPos += 1
                end
            end
        end
        return brokenLinks
    end

    def self.checkExternalLinks(elp, silent)
        brokenLinks = 0
        elp.each do |file, links|
            puts "ckecking #{file}" if !silent
            linkPos = 0
            links.each do |link|
                linkCheck = 0
                Globals.show_spinner do
                    linkCheck = check_link(link)
                end
                print "\b" # clear whatever spinner character is visible
                linkPos += 1
                if (linkCheck == 1)
                    brokenLinks +=1
                    result = "#{file}: Broken link: #{link}"
                    Globals.putsColText(Globals::YELLOW, " - #{result}") if !silent
                    FileUtilities.write_file("#{Globals::ROOT_DIR}/tools/checks/broken-external-links.log", "#{result}\n")
                end
            end
        end
        return brokenLinks
    end

    def self.check_link(url)
        begin
            uri = URI.parse(url)
            raise URI::InvalidURIError unless uri.host

            # Prefix URL with http:// if no scheme is provided
            uri = URI.parse("http://#{url}") if uri.scheme.nil?

            # Create an HTTP request and follow redirects
            response = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == 'https', read_timeout: 10) do |http|
                http.request(Net::HTTP::Get.new(uri))
            end

            # Check if the response code indicates success (2xx)
            if response.is_a?(Net::HTTPSuccess) || response.is_a?(Net::HTTPRedirection)
                # "The link #{url} is not broken."
                return 0
            else
                # "The link #{url} is broken. Response code: #{response.code}"
                return 1
            end
        rescue URI::InvalidURIError
            # "#{url} is not a valid URI."
            return 1
        rescue #SocketError, Net::OpenTimeout, Net::ReadTimeout => e
            # "Error: #{e.message}. The link #{url} could not be checked."
            return 1
        end
    end

end