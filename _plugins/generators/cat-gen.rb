# _plugins/page_list_generator.rb
require_relative "../../tools/modules/globals"

module Jekyll

  class CategoryListGenerator < Generator
    priority :normal
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

end
