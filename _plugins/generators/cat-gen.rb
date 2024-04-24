# _plugins/page_list_generator.rb
require_relative "../../tools/modules/globals"

module Jekyll

  class CategoryListGenerator < Generator
    priority :high
    def generate(site)
      categories = extract_categories(Globals::DOCS_DIR)

      # storing the list of categories in site.data and not in site.config which is used for static site configuration
      site.data["category_list"] = categories.to_json
    end

    private

    def extract_categories(dir)
      categories = []
      Dir.foreach(dir) do |entry|
        next if entry == "." || entry == ".."
        full_path = File.join(dir, entry)
        if File.directory?(full_path)
          extract_categories(full_path)
        elsif (File.extname(entry) == ".md" || File.extname(entry) == ".html") && valid_front_matter?(full_path)
          front_matter = YAML.load_file(full_path)
          categories <<  front_matter['categories'] if front_matter && front_matter['categories']
        end
      end
      return categories.flatten.uniq
    end

    def valid_front_matter?(file_path)
      content = File.read(file_path)
      !!content.match(/^\s*---\s*\n.*?\n?(\s*---\s*$\n?)/m)
    end
  end

  class CategoryDetailsGenerator < Generator
    priority :normal
    def generate(site)
      categoriesDetails = getCategoriesDetails(site.data["category_list"], site.data['page_list'])
      #puts categoriesDetails
      site.data["categories_details"] = categoriesDetails
    end

    private

    def getCategoriesDetails(catList, pageList)
      #puts JSON.parse(catList).class
      #puts JSON.parse(pageList).class
      cList = JSON.parse(catList)
      pList = JSON.parse(pageList)
      catPages = {}
      cList.each do |category|
        catPagesNum = 0
        catPage = {"pages"=>[]}
        pList.each do |page|
          pageObj = {}
          pageArr = []
          if page["categories"].any? { |element| element == category }
            catPagesNum +=1
            catPage["numPages"] = catPagesNum
            pageObj["title"] = page["title"]
            pageObj["permalink"] = page["permalink"]
            pageArr = catPage["pages"]
            pageArr << pageObj if pageObj
            catPage["pages"] = pageArr
          end
        end
        catPages[category] = catPage if catPage != {"pages":[]}
      end
      return catPages

    end

  end

end
