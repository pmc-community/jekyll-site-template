require 'jekyll'
require 'yaml'
require 'nokogiri'
require 'json'
require 'net/http'
require 'uri'
require 'open3'
require_relative "../../tools/modules/globals"
require_relative "../../tools/modules/file-utilities"

module Jekyll

  class PageKeywordsGenerator < Generator
    safe true
    # must be after PageListGenerator from _plugins/generators/pages-gen.rb 
    # but before FilteredCollectionsGenerator from _plugins/generators/fitered-collections.rb
    priority :normal 

    def generate(site)
      config = site.data['buildConfig']
      return unless config.dig("pageKeywords", "enable")

      modified_files_path = "#{config["rawContentFolder"]}/modified_files.json"
      modified_files = if File.exist?(modified_files_path)
                         FileUtilities.read_json_file(modified_files_path)
                       else
                         { "files" => [] }
                       end

      if modified_files["files"].empty?
        update_page_list_excerpts(site)
        Globals.putsColText(Globals::PURPLE, "Generating keywords for pages ... nothing to do! (no content changes)")
        return
      end

      Globals.putsColText(Globals::PURPLE, "Generating keywords for pages ...")
      numPages = 0

      Globals.show_spinner do
        @site = site
        doc_files = FileUtilities.get_real_files_from_raw_content_files(modified_files["files"])

        pageKeywords_path = "#{config["rawContentFolder"]}/pageKeywords.json"
        keywords_content = File.exist?(pageKeywords_path) ? FileUtilities.read_json_file(pageKeywords_path) : { "keywords" => [] }
        keywords = keywords_content["keywords"]

        doc_files.each do |path|
          begin
            next unless File.file?(path)
            content = File.read(path)
            content.force_encoding('UTF-8').encode!('UTF-8', invalid: :replace, undef: :replace)

            next unless FileUtilities.valid_front_matter?(content)
            front_matter, content_body = FileUtilities.parse_front_matter(content)

            next unless front_matter["excerpt"].nil? || front_matter["excerpt"].strip.empty?

            rendered_content = FileUtilities.render_jekyll_page(site, path, front_matter, content_body)
            excerpt = generate_keywords(
              rendered_content,
              config.dig("autoExcerpt", "keywords"),
              config.dig("autoExcerpt", "minKeywordLength"),
              front_matter["permalink"]
            ).uniq

            next if front_matter["permalink"].to_s.empty? || excerpt.empty?

            crtPage = { "permalink" => front_matter["permalink"], "keywords" => excerpt }
            existingPage = keywords.find { |obj| obj["permalink"] == crtPage["permalink"] }
            if existingPage
              existingPage["keywords"] = crtPage["keywords"]
            else
              keywords << crtPage
            end

            numPages += 1
            Globals.clearLine
            Globals.putsColText(Globals::GREEN, "- PERMALINK: #{front_matter["permalink"]} ... done (#{numPages})")

          rescue => e
            puts "Error processing #{path}: #{e.message}"
          end
        end

        FileUtilities.overwrite_file(pageKeywords_path, JSON.pretty_generate({ "keywords" => keywords }))
      end

      # Update site.data['page_list'] with keywords as excerpt
      pageKeywords_path = "#{config["rawContentFolder"]}/pageKeywords.json"
      return unless File.exist?(pageKeywords_path)

      begin
        keywords_json = JSON.parse(File.read(pageKeywords_path))
      rescue JSON::ParserError
        Globals.putsColText(Globals::RED, "- Cannot parse #{pageKeywords_path}")
        return
      end

      update_page_list_excerpts(site)

      Globals.clearLine
      Globals.putsColText(Globals::PURPLE, "Generating keywords for pages ... done (#{numPages} pages)")
    end

    private

    def update_page_list_excerpts(site)
      config = site.data['buildConfig']
      pageKeywords_path = "#{config["rawContentFolder"]}/pageKeywords.json"
      return unless File.exist?(pageKeywords_path)
      begin
        keywords_json = JSON.parse(File.read(pageKeywords_path))
      rescue JSON::ParserError
        Globals.putsColText(Globals::RED, "- Cannot parse #{pageKeywords_path}")
        return
      end
      pageList = JSON.parse(site.data['page_list'])
      pagesKeywords = keywords_json["keywords"]

      pagesKeywords.each do |pageKeywords|
        pageList.each do |page|
          if page["permalink"] == pageKeywords["permalink"]

            if page["excerpt"] == ""
            page["excerpt"] = pageKeywords["keywords"].join(", ")
            pageList.map! do |pg|
              pg[:permalink] == page["permalink"] ? page : pg
            end
            end


            break
          end
        end
      end

      site.data['page_list'] = pageList.to_json
      page_list_path = "#{config["rawContentFolder"]}/page_list.json"
      FileUtilities.overwrite_file(page_list_path, JSON.pretty_generate(pageList))

    end


    # Safe, single-process call to Python keyword extractor
    def generate_keywords(content, max_keywords, min_length, filename)
      cmd = ["python3", "tools_py/keywords/keywords.py", "dummy_input", filename]
      stdout, stderr, status = Open3.capture3(*cmd, stdin_data: content)

      unless status.success?
        puts "Keyword extraction failed for #{filename}: #{stderr.strip}"
        return []
      end

      begin
        data = JSON.parse(stdout)
        kws = data["keywords"] || []
        kws.select { |k| k.length >= min_length }.first(max_keywords)
      rescue JSON::ParserError => e
        puts "JSON parse error for #{filename}: #{e.message}"
        puts "Output: #{stdout.strip}"
        puts "Errors: #{stderr.strip}" unless stderr.strip.empty?
        []
      end
    rescue => e
      puts "Local keyword extraction failed for #{filename}: #{e.message}"
      []
    end
  end
end
