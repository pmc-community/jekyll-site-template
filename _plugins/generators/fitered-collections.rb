require_relative "../../tools/modules/globals"
require 'fileutils'

module Jekyll
  class FilteredCollectionsGenerator < Generator
    safe true
    priority :low

    def generate(site)
      if (site.data["pageBuildConfig"]["/"]["sections"]["collections_section"]["enabledInHome"])
        Globals.putsColText(Globals::PURPLE,"Generating collections info ... ")
        excluded_collections = site.data["pageBuildConfig"]["/"]["sections"]["collections_section"]["except"]
        custom_names = site.config.dig('just_the_docs', 'collections') || {}
        filtered_collections = []

        site.collections.each do |name, collection|
          next unless collection.metadata['output'] && !excluded_collections.include?(name)
          custom_name = custom_names.dig(name, 'name') || name

          collection_start_doc = {}

          docs = collection.docs.map do |doc|
            file_path = doc.path

            create_date = File.birthtime(file_path)
            last_update_date = File.mtime(file_path)

            if (doc.data["start"])
              collection_start_doc["permalink"] = doc.data['permalink'] || doc.url
              collection_start_doc["title"] = doc.data['title']
            end

            {
              "permalink" => doc.data['permalink'] || doc.url,
              "title" => doc.data['title'],
              "create_date" => create_date,
              "last_update" => last_update_date,
              "excerpt" => Globals.find_object_key_value( 
                JSON.parse(site.data['page_list']), 
                {
                  "permalink" => doc.data['permalink'] || doc.url, 
                  "title" => doc.data["title"]
                }, 
                "excerpt"
              ) || doc.data['excerpt']
            }

            

          end

          sorted_docs = docs.sort_by { |doc| -doc["last_update"].to_i } 
          filtered_collections << { "name" => name, "custom_name" => custom_name, "docs" => sorted_docs, "start" => collection_start_doc }
        end 
        
        #puts JSON.pretty_generate(filtered_collections)
        site.data['filtered_collections'] = filtered_collections
        Globals.moveUpOneLine
        Globals.clearLine
        Globals.putsColText( Globals::PURPLE, "Generating collections info ... done")
      end
    end
  end
end
