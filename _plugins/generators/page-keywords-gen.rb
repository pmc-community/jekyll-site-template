require 'jekyll'
require 'yaml'
require 'nokogiri'
require 'json'
require 'net/http'
require 'uri'
require_relative "../../tools/modules/globals"
require_relative "../../tools/modules/file-utilities"

module Jekyll

  class PageKeywordsGenerator < Generator
    safe true
    # must be after PageListGenerator from _plugins/generators/pages-gen.rb 
    # but before FilteredCollectionsGenerator from _plugins/generators/fitered-collections.rb
    priority :normal 

    def generate(site)
      if site.data['buildConfig']["pageKeywords"]["enable"]
        modified_files_path = "#{site.data["buildConfig"]["rawContentFolder"]}/modified_files.json"
        modified_files = File.exist?(modified_files_path) ? FileUtilities.read_json_file(modified_files_path) : {"files" => []}
        
        if modified_files["files"].length > 0
          Globals.putsColText(Globals::PURPLE, "Generating keywords for pages ...")
          numPages = 0

          Globals.show_spinner do
            @site = site
            doc_files = FileUtilities.get_real_files_from_raw_content_files(modified_files["files"])

            mutex = Mutex.new # for thread-safe increments

            keywords_content = File.exist?(pageKeywords_path = "#{site.data["buildConfig"]["rawContentFolder"]}/pageKeywords.json") ? FileUtilities.read_json_file(pageKeywords_path) : { "keywords" => [] }
            keywords = keywords_content["keywords"]

            threads = doc_files.map do |file_path|
              Thread.new(file_path) do |path|
                begin
                  next unless File.file?(path)

                  content = File.read(path)
                  content.force_encoding('UTF-8').encode!('UTF-8', invalid: :replace, undef: :replace)

                  if FileUtilities.valid_front_matter?(content)
                    front_matter, content_body = FileUtilities.parse_front_matter(content)

                    if front_matter['excerpt'].nil? || front_matter['excerpt'].strip.empty?
                      rendered_content = FileUtilities.render_jekyll_page(site, path, front_matter, content_body)
                      excerpt = generate_keywords(
                        rendered_content,
                        site.data['buildConfig']["autoExcerpt"]["keywords"],
                        site.data['buildConfig']["autoExcerpt"]["minKeywordLength"],
                        front_matter['permalink']
                      )

                      if front_matter["permalink"] && !front_matter["permalink"].empty? && excerpt.length > 0
                        mutex.synchronize do
                          crtPage = { "permalink" => front_matter["permalink"], "keywords" => excerpt }
                          existingPage = keywords.find { |obj| obj["permalink"] == crtPage["permalink"] }
                          if existingPage
                            existingPage["keywords"] = crtPage["keywords"]
                            Globals.putsColText(Globals::PURPLE, " - #{front_matter["permalink"]}: done")
                          else
                            keywords << crtPage
                          end
                          numPages += 1

                          # Output the permalink of the processed file
                          Globals.clearLine
                          Globals.putsColText(Globals::PURPLE, "- PERMALINK: #{front_matter["permalink"]} ... done")
                        end
                      end
                    end
                  end
                rescue => e
                  puts "Error processing #{path}: #{e.message}"
                end
              end
            end
            threads.each(&:join)
            FileUtilities.overwrite_file(pageKeywords_path, JSON.pretty_generate({ "keywords" => keywords }))
          end
        else
          Globals.putsColText(Globals::PURPLE, "Generating keywords for pages ... nothing to do! (no content changes)")
        end

        # Update site.data['page_list'] with keywords as excerpt
        pageKeywords_path = "#{site.data["buildConfig"]["rawContentFolder"]}/pageKeywords.json"
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
              page["excerpt"] = pageKeywords["keywords"].join(", ")
              break
            end
          end
        end
        site.data['page_list'] = pageList.to_json

        if modified_files["files"].length > 0
          Globals.clearLine
          Globals.putsColText(Globals::PURPLE, "Generating keywords for pages ... done (#{numPages} pages)")
        end
      end
    end

    private

    def generate_keywords(content, max_keywords, min_length, filename)
      cmd = "tools_py/keywords/keywords.py dummy_input #{filename}"
      ios = IO.popen(cmd, "r+") do |pipe|
        pipe.write(content)
        pipe.close_write
        json_out = pipe.read
        data = JSON.parse(json_out)
        kws = data["keywords"] || []
        return kws.select { |k| k.length >= min_length }.first(max_keywords)
      end
      rescue => e
        puts "Local keyword extraction failed: #{e.message}"
        []
    end

  end

end
