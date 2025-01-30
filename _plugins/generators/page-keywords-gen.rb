require 'jekyll'
require 'yaml'
require 'nokogiri'
require 'json'
require_relative "../../tools/modules/globals"
require_relative "../../tools/modules/file-utilities"
require 'text_rank'

module Jekyll

  class PageKeywordsGenerator < Generator
    safe true
    # must be after PageListGenerator from _plugins/generators/pages-gen.rb 
    # but before FilteredCollectionsGenerator from _plugins/generators/fitered-collections.rb
    priority :normal 

    def generate(site)
      if (site.data['buildConfig']["pageKeywords"]["enable"])
        modified_files_path = "#{site.data["buildConfig"]["rawContentFolder"]}/modified_files.json"
        modified_files = File.exist?(modified_files_path)? FileUtilities.read_json_file(modified_files_path) : {"files" => []}
        
        if (modified_files["files"].length > 0 )
          Globals.putsColText(Globals::PURPLE, "Generating keywords for pages ...")
          numPages = 0

          # GENRATE KEYWORDS FOR PAGES THAT DOES NOT HAVE EXCERPT IN FRONT-MATTER
          Globals.show_spinner do
            @site = site
            #doc_contents_dir = File.join(site.source, Globals::DOCS_ROOT)
            #doc_files = Dir.glob("#{doc_contents_dir}/**/*.{md,html}")
            doc_files = FileUtilities.get_real_files_from_raw_content_files(modified_files["files"])

            mutex = Mutex.new # Mutex for thread-safe access to numPages and site.data['page_list']

            keywords = {}
            pageKeywords_path = "#{site.data["buildConfig"]["rawContentFolder"]}/pageKeywords.json"
            keywords_content = File.exist?(pageKeywords_path)? FileUtilities.read_json_file(pageKeywords_path) : { "keywords" => [] }
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
                        site.data['buildConfig']["autoExcerpt"]["minKeywordLength"]
                      )

                      if front_matter["permalink"] && !front_matter["permalink"].empty? && excerpt.length > 0
                        mutex.synchronize do
                          # Update the pageKeywords.json
                          crtPage = { "permalink" => front_matter["permalink"], "keywords" => excerpt }
                          existingPage = keywords.find { |obj| obj["permalink"] == crtPage["permalink"] }

                          if existingPage
                            existingPage["keywords"] = crtPage["keywords"]
                          else
                            keywords << crtPage
                          end
                          numPages += 1

                        end
                      end
                    end
                  end
                rescue => e
                  puts "Error processing #{path}: #{e.message}"
                end
              end
            end
            threads.each(&:join) # Wait for all threads to finish
            FileUtilities.overwrite_file(pageKeywords_path, JSON.pretty_generate({ "keywords" => keywords }))
          end
        else
          Globals.putsColText(Globals::PURPLE, "Generating keywords for pages ... nothing to do! (no content changes)")
        end

        # UPDATE data['page_list'] FROM pageKeywords.json
        pageKeywords_path = "#{site.data["buildConfig"]["rawContentFolder"]}/pageKeywords.json"
        return unless File.exist?(pageKeywords_path)

        begin
          keywords_json = JSON.parse(File.read(pageKeywords_path))
        rescue JSON::ParserError
          Globals.putsColText(Globals::RED, "- Cannot parse #{site.data["buildConfig"]["rawContentFolder"]}/pageKeywords.json")
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

        if (modified_files["files"].length > 0 )
          Globals.moveUpOneLine
          Globals.clearLine
          Globals.putsColText(Globals::PURPLE, "Generating keywords for pages ... done (#{numPages} pages)")
        end
      end

    end

    private

    def generate_keywords(content, words, minLength)
      # Fully customized extraction:
      extractor = TextRank::KeywordExtractor.new(
        strategy: :dense,  # Specify PageRank strategy (dense or sparse)
        damping: 0.95,     # The probability of following the graph vs. randomly choosing a new node
        tolerance: 0.00001, # The desired accuracy of the results
        graph_strategy: :Coocurrence,
        tokenizers: [
          :Word,
          :Url
        ],
        rank_filters: [
          :CollapseAdjacent, 
          :NormalizeProbability, 
          :NormalizeUnitVector, 
          :SortByValue
        ],
        char_filters: [
          :AsciiFolding, 
          :Lowercase, 
          :StripHtml, 
          :StripEmail, 
          :UndoContractions
        ],
        token_filters: [
          :Stopwords, 
          TextRank::TokenFilter::PartOfSpeech.new(parts_to_keep: %w[nn nns])
        ]
      )

      # Perform the extraction with at most 100 iterations
      extractor.extract(content, max_iterations: 100)
        .select { |word, score| word.length > minLength }
        .sort_by { |word, score| -score }
        .first(words)
        .map(&:first)
    end
  end
  
end
