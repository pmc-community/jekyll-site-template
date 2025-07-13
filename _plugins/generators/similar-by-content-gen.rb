require_relative "../../tools/modules/globals"
require_relative "../../tools/modules/file-utilities"
require 'open3'

module Jekyll

  class PageSimilarByContent < Generator
    safe true
    priority :normal # must run after pageList generator

    def generate(site)

      # === GENERATE SIMILAR BY CONTENT ===
      if site.data['buildConfig']["pyEnable"] &&
         site.data['buildConfig']["pySimilarPagesByContent"]["enable"]

        modified_path = "#{site.data['buildConfig']["rawContentFolder"]}/modified_files.json"
        modified_data = FileUtilities.read_json_file(modified_path)
        modified_files = modified_data["files"] rescue nil

        return unless modified_files
        if modified_files.empty?
          Globals.putsColText(Globals::PURPLE, "Generating similar by content ... nothing to do! (no content changes)")
        else
          auto_similar_path = "#{site.data['buildConfig']["rawContentFolder"]}/autoSimilar.json"
          current_similar_pages = if File.exist?(auto_similar_path)
            FileUtilities.read_json_file(auto_similar_path) || []
          else
            []
          end

          # Get permalinks for modified files
          modified_permalinks = modified_files.map do |file_path|
            File.basename(file_path, ".txt").gsub('_', '/')
          end

          files_to_process = modified_files.dup

          # Add any pages that were previously marked as similar to the modified ones
          modified_permalinks.each do |permalink|
            similar_obj = Globals.find_object_by_multiple_key_value(current_similar_pages, { "permalink" => permalink })
            similar_pages = similar_obj ? (similar_obj["similarFiles"] || []) : []
            processed_paths = similar_pages.map { |p| "doc-raw-contents/#{p.gsub('/', '_')}.txt" }
            files_to_process += processed_paths
          end

          files_to_process = files_to_process.compact.uniq
          return if files_to_process.empty?

          # Run Python script
          Globals.show_spinner do
            Globals.putsColText(Globals::PURPLE, "Generating similar by content ... for #{files_to_process.length} pages")

            json_input = {
              "pageList" => site.data['page_list'],
              "fileList" => files_to_process
            }

            python_script = site.data["buildConfig"]["pySimilarPagesByContent"]["script"]

            callback = Proc.new do |response|
              permalink = response.dig("payload", "payload", "permalink") || ""
              pageNo = response["outputNo"] if !permalink.empty?

              Globals.clearLine
              if !permalink.empty?
                Globals.putsColText(Globals::PURPLE, "- PERMALINK: #{permalink} ... done (#{pageNo})")
              else
                Globals.putsColText(Globals::PURPLE, response.dig("payload", "message") || "(No message)")
              end
            end

            Globals.run_python_script(site, python_script, json_input, callback)
          end

          Globals.clearLine
        end
      end

      # === UPDATE PAGE LIST WITH SIMILARITY RESULTS ===
      auto_similar_path = "#{site.data["buildConfig"]["rawContentFolder"]}/autoSimilar.json"
      return unless File.exist?(auto_similar_path)

      begin
        auto_similar = JSON.parse(File.read(auto_similar_path))
      rescue
        Globals.putsColText(Globals::RED, "- Cannot parse #{auto_similar_path}")
        return
      end

      begin
        page_list = JSON.parse(site.data['page_list'])
      rescue
        Globals.putsColText(Globals::RED, "- Cannot parse page list from site.data['page_list']")
        return
      end

      auto_similar.each do |page_obj|
        page_list.each do |page|
          next unless page["permalink"] == page_obj["permalink"]

          similar_pages = []

          (page_obj["similarFiles"] || []).each do |similar_permalink|
            similar_page_obj = Globals.find_object_by_multiple_key_value(
              page_list,
              { "permalink" => similar_permalink }
            ) || {}

            unless similar_page_obj.empty?
              similar_pages << {
                "permalink" => similar_page_obj["permalink"],
                "title" => similar_page_obj["title"]
              }
            end
          end

          page["similarByContent"] = similar_pages
          break
        end
      end

      site.data['page_list'] = page_list.to_json
    end
  end

end
