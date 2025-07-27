require_relative "../../tools/modules/globals"
require_relative "../../tools/modules/file-utilities"
require_relative "../../tools/modules/extContent-utilities"
require 'nokogiri'
require 'tf-idf-similarity'
require 'matrix'
require 'date'

module Jekyll

  class PageListGenerator < Generator
    safe true
    priority :highest # should be the first

    def generate(site)

      # we generate the list of pages in a separate file because we need to preserve the documents timestamps
      # if we do not do so, timestamps will be replaced when deploying to github or netlily or similar
      # we generate the list of pages only if there are changes in the content from doc-contents
      
      page_list_path = "#{site.data["buildConfig"]["rawContentFolder"]}/page_list.json"
      current_page_list  = File.exist?(page_list_path) ? FileUtilities.read_json_file(page_list_path) : []
      doc_contents_dir = File.join(site.source, Globals::DOCS_ROOT)
      doc_raw_content_dir = Globals::RAW_DOCS_ROOT
      doc_list = []
      documents = []

      # force rebuilding page_list.json to capture potential changes of the information in the page front matter
      # (such as tags, cats, etc.)
      Globals.putsColText(Globals::PURPLE,"Force page list re-build ...")
      if (File.exist?(page_list_path))
        File.delete(page_list_path)
      end
      Globals.moveUpOneLine
      Globals.clearLine
      Globals.putsColText(Globals::PURPLE,"Force page list re-build ... done")

      Dir.glob(File.join(doc_contents_dir, '**', '*.{md,html}')).each do |file_path|
          front_matter, _ = FileUtilities.parse_front_matter(File.read(file_path))
          doc_list << file_path if front_matter && !file_path.index("404") && front_matter['layout'] && front_matter['layout'] == "page"
          documents << front_matter if front_matter && !file_path.index("404") && front_matter['layout'] && front_matter['layout'] == "page"
      end

      # we create a temp  site.data['page_list'] to be able to generate the raw content
      # and to see if there are modifications of the content files
      site.data['page_list'] = documents.to_json
      # RAW CONTENT AND MODIFIED PAGES SINCE LAST BUILD
      FileUtilities.generate_raw_content(site)

      modified_files_path = "#{site.data["buildConfig"]["rawContentFolder"]}/modified_files.json"
      page_list_path = "#{site.data["buildConfig"]["rawContentFolder"]}/page_list.json"
      modified_files = File.exist?(modified_files_path)? FileUtilities.read_json_file(modified_files_path) : {"files" => []}

      if (modified_files["files"].length > 0 || !File.exist?(page_list_path))
        Globals.putsColText(Globals::PURPLE,"Generating list of pages ...")
      
        numPages = 0
        documents = []
        site.data['page_list'] = [].to_json

        doc_list.each do |file_path|
          lastUpdate = File.mtime(file_path)
          createTime = File.birthtime(file_path)
          front_matter, _ = FileUtilities.parse_front_matter(File.read(file_path))
          title = front_matter['title']
          permalink = front_matter['permalink']
          raw_file_name = "#{doc_raw_content_dir}/#{permalink.gsub('/', '_')}"
          categories = front_matter['categories']
          tags = front_matter['tags']
          excerpt = front_matter['excerpt']
          
          hasDynamicContent = ExtContentUtilities.checkCallsForExternalContent(file_path)
          parent = front_matter['parent'] ? front_matter['parent'] : ""
          document_data_raw = {
            'title' => title,
            'permalink' => permalink,
            'categories' => categories || [],
            'tags' => tags || [],
            'excerpt' => excerpt || "",
            'lastUpdate' => lastUpdate || "",
            'lastUpdateUTC' => lastUpdate.to_time.to_i || 0,
            'createTime' => createTime || "",
            'createTimeUTC' => createTime.to_time.to_i || 0,
            'relatedPages' => [],
            'autoSummary' => "",
            'similarByContent' => [],
            'readingTime' => 0,
            'hasDynamicContent' => hasDynamicContent,
            'parent' => parent
          }
          
          if (modified_files["files"].include?(raw_file_name) || current_page_list.length > 0)

            document_data = document_data_raw
          else
            page_data = Globals.find_object_by_multiple_key_value(current_page_list, {"permalink" => permalink}) || []
            if (page_data.length === 1) 
              document_data = page_data[0]
            else
              document_data = document_data_raw
            end
          end

          documents << document_data if front_matter != {} && !file_path.index("404") && front_matter['layout'] && front_matter['layout'] == "page"
          numPages += 1 if front_matter != {} && !file_path.index("404") && front_matter['layout'] && front_matter['layout'] == "page"
        end
        FileUtilities.overwrite_file(page_list_path, JSON.pretty_generate(documents))  
        Globals.moveUpOneLine
        Globals.clearLine
        Globals.putsColText(Globals::PURPLE,"Generating list of pages ... done (#{numPages} pages)")
      else
        Globals.putsColText(Globals::PURPLE,"Generating list of pages ... done (no content changes)")
      end

      site.data['page_list'] = FileUtilities.read_json_file(page_list_path).to_json
      
      permalinks = JSON.parse(site.data['page_list']).map { |obj| obj['permalink'] }
      #puts permalinks = permalinks
      #puts "------"
      permalinks = Globals.collect_with_descendants(permalinks)
      #puts permalinks
      
      # PAGE DEPENDENCIES
      FileUtilities.generate_doc_dependencies(site)
    end

  end
  
  class RelatedPagesGenerator < Generator
    safe true
    # Must be after PageKeyordsGenerator from _plugins/generators/page-keywords-gen.rb
    # Must be after tagsDetails (_plugins/generators/tag-gen.rb) and catDetails generators (_plugins/generators/cat-gen.rb)
    priority :low
  
    def generate(site)
      if site.data['buildConfig']["relatedPages"]["enable"]
        Globals.putsColText(Globals::PURPLE, "Generating related pages ...")
        numPages = 0
        Globals.show_spinner do
          @site = site
          front_matters = {}
  
          content_dir = Globals::DOCS_ROOT
          content_files = Dir.glob(File.join(site.source, content_dir, '**', '*.{md,html}'))
  
          # Process files in batches to limit memory usage
          content_files.each_slice(site.data['buildConfig']["relatedPages"]["batchSize"]) do |batch_files|
            documents = batch_files.map do |file_path|
              process_file(file_path, front_matters, site)
            end.compact
  
            model, similarity_matrix = build_similarity_model(documents)
  
            threads = []
            batch_files.each do |file_path|
              relative_path = Pathname.new(file_path).relative_path_from(Pathname.new(site.source)).to_s
              page_document = documents.find { |doc| doc.id == relative_path }
  
              next if page_document.nil?
  
              threads << Thread.new(file_path, page_document) do |path, doc|
                related_pages = find_related_pages(site, batch_files, path, model, doc, similarity_matrix, front_matters)
                add_related_pages(site, path, related_pages)
                numPages += 1
              end
            end
            threads.each(&:join) # Wait for all threads to finish
          end
          pageList = JSON.parse(site.data['page_list'])
          autoRelated_path = "#{site.data["buildConfig"]["rawContentFolder"]}/autoRelated.json"
          related = []
          pageRelatedObj = {}
          pageList.each do |page|
            pageRelatedObj = {
              "permalink" => page["permalink"],
              "related" => page["relatedPages"]
            }
            related << pageRelatedObj
          end
          FileUtilities.overwrite_file(autoRelated_path, JSON.pretty_generate(related))
        end
        Globals.moveUpOneLine
        Globals.clearLine
        Globals.putsColText(Globals::PURPLE, "Generating related pages ... done (#{numPages} pages)")
      end
    end
  
    def process_file(file_path, front_matters, site)
      content = File.read(file_path)
      relative_path = Pathname.new(file_path).relative_path_from(Pathname.new(site.source)).to_s
      front_matter, content = FileUtilities.parse_front_matter(content)
  
      return if front_matter.nil? || front_matter.empty?
  
      front_matters[relative_path] = front_matter
      rendered_content = FileUtilities.render_jekyll_page(site, file_path, front_matter, content)
      text_content = Nokogiri::HTML(rendered_content).text
      TfIdfSimilarity::Document.new(text_content, id: relative_path)
    end
  
    def build_similarity_model(documents)
      model = TfIdfSimilarity::TfIdfModel.new(documents)
      similarity_matrix = model.similarity_matrix
      [model, similarity_matrix]
    end
  
    def find_related_pages(site, content_files, page_path, model, page_document, similarity_matrix, front_matters)
      related_by_tags_categories_keywords = content_files.select do |other_file|
        next if other_file == page_path
  
        other_relative_path = Pathname.new(other_file).relative_path_from(Pathname.new(@site.source)).to_s
        other_page_front_matter = front_matters[other_relative_path]
        next if other_page_front_matter.nil?
  
        common_tags = (Array(front_matters[page_document.id]['tags']) & Array(other_page_front_matter['tags'])).size
        common_categories = (Array(front_matters[page_document.id]['categories']) & Array(other_page_front_matter['categories'])).size
        common_keywords = common_keywords_count(site, front_matters[page_document.id], other_page_front_matter)
  
        common_tags + common_categories + common_keywords >= 0
      end
  
      index = model.documents.index(page_document)
      related_by_text = model.documents.each_with_index.map { |doc, i| [doc, similarity_matrix[index, i]] }
      related_by_text.reject! { |doc, _| doc.id == page_path }
      related_by_text.sort_by! { |_, similarity| -similarity }
  
      related_pages = (related_by_tags_categories_keywords + related_by_text.map { |doc, _| content_files.find { |p| p == doc.id } }).uniq.compact
  
      related_pages = related_pages.compact.select do |related_page|
        other_relative_path = Pathname.new(related_page).relative_path_from(Pathname.new(@site.source)).to_s
        other_front_matter = front_matters[other_relative_path]
  
        score = calculate_score(site, front_matters, page_document, other_front_matter, model, other_relative_path, similarity_matrix)
        score < site.data['buildConfig']["relatedPages"]["scoreLimit"]
      end
  
      related_pages.sort_by do |related_page|
        other_relative_path = Pathname.new(related_page).relative_path_from(Pathname.new(@site.source)).to_s
        other_front_matter = front_matters[other_relative_path]
  
        calculate_score(site, front_matters, page_document, other_front_matter, model, other_relative_path, similarity_matrix)
      end
    end
  
    def calculate_score(site, front_matters, page_document, other_front_matter, model, other_relative_path, similarity_matrix)
      -(
        site.data['buildConfig']["relatedPages"]["tf_idf_weigths"]["keywords"] * common_keywords_score(site, front_matters[page_document.id], other_front_matter) +
        site.data['buildConfig']["relatedPages"]["tf_idf_weigths"]["tags"] * common_tags_score(front_matters[page_document.id], other_front_matter) +
        site.data['buildConfig']["relatedPages"]["tf_idf_weigths"]["cats"] * common_categories_score(front_matters[page_document.id], other_front_matter) +
        site.data['buildConfig']["relatedPages"]["tf_idf_weigths"]["content"] * text_similarity_score(model, page_document, other_relative_path, similarity_matrix)
      )
    end
  
    def common_tags_score(page_front_matter, other_page_front_matter)
      return 0.to_f if !page_front_matter['tags'] || page_front_matter['tags'].empty?
      return 0.to_f if !other_page_front_matter['tags'] || other_page_front_matter['tags'].empty?
  
      total_tags = page_front_matter['tags'].length + other_page_front_matter['tags'].length
      (Array(page_front_matter['tags']) & Array(other_page_front_matter['tags'])).size.to_f / total_tags.to_f
    end
  
    def common_keywords_score(site, page_front_matter, other_page_front_matter)
      page_keywords = extract_keywords(site, page_front_matter)
      other_page_keywords = extract_keywords(site, other_page_front_matter)
  
      total_keywords = page_keywords.length + other_page_keywords.length
      total_keywords.zero? ? 0.to_f : (page_keywords & other_page_keywords).size.to_f / total_keywords.to_f
    end
  
    def common_keywords_count(site, page_front_matter, other_page_front_matter)
      page_keywords = extract_keywords(site, page_front_matter)
      other_page_keywords = extract_keywords(site, other_page_front_matter)
  
      (page_keywords & other_page_keywords).size
    end
  
    def extract_keywords(site, front_matter)
      permalink = front_matter['permalink'] || ""
      page = permalink.empty? ? {} : Globals.find_object_by_multiple_key_value(JSON.parse(site.data['page_list']), { "permalink" => permalink })
      page.nil? || page.empty? || page['excerpt'].nil? ? [] : page['excerpt'].split(", ")
    end
  
    def common_categories_score(page_front_matter, other_page_front_matter)
      return 0.to_f if !page_front_matter['categories'] || page_front_matter['categories'].empty?
      return 0.to_f if !other_page_front_matter['categories'] || other_page_front_matter['categories'].empty?
  
      total_categories = page_front_matter['categories'].length + other_page_front_matter['categories'].length
      (Array(page_front_matter['categories']) & Array(other_page_front_matter['categories'])).size.to_f / total_categories.to_f
    end
  
    def text_similarity_score(model, page_document, related_page, similarity_matrix)
      index_page = model.documents.index(page_document)
      related_page_document = model.documents.find { |doc| doc.id == related_page }
      return 0 if index_page.nil? || related_page_document.nil?
  
      index_related_page = model.documents.index(related_page_document)
      return 0 if index_related_page.nil?
  
      similarity_matrix[index_page, index_related_page]
    end
  
    def add_related_pages(site, page_path, related_pages)
      front_matter, _ = FileUtilities.parse_front_matter(File.read(page_path)) || {}
      return if front_matter.empty?
      return if !front_matter["permalink"] || front_matter["permalink"].empty?
      return if related_pages.nil? || related_pages.empty?
    
      relPageNo = site.data['buildConfig']["relatedPages"]["relPagesNo"]
      related_pages = related_pages.length > relPageNo ? related_pages.take(relPageNo) : related_pages
      related_pages_permalinks = related_pages.map do |page|
        front_matter_rel_page, _ = FileUtilities.parse_front_matter(File.read(page)) || {}
        front_matter_rel_page["permalink"] || ""
      end
    
      related_pages_permalinks.delete(front_matter["permalink"]) if related_pages_permalinks
      related_pages_permalinks = related_pages_permalinks.uniq.compact if related_pages_permalinks
    
      related_pages_obj = related_pages_permalinks.map do |permalink|
        rel_page = Globals.find_object_by_multiple_key_value(JSON.parse(site.data['page_list']), { "permalink" => permalink }) || {}
        title = rel_page.empty? ? "" : rel_page["title"]
        { "title" => title, "permalink" => permalink } unless title.empty?
      end.compact if related_pages_permalinks
    
      pageList = JSON.parse(site.data['page_list'])
      pageList.each do |obj|
        if obj["permalink"] == front_matter["permalink"]
          obj["relatedPages"] = related_pages_obj || []
          break
        end
      end
    
      site.data['page_list'] = pageList.to_json
    end
    
  end

  class DeployDomain < Generator
    safe true
    priority :high # must after HSClientSettingsGenerator above

    def generate(site)      
        baseURL = ENV["DEPLOY_PROD_BASE_URL"]
        site.data['deploy_base_url'] = baseURL
    end

  end
  
end
  