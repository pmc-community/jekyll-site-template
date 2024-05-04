require_relative "../../tools/modules/globals"

module Jekyll
    class PageListGenerator < Generator
      safe true
      priority :high

      # HEADS UP!!!
      # THIS IS HOW TO GET ACCESS TO SITE CONFIG DATA FROM AN EXTERNAL FILE
      # THE FILE IS siteConfig.yml AND IS LOCATED IN _data FOLDER
      # content.index(site.data["siteConfig"]["marker404"])
  
      def generate(site)
        doc_contents_dir = File.join(site.source, Globals::DOCS_ROOT)
        documents = []
  
        Dir.glob(File.join(doc_contents_dir, '**', '*.{md,html}')).each do |file_path|
            
          # HEADS UP!!!
          # CONTENT MAY CONTAIN LIQUID TAGS WHICH ARE NOT YET REPLACED WITH VALUES 
          # AT THE TIME WHEN THIS PLUGIN RUNS, SO IS NOT ADVISABLE TO BE USED IN THE PLUGIN LOGIC 
          content = File.read(file_path)
          front_matter = {}
          if content =~ /^(---\s*\n.*?\n?)^(---\s*$\n?)/m
            front_matter = YAML.load(Regexp.last_match[1])
          end
  
          title = front_matter['title']
          permalink = front_matter['permalink']
          categories = front_matter['categories']
          tags = front_matter['tags']
          excerpt = front_matter['excerpt']
          lastUpdate = File.mtime(file_path)
          createTime = File.birthtime(file_path)
  
          document_data = {
            'title' => title,
            'permalink' => permalink,
            'categories' => categories || [],
            'tags' => tags || [],
            'excerpt' => excerpt || "",
            'lastUpdate' => lastUpdate || "",
            'createTime' => createTime || ""
          } 
          
          documents << document_data if front_matter != {} && !file_path.index("404") && front_matter['layout'] && front_matter['layout'] == "page"
        end  
        site.data['page_list'] = documents.to_json
      end

    end
    
  end
  