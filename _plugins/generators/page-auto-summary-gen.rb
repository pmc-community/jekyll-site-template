require_relative "../../tools/modules/globals"
require_relative "../../tools/modules/file-utilities"
require 'open3'

module Jekyll

    class PageAutoSummary < Generator
      safe true
      priority :normal # must be after pageList gnerator from _plugins/generators/pages-gen.rb
  
        def generate(site)

            # GENERATE SUMMARIES
            if (site.data['buildConfig']["pyEnable"] && site.data['buildConfig']["pyPageSummary"]["allInOneStep"])
                
                modified_files = FileUtilities.read_json_file("#{site.data['buildConfig']["rawContentFolder"]}/modified_files.json")["files"]
                return if !modified_files
                if (modified_files.length == 0)
                    Globals.clearLine
                    Globals.putsColText(Globals::PURPLE,"Generating summaries ... nothing to do! (no content changes)")
                    
                else
                    Globals.clearLine
                    Globals.putsColText(Globals::PURPLE,"Generating summaries ... for #{modified_files.length} pages")
                    # SUMMARIES
                    Globals.show_spinner do
                        json_input = { "pageList" => site.data['page_list'] }
                        python_script = site.data["buildConfig"]["pyPageSummary"]["allInOneStepScript"]

                        page_summary_callback = Proc.new do |python_script_response|
                            permalink = python_script_response["payload"]["payload"]["permalink"]
                            pageNo = python_script_response["outputNo"]
                            Globals.clearLine
                            Globals.printColText( Globals::GREEN, "- PERMALINK: #{permalink} ... done (#{pageNo})")
                        end

                        # the py script generates doc-raw-contents/autoSummary.json
                        # this is further processed by the ruby script and page_list site variable is updated
                        Globals.run_python_script(site, python_script, json_input, page_summary_callback)
                    end
                
                    Globals.clearLine
                end
            end

            # UPDATE PAGE LIST
            autoSummaries = [];
            summary_path = "#{site.data["buildConfig"]["rawContentFolder"]}/autoSummary.json"
            return if !File.exist?(summary_path)
            summaries = File.read(summary_path)
            begin
                summaries_json = JSON.parse(summaries)
            rescue
                Globals.putsColText(Globals::RED, "- Cannot parse #{site.data["buildConfig"]["rawContentFolder"]}/autoSummary.json")
            end
            pageList = JSON.parse(site.data['page_list'])
            autoSummaries = summaries_json["summaries"]
            autoSummaries.each do |summary|
                pageList.each do |page|
                    if page["permalink"] == summary["permalink"]
                        page["autoSummary"] = summary["summary"]
                        break
                    end
                end
            end
            site.data['page_list'] = pageList.to_json

        end
    end

end  