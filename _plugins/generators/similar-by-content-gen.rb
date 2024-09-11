require_relative "../../tools/modules/globals"
require_relative "../../tools/modules/file-utilities"
require 'open3'

module Jekyll

    class PageSimilarByContent < Generator
      safe true
      priority :normal
  
        def generate(site)

            # GENERATE SIMILAR BY CONTENT
            if (site.data['buildConfig']["pyEnable"] && site.data['buildConfig']["pySimilarPagesByContent"]["enable"])
                
                modified_files = FileUtilities.read_json_file("#{site.data['buildConfig']["rawContentFolder"]}/modified_files.json")["files"]
                return if !modified_files
                if (modified_files.length == 0)
                    Globals.putsColText(Globals::PURPLE,"Generating similar by content ... nothing to do! (no content changes)")            
                else

                    # generating the full list of pages for which similarByContent will be generated
                    # full list of pages = modified_files + pages that had the as similar one of the modified_files
                    
                    if File.exist?("#{site.data['buildConfig']["rawContentFolder"]}/autoSimilar.json")
                        current_similar_pages = FileUtilities.read_json_file("#{site.data['buildConfig']["rawContentFolder"]}/autoSimilar.json") || []
                    else
                        current_similar_pages = []
                    end

                    modified_files_permalinks = modified_files.map do |file_path|
                        File.basename(file_path, ".txt").gsub('_', '/')
                    end

                    files_to_be_processed = modified_files
                    #puts modified_files_permalinks

                    modified_files_permalinks.each do |permalink|
                        if (current_similar_pages.length > 0)
                            similar_pages = Globals.find_object_by_multiple_key_value(current_similar_pages, {"permalink" => permalink})["similarFiles"] || []
                        else
                            similar_pages = []
                        end
                        
                        processed_similar_pages = similar_pages.map do |path|
                            "doc-raw-contents/#{path.gsub('/', '_')}.txt"
                        end
                        files_to_be_processed = files_to_be_processed + processed_similar_pages
                    end

                    # files_to_be_processed contains the full list of pages for which similarByContent will be generated
                    # files_to_be_processed is sent as fileList array in the json parameter to the python script
                    files_to_be_processed = files_to_be_processed.compact.uniq

                    return if !files_to_be_processed
                    return if files_to_be_processed.length == 0
                    # SUMMARIES
                    Globals.show_spinner do
                        Globals.putsColText(Globals::PURPLE,"Generating similar by content ... for #{files_to_be_processed.length} pages")
                        json_input = { "pageList" => site.data['page_list'], "fileList" => files_to_be_processed}
                        python_script = site.data["buildConfig"]["pySimilarPagesByContent"]["script"]

                        page_similarByContent_callback = Proc.new do |python_script_response|
                            permalink = python_script_response["payload"]["payload"]["permalink"] || ""
                            pageNo = python_script_response["outputNo"] if permalink != ""
                            Globals.clearLine
                            Globals.putsColText( Globals::PURPLE, "- PERMALINK: #{permalink} ... done (#{pageNo})") if permalink != ""
                            Globals.putsColText( Globals::PURPLE, "#{python_script_response["payload"]["message"]}") if permalink == ""
                        end

                        Globals.run_python_script(site, python_script, json_input, page_similarByContent_callback)
                    end
                
                    Globals.clearLine
                end
            end

            # UPDATE PAGE LIST
            autoSimilar = [];
            autoSimilar_path = "#{site.data["buildConfig"]["rawContentFolder"]}/autoSimilar.json"
            return if !File.exist?(autoSimilar_path)
            autoSimilar = File.read(autoSimilar_path)
            begin
                autoSimilar_json = JSON.parse(autoSimilar)
            rescue
                Globals.putsColText(Globals::RED, "- Cannot parse #{site.data["buildConfig"]["rawContentFolder"]}/autoSimilar.json")
            end
            pageList = JSON.parse(site.data['page_list'])
            autoSimilar = autoSimilar_json
            autoSimilar.each do |pageObj|
                pageList.each do |page|
                    if page["permalink"] == pageObj["permalink"]
                        similarPages = []
                        pageObj["similarFiles"].each do |similarPage|
                            similarPageObj =  Globals.find_object_by_multiple_key_value(
                                JSON.parse(site.data['page_list']), 
                                {"permalink" => similarPage}
                            ) || {}
                            
                            if (similarPageObj != {})
                                similarPages << {
                                    "permalink" => similarPageObj["permalink"],
                                    "title" => similarPageObj["title"]
                                }
                                
                            end
                        end
                        page["similarByContent"] = similarPages
                        break
                    end
                end
            end
            site.data['page_list'] = pageList.to_json

        end
    end

end  