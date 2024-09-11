require_relative "../../tools/modules/globals"

module Jekyll

  class TagListGenerator < Generator
    priority :high  
    
    attr_accessor :allTags

    def initialize(allTags)
      @allTags = []
    end

    def generate(site)
      Globals.putsColText(Globals::PURPLE,"Generating list of tags ...")
      extract_tags(Globals::DOCS_DIR)
      site.data["tag_list"] = []
      site.data["tag_list"] = @allTags.flatten.uniq.sort.to_json
      Globals.moveUpOneLine
      Globals.clearLine
      Globals.putsColText(Globals::PURPLE,"Generating list of tags ... done (#{JSON.parse(site.data["tag_list"]).size} tags)")

    end

    private
    
    def extract_tags(dir)
      tags = []
      Dir.foreach(dir) do |entry|
        next if entry == "." || entry == ".."
        full_path = File.join(dir, entry)
        if File.directory?(full_path)
          extract_tags(full_path)
        elsif (File.extname(entry) == ".md" || File.extname(entry) == ".html") && valid_front_matter?(full_path)
          front_matter = YAML.load_file(full_path)
          tags <<  front_matter['tags'] if front_matter && front_matter['tags']
          @allTags << tags.flatten.uniq.sort
        end
      end
      #return tags.flatten.uniq.sort
    end

    def valid_front_matter?(file_path)
      content = File.read(file_path)
      !!content.match(/^\s*---\s*\n.*?\n?(\s*---\s*$\n?)/m)
    end
  end

  class TagDetailsGenerator < Generator
    priority :normal
    def generate(site)
      Globals.putsColText(Globals::PURPLE,"Generating tags details ...")
      tagsDetails = getTagsDetails(site.data["tag_list"], site.data['page_list'])
      #puts categoriesDetails
      site.data["tags_details"] = tagsDetails
      Globals.moveUpOneLine
      Globals.clearLine
      Globals.putsColText(Globals::PURPLE,"Generating tags details ... done")
    end

    private

    def getTagsDetails(tagList, pageList)
      tList = JSON.parse(tagList)
      pList = JSON.parse(pageList)
      tagPages = {}
      tList.each do |tag|
        tagPagesNum = 0
        tagPage = {"pages"=>[]}
        pList.each do |page|
          pageObj = {}
          pageArr = []
          if (page["tags"])
            if page["tags"].any? { |element| element == tag }
              tagPagesNum +=1
              tagPage["numPages"] = tagPagesNum
              pageObj["title"] = page["title"]
              pageObj["permalink"] = page["permalink"]
              pageObj["lastUpdate"] = DateTime.parse(page["lastUpdate"]).strftime("%d-%b-%Y")
              pageArr = tagPage["pages"]
              pageArr << pageObj if pageObj
              tagPage["pages"] = pageArr
            end
          end
        end
        tagPages[tag] = tagPage if tagPage != {"pages":[]}
      end
      return tagPages

    end

  end

end
