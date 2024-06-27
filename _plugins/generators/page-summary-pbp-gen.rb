require_relative "../../tools/modules/globals"
require_relative "../../tools/modules/file-utilities"
require 'open3'

module Jekyll

    class PageSummaryPageByPage < Generator
      safe true
      priority :normal
  
        def generate(site)
            if (site.data['buildConfig']["pyEnable"] && site.data['buildConfig']["pyPageSummary"]["pageByPage"])
                Globals.putsColText(Globals::PURPLE,"Generating page summaries (page-by-page) ...")
                doc_contents_dir = File.join(site.source, Globals::DOCS_ROOT)  
                Dir.glob(File.join(doc_contents_dir, '**', '*.{md, html}')).each do |file_path|
                    front_matter, content = FileUtilities.parse_front_matter(File.read(file_path)) || {}
                    next if front_matter == {}
                    next if front_matter.nil? || front_matter.empty?
                    next if content.nil? || content.empty?
                    next if front_matter["permalink"].nil? || front_matter["permalink"].empty?
                    next if front_matter["title"].nil? || front_matter["title"].empty?
                    page = Globals.find_object_by_multiple_key_value(JSON.parse(site.data['page_list']), {"permalink" => front_matter["permalink"]}) || {}
                    next if page.nil? || page == {}
                    Globals.putsColText(Globals::PURPLE,"Generating summary for #{front_matter["title"]}")
                    Globals.show_spinner do
                        rendered_content = FileUtilities.render_jekyll_page(site, file_path, front_matter, content)
                        text_content = Nokogiri::HTML(rendered_content).text
                        pyScriptParam = {
                            "text" => text_content
                        }
                        pyScriptParam_json = pyScriptParam.to_json
                        script_path = File.join(site.source, 'tools_py/page-summary', 'summary-pbp.py')
                        stdout, stderr, status = Open3.capture3('python3', script_path, pyScriptParam_json)
                        if status.success?
                            # Parse the JSON output from the Python script
                            result = JSON.parse(stdout)
                    
                            # Access and use the processed data from the Python script result
                            processed_data = result
                            print "\b" # clear whatever spinner character is visible
                            puts "Processed data: #{processed_data}"
                    
                            # You can use the processed_data in your Jekyll site generation
                            # For example, set it as a site variable
                            # site.config['processed_data'] = processed_data
                          else
                            puts "Error running Python script: #{stderr}"
                          end
                    end
                    print "\b" # clear whatever spinner character is visible
                    
                end

            end
            
        end
    end
end  