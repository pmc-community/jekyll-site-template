# _plugins/page_list_generator.rb
require_relative "../../tools/modules/globals"

module Jekyll

  class CategoryListGenerator < Generator
    priority :high

    attr_accessor :allCats

    def initialize(allCats)
      @allCats = []
    end

    def generate(site)
      Globals.putsColText(Globals::PURPLE,"Generating list of categories ...")
      extract_categories(Globals::DOCS_DIR)
      site.data["category_list"] = []
      # storing the list of categories in site.data and not in site.config which is used for static site configuration
      site.data["category_list"] = @allCats.flatten.uniq.sort.to_json
      Globals.moveUpOneLine
      Globals.clearLine
      Globals.putsColText(Globals::PURPLE,"Generating list of categories ... done (#{JSON.parse(site.data["category_list"]).size} categories)")
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
          @allCats << categories.flatten.uniq.sort
        end
      end
      #return categories.flatten.uniq.sort
    end

    def valid_front_matter?(file_path)
      content = File.read(file_path)
      !!content.match(/^\s*---\s*\n.*?\n?(\s*---\s*$\n?)/m)
    end
  end

  class CategoryDetailsGenerator < Generator
    priority :normal # should be lower than CategoryListGenerator above
    def generate(site)
      Globals.putsColText(Globals::PURPLE,"Generating categories details ...")
      categoriesDetails = getCategoriesDetails(site.data["category_list"], site.data['page_list'])
      site.data["categories_details"] = categoriesDetails

      # order the categories based on the number of pages (DESC) and alphabetical for the same value of numPages
      #orderedCategories = categoriesDetails.sort_by { |category, details| [-details["numPages"], category] }.map(&:first) if categoriesDetails
      orderedCategories = categoriesDetails.sort_by do |category, details|
        if details && details.key?("numPages")
          [-details["numPages"], category]
        else
          # Handle cases where details or numPages is nil (optional)
          [0, category]  # Example: assign a default value (0) for missing pages
        end
      end.map(&:first) if categoriesDetails
      site.data["ordered_categories"] = orderedCategories.flatten.uniq.to_json
      Globals.moveUpOneLine
      Globals.clearLine
      Globals.putsColText(Globals::PURPLE,"Generating categories details ... done")
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
            pageObj["lastUpdate"] = DateTime.parse(page["lastUpdate"]).strftime("%d-%b-%Y")
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
