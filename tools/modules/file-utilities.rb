require_relative 'globals'
require 'find'
require 'jekyll'
require 'fileutils'
require 'liquid'

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
                unless File.exist?("#{Globals::ROOT_DIR}/_includes/#{file_path}")
                    result = "#{source}: Missing include: #{file_path}"
                    Globals.putsColText(Globals::YELLOW, " - #{result}") if !silent
                    write_file("#{Globals::ROOT_DIR}/tools/checks/broken-includes.log", "#{result}\n")
                    brokeIncludes += 1
                end
            else
                unless File.exist?("#{Globals::ROOT_DIR}/_includes/#{file_path}")
                    fileName = File.basename("#{Globals::ROOT_DIR}/_includes/#{file_path}")
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
            fileContent = File.open(path, "rb", &:read).encode('UTF-8', invalid: :replace, undef: :replace)
            front_matter, _ = fileContent.split('---')[1..2]
            page_data = front_matter ? YAML.safe_load(front_matter) : ""
            return path if page_data && page_data['permalink'] == permalink
        end
       
    end

    def self.parse_front_matter(content)
        content.force_encoding('UTF-8').encode!('UTF-8', invalid: :replace, undef: :replace)
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

    def self.render_liquid_string(site, liquid_string, additional_context = {})
    # Build the context similar to what Jekyll would provide
    registers = { site: site, page: {} }

    context = Liquid::Context.new(
        [site.site_payload, additional_context],
        {}, # assigns
        registers
    )

    template = Liquid::Template.parse(liquid_string)
    template.render!(context)
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
        saved_raw_content.force_encoding('UTF-8').encode!('UTF-8', invalid: :replace, undef: :replace)
        return true if saved_raw_content != current_raw_content
        return false
    end

    def self.generate_raw_content(site)
        Globals.show_spinner do
            doc_contents_dir = File.join(site.source, Globals::DOCS_ROOT)
            FileUtilities.create_folder_if_not_exist (site.data['buildConfig']["rawContentFolder"])
            Globals.newLine
            numPages = 0
            modified_files = []
            modified_files_object = {
                "files" => modified_files
            }

            FileUtilities.overwrite_file(
                "#{site.data["buildConfig"]["rawContentFolder"]}/modified_files.json", 
                modified_files_object.to_json
            )

            Dir.glob(File.join(doc_contents_dir, '**', '*.{md, html}')).each do |file_path|
                front_matter, content = FileUtilities.parse_front_matter(File.read(file_path)) || {}
                next if front_matter == {}
                next if front_matter.nil? || front_matter.empty?
                next if content.nil? || content.empty?
                next if front_matter["permalink"].nil? || front_matter["permalink"].empty?
                next if front_matter["title"].nil? || front_matter["title"].empty?
                page = Globals.find_object_by_multiple_key_value(JSON.parse(site.data['page_list']), {"permalink" => front_matter["permalink"]}) || {}
                next if page.nil? || page == {}
                Globals.moveUpOneLine
                Globals.putsColText(Globals::PURPLE,"Generating raw content ... #{front_matter["permalink"]}")
                Globals.show_spinner do
                    rendered_content = FileUtilities.render_jekyll_page(site, file_path, front_matter, content)
                    text_content = Globals.text_pre_process(Nokogiri::HTML(rendered_content).text)
                    if (FileUtilities.file_raw_content_needs_update(site, text_content, front_matter ))
                        
                        FileUtilities.overwrite_file(
                            "#{site.data["buildConfig"]["rawContentFolder"]}/#{front_matter["permalink"].gsub("/", "_")}.txt", 
                            text_content
                        )
                        modified_files << "#{site.data["buildConfig"]["rawContentFolder"]}/#{front_matter["permalink"].gsub("/", "_")}.txt"
                        modified_files_object = {
                            "files" => modified_files
                        }

                        FileUtilities.overwrite_file(
                            "#{site.data["buildConfig"]["rawContentFolder"]}/modified_files.json",
                            JSON.pretty_generate(modified_files_object)
                        )
                        numPages +=1
                    end
                end
                Globals.clearLine # clear whatever spinner character is still visible   
            end
            Globals.moveUpOneLine
            Globals.clearLine
            if (numPages > 0 )
                Globals.putsColText(Globals::PURPLE,"Generating raw content ... done (#{numPages} page(s) changed)")
            else
                Globals.putsColText(Globals::PURPLE,"Generating raw content ... nothing to do! (no content changes)")
            end
        end
    end

    def self.read_json_file(file_path)
        begin
          file_contents = File.read(file_path)
          data = JSON.parse(file_contents)
          return data
        rescue Errno::ENOENT
          puts "File not found: #{file_path}"
          return nil
        rescue JSON::ParserError
          puts "Error parsing JSON file: #{file_path}"
          return nil
        end
    end
      
    # Function to extract the included file paths from content
    def self.extract_included_paths(file_path, content)
        included_paths = []

        pattern = /
            \{\%\s*                                  
            (ExternalSiteContent|ExternalSiteContentMM)\s*  
            \{                                       
            .*?                                      
            "file_path"\s*:\s*"([^"]+)"              
            .*?                                      
            \}\s*\%\}                                
        /mx                                        
        matches = content.scan(pattern)
        included_paths = matches.map { |match| match[1] }
      
        pattern = /
            \{\%\s*                              
            (include_relative|include)\s*         
            (?:"([^"]+)"|'([^']+)'|([^"'\s]+))   
            \s*\%\}                              
        /x                                                 
          
        matches = content.scan(pattern)
        file_paths = matches.map do |match|
            match[1] || match[2] || match[3]  # Prioritize capturing groups based on quote presence
        end.compact.uniq || []

        base_path = "#{Globals::DOCS_DIR}/"
        relative_path = "#{File.dirname(file_path.sub(base_path, ''))}/"
        # create full relative paths since {% include %} works only with relative path to the current file and not with relative path to the root dir 
        file_paths.map! { |value| relative_path + value }
        file_paths.map! { |element| element.sub(/\A\.\.?\//, '') } # remove ./ or ../ from paths

        #puts "#{file_path} #{file_paths}"
        (included_paths | file_paths).compact.uniq
    end

    def self.generate_doc_dependencies(site)
        Globals.show_spinner do
            Globals.putsColText(Globals::PURPLE,"Generating dependencies ...")
            doc_contents_dir = File.join(site.source, Globals::DOCS_ROOT)
            relationships = Hash.new { |hash, key| hash[key] = [] }
            numPages = 0
            Dir.glob("#{doc_contents_dir}/**/*.md").each do |file_path|
                front_matter, content = parse_front_matter(File.read(file_path))
                next unless front_matter
                permalink = front_matter["permalink"]
                next unless permalink
                page = Globals.find_object_by_multiple_key_value(JSON.parse(site.data['page_list']), {"permalink" => permalink}) || {}
                next unless page != {}
                
                Globals.moveUpOneLine
                Globals.putsColText(Globals::PURPLE,"Generating dependencies ... #{permalink}")
                included_paths = extract_included_paths(file_path, content)

                included_paths.each do |included_path|
                    # Convert the included_path to its permalink
                    included_file_path = File.join(doc_contents_dir, included_path)
                    included_front_matter, _ = parse_front_matter(File.read(included_file_path)) if File.exist?(included_file_path)
                    next unless included_front_matter
                    included_permalink = included_front_matter["permalink"]
                    next unless included_permalink
                    included_page = Globals.find_object_by_multiple_key_value(JSON.parse(site.data['page_list']), {"permalink" => permalink}) || {}
                    next unless included_page != {}

                    relationships[included_permalink] << permalink
                end
                numPages +=1
            end

            # Convert the relationships hash to the desired JSON array format
            result = relationships.map do |source_permalink, target_permalinks|
                { permalink: source_permalink, imported_by: target_permalinks }
            end
            #puts JSON.pretty_generate(result)
            FileUtilities.overwrite_file(
                "#{site.data["buildConfig"]["rawContentFolder"]}/dependencies.json", 
                JSON.pretty_generate(result)
            )
            Globals.moveUpOneLine
            Globals.clearLine
            Globals.putsColText(Globals::PURPLE,"Generating dependencies ... done (#{numPages} pages)")
        end
    end

    def self.get_real_files_from_raw_content_files(file_paths)
        file_paths.map do |path|
          file_name = File.basename(path, ".*") 
          transformed_name = file_name.gsub('_', '/')
          getFileFromPermalink(Globals::DOCS_DIR, transformed_name)
        end
    end

    def self.get_real_file_from_raw_content_file(file_path)
        file_name = File.basename(file_path, ".*") 
        transformed_name = file_name.gsub('_', '/')
        getFileFromPermalink(Globals::DOCS_DIR, transformed_name)
    end

    def self.generate_folder_structure(root_path)
        root_path = File.expand_path(root_path.strip)
        return "Error: Directory not found - #{root_path}" unless Dir.exist?(root_path)

        lines = []
        lines << "📁 #{File.basename(root_path)}/"

        traverse = lambda do |dir, prefix|
            entries = Dir.children(dir).sort
            entries.each_with_index do |entry, index|
            path = File.join(dir, entry)
            is_last = index == entries.length - 1
            connector = is_last ? "└── " : "├── "
            icon = File.directory?(path) ? "📁" : "📄"
            lines << "#{prefix}#{connector}#{icon} #{entry}"

            if File.directory?(path)
                new_prefix = prefix + (is_last ? "    " : "│   ")
                traverse.call(path, new_prefix)
            end
            end
        end

        traverse.call(root_path, "")
         "```\n" + lines.join("\n") + "\n```"
    end

    def self.git_last_commit_time(file_path)
        time_str = `git log -1 --format="%ct" -- "#{file_path}"`.strip
        time_str.empty? ? nil : Time.at(time_str.to_i)
    end

end