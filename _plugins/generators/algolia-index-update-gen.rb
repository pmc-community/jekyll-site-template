require_relative "../../tools/modules/globals"
require_relative "../../tools/modules/file-utilities"
require_relative "../../tools/modules/extContent-utilities"
require_relative "../../tools/modules/permalinks-utilities"
require 'date'
require 'algolia'

module Jekyll

  class AlgoliaIndexUpdate < Generator
    safe true
    priority :lowest # should be the last executed to be able to collect all the information

      def generate(site)

        if (ENV["ALGOLIA_NETLIFY_ENABLED"] == "true" || ENV["ALGOLIA_CUSTOM_ENABLED"])
          Globals.putsColText(Globals::PURPLE,"Updating Algolia index ...")

          modified_files = FileUtilities.read_json_file("#{site.data['buildConfig']["rawContentFolder"]}/modified_files.json")["files"]
          return if !modified_files

          if (modified_files.length == 0)
              Globals.moveUpOneLine
              Globals.clearLine
              Globals.putsColText(Globals::PURPLE,"Updating Algolia index ... nothing to do! (no content changes)")         
          else
              
              Globals.show_spinner do
                
                record ={}
                records_array = [];
                
                modified_files.each do |file_path|
                  next unless File.file?(file_path)
                  
                  record ={}
                  chunked_records = []
                  content = File.read(file_path)
                  record["content"] = content

                  permalink = File.basename(file_path, File.extname(file_path)).gsub('_', '/')

                  record["pagePermalink"] = permalink
                  record["objectID"] = permalink
                  correct_permalink = permalink.start_with?("/") ? permalink : "/#{permalink}"
                  full_url = "#{ENV["DEPLOY_PROD_BASE_URL"]}#{correct_permalink}"
                  normalized_url = full_url.end_with?("/") ? full_url : "#{full_url}/"
                  record["url"] = normalized_url

                  page = Globals.find_object_by_multiple_key_value(JSON.parse(site.data["page_list"]), {"permalink" => permalink})

                  record["pageTitle"] = page["title"] if !page.empty?
                  record["pageCategories"] = page["categories"].take(50) if !page.empty?
                  record["pageTags"] = page["tags"].take(50) if !page.empty?
                  record["pageExcerpt"] = page["excerpt"] if !page.empty?
                  record["pageLastUpdate"] = page["lastUpdate"] if !page.empty?
                  record["pageCreateTime"] = page["createTime"] if !page.empty?                  
                  record["pageSummary"] = page["autoSummary"] if !page.empty?
                  record["pageReadingTime"] = page["readingTime"] if !page.empty?
                  record["pageHasDynamicContent"] = page["hasDynamicContent"] if !page.empty?
                  record["pageCollection"] = PermalinksUtilities.find_collection_name_by_permalink(
                    site.data['filtered_collections'], 
                    permalink
                  ) if !page.empty?

                  relatedPages = []
                  if (!page.empty?)      
                      page["relatedPages"].take(10).each do |page|
                        relatedPages << "#{page["title"]} (#{page["permalink"]})"
                      end                
                  end
                  record["pageRelatedPages"] = relatedPages

                  similarPages = []
                  if (!page.empty?)      
                      page["similarByContent"].take(10).each do |page|
                        similarPages << "#{page["title"]} (#{page["permalink"]})"
                      end                
                  end
                  record["pageSimilarPages"] = similarPages

                  max_size_kb = 9.8
                  chunked_records = split_content_object(record, max_size_kb, site)

                  i = 0
                  chunked_records.each do |chunk|
                    record_id = chunk["objectID"]
                    chunk["objectID"] = "buildGenerated_#{record_id}_#{i}"
                    if (get_record_size_in_kb(chunk) < 10)
                      records_array << chunk
                    end
                    i +=1 
                  end
                end

                if (ENV["ALGOLIA_NETLIFY_ENABLED"] == "true")
                  update_index(
                    ENV["ALGOLIA_NETLIFY_APP_ID"], 
                    ENV["ALGOLIA_NETLIFY_WRITE_API_KEY"], 
                    ENV["ALGOLIA_NETLIFY_INDEX"], 
                    records_array
                  )     
                end

                if (ENV["ALGOLIA_CUSTOM_ENABLED"] == "true")
                  update_index(
                    ENV["ALGOLIA_CUSTOM_APP_ID"], 
                    ENV["ALGOLIA_CUSTOM_WRITE_API_KEY"], 
                    ENV["ALGOLIA_CUSTOM_INDEX"], 
                    records_array
                  )     
                end
                
              end
              Globals.moveUpOneLine
              Globals.clearLine
              Globals.putsColText(Globals::PURPLE,"Updated Algolia index ... for #{modified_files.length} pages")
          end
        
        end
      
      end

      def update_index(appID, appKey, indexName, records)
        client = Algolia::SearchClient.create(appID, appKey)
        client.partial_update_objects(indexName, records, true, {})
      end
      
      def get_record_size_in_kb(record)
        record_string = record.to_json
        record_string_no_whitespace = record_string.gsub(/\s+/, '')
        record_size_in_kb = record_string_no_whitespace.bytesize.to_f / 1000
        record_size_in_kb    
      end

      def calculate_size_in_bytes(object)
        JSON.generate(object).bytesize
      end
      
      def split_content_object(json_object, max_size_kb, site)
        max_size_bytes = (max_size_kb * 1000).to_i
        content = json_object["content"] || ""
      
        base_object = json_object;
        base_object.delete("content")
        base_size = get_record_size_in_kb(base_object)*1000.to_i
      
        max_content_size = max_size_bytes - base_size      
        return [] if max_content_size < 0 # means that the record without content is bigger than 10k, so we skip it

        content_size = max_content_size > site.data["buildConfig"]["algoliaSearch"]["customIndexContentMaxSize"] ? 
          site.data["buildConfig"]["algoliaSearch"]["customIndexContentMaxSize"] : 
          max_content_size

        result = []  
        chunks = split_content_into_chunks(content, content_size) 
        
        chunks.each do |chunk|    
          chunkObj = {}
          recordObj = {}
          chunkObj["content"] = chunk
          recordObj = chunkObj.merge(base_object)
          result << recordObj
        end
        
        return result 
      end

      def split_content_into_chunks(content, max_content_size)
        chunks = []
        current_chunk = ""
      
        # Split content into words
        words = content.split(' ')
      
        words.each do |word|
          # Check if adding the next word will exceed the max size
          if (current_chunk.bytesize + word.bytesize + 1) > max_content_size
            # If so, save the current chunk and start a new one
            chunks << current_chunk.strip
            current_chunk = ""
          end
      
          # Add the word to the current chunk
          current_chunk << "#{word} "
        end
      
        # Add the last chunk if it's not empty
        chunks << current_chunk.strip unless current_chunk.empty?
      
        chunks
      end
      
        
  end
  
end
  