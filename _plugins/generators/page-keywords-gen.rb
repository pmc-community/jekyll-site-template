require 'jekyll'
require 'yaml'
require 'nokogiri'
require_relative "../../tools/modules/globals"
require_relative "../../tools/modules/file-utilities"
require 'text_rank'

module Jekyll

  class PageKeyordsGenerator < Generator
    safe true
    priority :high #must be after PageListGenerator from _plugins/generators/pages-gen.rb

    def generate(site)
      doc_contents_dir = File.join(site.source, Globals::DOCS_ROOT) 
      doc_files = Dir.glob("#{doc_contents_dir}/**/*.{md,html}")
      
      doc_files.each do |file_path|
        next unless File.file?(file_path)  # Skip if it's not a file      
        content = File.read(file_path)
        
        if FileUtilities.valid_front_matter?(content)
          front_matter, content_body = FileUtilities.parse_front_matter(content)
          
          # Check if the front matter already contains an excerpt
          if front_matter['excerpt'].nil? || front_matter['excerpt'].strip.empty?
            rendered_content = FileUtilities.render_jekyll_page(site, file_path, front_matter, content_body)            
            excerpt = generate_key_words(
                rendered_content, 
                site.data['siteConfig']["autoExcerpt"]["keywords"], 
                site.data['siteConfig']["autoExcerpt"]["minKeywordLength"]
            )
                        
            if (front_matter["permalink"] && front_matter["permalink"] != "" && excerpt.length >0 )
                pageList = JSON.parse(site.data['page_list'])
                pageList.each do |obj|
                    if obj["permalink"] == front_matter["permalink"]
                        obj["excerpt"] = excerpt.join(", ")
                        break
                    end
                end
                site.data['page_list'] = pageList.to_json
            end

          end
        end
      end
    end

    private

    def generate_key_words(content, words, minLength)
        # Fully customized extraction:
        extractor = TextRank::KeywordExtractor.new(
            strategy:   :dense,  # Specify PageRank strategy (dense or sparse)
            damping:    0.95,     # The probability of following the graph vs. randomly choosing a new node
            tolerance:  0.00001,   # The desired accuracy of the results
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
