require 'net/http'
require 'json'
require_relative "../../tools/modules/globals"
require_relative "../../tools/modules/file-utilities"

module Jekyll
  class ReadingTimeGenerator < Generator
    safe true
    priority :normal # must be after pageListGenerator from _plugins/generators/pages-gen.rb

    def get_average_wpm(site)
      sources = {
        "average_adult" => site.data['buildConfig']["readingTime"]["average_adult"],        
        "comprehension_study" => site.data['buildConfig']["readingTime"]["comprehension_study"],  
        "skimming_study" => site.data['buildConfig']["readingTime"]["skimming_study"]        
      }

      average_wpm = sources.values.sum / sources.size
      average_wpm
    end

    def generate(site)
      if (site.data['buildConfig']["readingTime"]["enabled"])
        Globals.putsColText(Globals::PURPLE,"Generating reading time info ... ")
        reading_speed = get_average_wpm(site)

        doc_raw_contents = Dir.glob('doc-raw-contents/**/*.txt')

        doc_raw_contents.each do |file_path|
          content = File.read(file_path)
          content.force_encoding('UTF-8').encode!('UTF-8', invalid: :replace, undef: :replace)
          word_count = content.split.size
          reading_time = (word_count / reading_speed.to_f).ceil

          puts file_path
          content = File.read(FileUtilities.get_real_file_from_raw_content_file(file_path))
          content.force_encoding('UTF-8').encode!('UTF-8', invalid: :replace, undef: :replace)
          front_matter, _ = FileUtilities.parse_front_matter(File.read(FileUtilities.get_real_file_from_raw_content_file(file_path)))
          next if !front_matter
          
          permalink = front_matter["permalink"]
          next if !permalink

          title = front_matter["title"]
          next if !title

          pageList = JSON.parse(site.data['page_list'])
          pageList.each do |page|
            if ( page["permalink"] == permalink && page["title"] == title)
                page["readingTime"] = reading_time
                break
            end
          end
          site.data['page_list'] = pageList.to_json
          Globals.moveUpOneLine
          Globals.clearLine
          Globals.putsColText(Globals::PURPLE, "Generating reading time info ... done (#{pageList.length} pages)")
        end
      end
    end
  end
end
