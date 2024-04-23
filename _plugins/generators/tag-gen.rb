# _plugins/page_list_generator.rb
require_relative "../../tools/modules/globals"

module Jekyll

  class TagListGenerator < Generator
    priority :normal
    def generate(site)
      tags = extract_tags(Globals::DOCS_DIR)
      site.data["tag_list"] = tags.to_json
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
        end
      end
      return tags.flatten.uniq
    end

    def valid_front_matter?(file_path)
      content = File.read(file_path)
      !!content.match(/^\s*---\s*\n.*?\n?(\s*---\s*$\n?)/m)
    end
  end

end
