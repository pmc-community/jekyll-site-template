require_relative 'globals'
#require_relative 'file-utilities'
require 'find'

module FileUtilities

    def self.clear_or_create_file(file_path)
        File.open(file_path, "w") { |f| }
    end
      
    def self.write_file(file_path, content)
        if File.exist?(file_path)
            File.open(file_path, "a") { |file| file.write(content) }
        else
            puts "OUPS!!! Can't find file checks/broken-includes.txt ..."
        end
    end

    # Function to check file existence (including relative paths)
    def self.file_exists?(file_path, base_dir)
        full_path = File.join(base_dir, file_path)
        File.exist?(full_path)
    end

    # Function to check and report missing includes
    def self.check_includes(source, content, base_dir, silent)
        result = ""
        brokeIncludes = 0
        content.scan(/\{% include(?:_relative)? (.*) %}/) do |match|
            file_path =match[0].split(" ", 0)[0]
            file_extension = File.extname(file_path)
            if (file_extension != ".liquid")
                unless file_exists?(file_path, base_dir)
                    result = "#{source}: Missing include: #{file_path} (in #{base_dir})"
                    Globals.putsColText(Globals::YELLOW, " - #{result}") if !silent
                    write_file("#{Globals::ROOT_DIR}/tools/checks/broken-includes.log", "#{result}\n")
                    brokeIncludes += 1
                end
            else
                unless File.exist?("#{Globals::ROOT_DIR}/_includes/"+file_path)
                    fileName = File.basename(("#{Globals::ROOT_DIR}/_includes/"+file_path))
                    result = "#{source}: Missing include: #{fileName} (in #{Globals::ROOT_DIR}/_includes/#{file_path})"
                    Globals.putsColText(Globals::YELLOW, " - #{result}") if !silent
                    write_file("#{Globals::ROOT_DIR}/tools/checks/broken-includes.log", "#{result}\n")
                    brokeIncludes += 1
                end
            end
        end
        return brokeIncludes
    end

    def self.getFileFromPermalink(docsDir, permalink)
        Find.find(docsDir) do |path|
            next unless File.file?(path) && (path.end_with?('.html') || path.end_with?('.md'))
            front_matter, _ = File.read(path).split('---')[1..2]
            page_data = front_matter ? YAML.safe_load(front_matter) : ""
            return path if page_data && page_data['permalink'] == permalink
        end
       
    end
end