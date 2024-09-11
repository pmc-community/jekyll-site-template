require 'net/http'
require 'kramdown'
require 'dotenv'

Dotenv.load

module ContentUtilities

    def self.getExternalContentFromGitHub(file_info)
        raw_url = "https://raw.githubusercontent.com/#{file_info["owner"]}/#{file_info["repo"]}/#{file_info["branch"]}/#{file_info["file_path"]}"
        
        uri = URI.parse(raw_url)

        request = Net::HTTP::Get.new(uri)
        if (file_info["needAuth"]) 
            request['Authorization'] = "token #{ENV["JEKYLL_ACCESS_TOKEN"]}"
        end

        response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
            http.request(request)
        end

        if response.is_a?(Net::HTTPSuccess)
            markdown_content = file_info["ignore_wp_shortcodes"] ? 
                getContentBetweenMarkers(
                    response.body.gsub(/\[.*?\](?!\((https?:\/\/|\/).*?\))/, ''), 
                    file_info["start_marker"], 
                    file_info["end_marker"]
                ).force_encoding('UTF-8') : 
                getContentBetweenMarkers(
                    response.body, 
                    file_info["start_marker"], 
                    file_info["end_marker"]
                ).force_encoding('UTF-8')
            
            if (file_info["include_start_marker"])
                markdown_content = file_info["start_marker"] + markdown_content
            end
            if (file_info["include_end_marker"])
                markdown_content = markdown_content + file_info["end_marker"]
            end

            return file_info["markdown"] ? markdown_content : Kramdown::Document.new(markdown_content).to_html
        else
            return "Error: #{response.code} - #{response.message} - #{raw_url}"
        end

    end

    def self.getExternalContentFromGitHubMM(file_info)
        raw_url = "https://raw.githubusercontent.com/#{file_info["owner"]}/#{file_info["repo"]}/#{file_info["branch"]}/#{file_info["file_path"]}"
        uri = URI.parse(raw_url)
        request = Net::HTTP::Get.new(uri)
        if (file_info["needAuth"]) 
            request['Authorization'] = "token #{ENV["JEKYLL_ACCESS_TOKEN"]}"
        end
        response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
            http.request(request)
        end

        if response.is_a?(Net::HTTPSuccess)
            markdown_content = file_info["ignore_wp_shortcodes"] ? 
                response.body.gsub(/\[.*?\](?!\((https?:\/\/|\/).*?\))/, '') : 
                response.body
        else
            return "Error: #{response.code} - #{response.message} - #{raw_url}"
        end       

        theContent = ""
        file_info["markers"].each do |markerPair|
            content = getContentBetweenMarkers(markdown_content, markerPair["start_marker"], markerPair["end_marker"]).force_encoding('UTF-8')
            if (markerPair["include_start_marker"])
                content = markerPair["start_marker"] + content
            end
            if (markerPair["include_end_marker"])
                content = content + markerPair["end_marker"]
            end
            theContent += content
        end
        return file_info["markdown"] ? theContent : Kramdown::Document.new(theContent).to_html
    end

    def self.getExternalSiteContent(file_info)
        file = "#{Globals::DOCS_DIR}/#{file_info["file_path"]}"
        if File.exist?(file)
            content = file_info["ignore_wp_shortcodes"] ?
            
                getContentBetweenMarkers(
                    Globals.removeFrontMatter(File.read(file)).gsub(/\[.*?\](?!\((https?:\/\/|\/).*?\))/, ''),
                    file_info["start_marker"], 
                    file_info["end_marker"]
                ).force_encoding('UTF-8') :
                
                getContentBetweenMarkers(
                    Globals.removeFrontMatter(File.read(file)),
                    file_info["start_marker"], 
                    file_info["end_marker"]
                ).force_encoding('UTF-8')
            
            if (file_info["include_start_marker"])
                content = file_info["start_marker"] + content
            end
            if (file_info["include_end_marker"])
                content = content + file_info["end_marker"]
            end
            
            return file_info["markdown"] ? content : Kramdown::Document.new(content).to_html
          else
            return "Error getting file: #{file_info["file_path"]}"
        end
    end

    def self.getExternalSiteContentMM(file_info)
        file = "#{Globals::DOCS_DIR}/#{file_info["file_path"]}"
        if File.exist?(file)
            markdown_content = file_info["ignore_wp_shortcodes"] ?
                Globals.removeFrontMatter(File.read(file)).gsub(/\[.*?\](?!\((https?:\/\/|\/).*?\))/, '') :
                Globals.removeFrontMatter(File.read(file))            
          else
            return "Error getting file: #{file_info["file_path"]}"
        end

        theContent = ""
        file_info["markers"].each do |markerPair|
            content = getContentBetweenMarkers(markdown_content, markerPair["start_marker"], markerPair["end_marker"]).force_encoding('UTF-8')
            if (markerPair["include_start_marker"])
                content = markerPair["start_marker"] + content
            end
            if (markerPair["include_end_marker"])
                content = content + markerPair["end_marker"]
            end
            theContent += content
        end
        return file_info["markdown"] ? theContent : Kramdown::Document.new(theContent).to_html

    end

    def self.getContentBetweenMarkers(content, start_marker, end_marker)
        if (start_marker == "" || end_marker == "")
            return "Start and/or End markers are wrong! Cannot return anything."
        elsif (start_marker == "fullFile" && end_marker == "fullFile")
            return content
        else
            regex = /#{Regexp.escape(start_marker)}(.*?)#{Regexp.escape(end_marker)}/m
            match_data = content.match(regex)
            if match_data
                return match_data[1]
              else
                return "Start and/or End markers are wrong! Cannot return anything."
            end
        end
    end

end