require_relative 'globals'
require 'find'
require 'jekyll'
require 'fileutils'

module FileUtilities

    def self.clear_and_create_empty_folder (folder_path)             
        if Dir.exist?(folder_path)
          FileUtils.rm_rf(Dir.glob("#{folder_path}/*"))
        else
          FileUtils.mkdir_p(folder_path)
        end
    end

    def self.create_folder_if_not_exist (folder_path)             
        if !Dir.exist?(folder_path)
          FileUtils.mkdir_p(folder_path)
        end
    end

    def self.clear_or_create_file(file_path)
        File.open(file_path, "w") { |f| }
    end
      
    def self.write_file(file_path, content)
        if File.exist?(file_path)
            File.open(file_path, "a") { |file| file.write(content) }
        else
            puts "OUPS!!! Can't find file #{file_path} ..."
        end
    end

    def self.overwrite_file(file_path, content)
        clear_or_create_file(file_path)
        write_file(file_path, content)
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

    def self.parse_front_matter(content)
        if content =~ /\A(---\s*\n.*?\n?)^((---|\.\.\.)\s*$\n?)/m
          front_matter = YAML.safe_load($1)
          content = $'
          [front_matter, content]
        else
          [nil, content]
        end
    end

    def self.extract_main_content(site, rendered_content)
        doc = Nokogiri::HTML(rendered_content)
        tags_to_remove = site.data['buildConfig']["tagsToRemoveOnDryRender"]
        tags_to_remove.each do |tag|
            doc.search(tag).remove
          end
        main_content = doc.css('main').text
        main_content.strip
    end

    def self.render_jekyll_page(site, file_path, front_matter, content_body)
        # Create a temporary page to render
        page = Jekyll::PageWithoutAFile.new(site, site.source, File.dirname(file_path), File.basename(file_path))
        page.content = content_body
        page.data = front_matter
  
        # Determine the layout to use (default to 'default' layout if not specified)
        layout_name = front_matter['layout'] || 'default'
  
        # Find the layout
        layout = find_layout(site, layout_name)
        raise "Layout '#{layout_name}' not found." unless layout
  
        # Assign the layout to the page
        page.data['layout'] = layout_name

        # Render the page with the assigned layout
        page.render(site.layouts, site.site_payload)
        extract_main_content(site, page.output)
    end
  
    # Method to find a layout (including from themes)
    def self.find_layout(site, layout_name)
        # First, check if the layout exists in the site's layouts
        layout = site.layouts[layout_name]

        # If not found in site layouts, check in theme layouts
        if layout.nil? && site.theme&.layouts
            layout = site.theme.layouts[layout_name]
        end
        layout
    end

    def self.valid_front_matter?(content)
        content =~ /\A---\s*\n.*?\n---\s*\n/m
    end

    def self.file_raw_content_needs_update(site, current_raw_content, file_front_matter)
        raw_content_file_path = "#{site.data["buildConfig"]["rawContentFolder"]}/#{file_front_matter["permalink"].gsub("/", "_")}.txt"
        return true if !File.exist?(raw_content_file_path)
        saved_raw_content = File.read(raw_content_file_path)
        return true if saved_raw_content != current_raw_content
        return false
    end

end