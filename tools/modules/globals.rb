require 'thread'
require 'yaml'
require 'dotenv'
require 'securerandom'
require 'shellwords'
require 'set'

Dotenv.load

module Globals
    RESET = "\e[0m"
    WHITE = "\e[37m"
    YELLOW = "\e[33m"
    GREEN = "\e\n[32m"
    PURPLE = "\e[35m"
    RED = "\e[31m"
    BACK_1_ROW = "\e[1A"
    ARROW_RIGHT = "\u2192"

    # Spinner character sequence
    CHARS = %w(- \\ | /)
    BLANK_CHARS = ['']

    # removing last 15 chars '/tools/modules/'
    ROOT_DIR = __dir__[0..-15]
    DOCS_ROOT = "doc-contents"
    DOCS_DIR = "#{ROOT_DIR}/#{DOCS_ROOT}"
    RAW_DOCS_ROOT = "doc-raw-contents"
    RAW_DOCS_DIR = "#{ROOT_DIR}/#{RAW_DOCS_ROOT}"
    
    # config files
    CONFIG_YML = "#{ROOT_DIR}/_config.yml"
    SITECONFIG_YML = "#{ROOT_DIR}/_data/siteConfig.yml"
    PAGECONFIG_YML = "#{ROOT_DIR}/_data/pageConfig.yml"
    LOG_FILE = "#{ROOT_DIR}/tools/checks/check.log"
    
    def self.putsColText(col, text)
        puts col + text + RESET
    end

    def self.clearLine()
        #print "\e[2K"
        print "\e[2K\e[G"

    end

    def self.moveUpOneLine()
        print "\e[1A"
    end

    def self.newLine()
        puts ""
    end

    def self.clearConsole()
        puts "\e[H\e[2J"
    end

    def self.removeFirstAndLastSlash(str)
        if (str[0] == '/')
            str = str[1..-1]
        end
        if str[-1] == '/'
            str = str[0..-2]
        end
        return str
    end

    def self.removeSlashesFromArrayElements(ar)
        # ignore nil elements, otherwise error will be raised
        modified_ar = ar.compact.map do |element|
            # Modify the element here
            modified_element = removeFirstAndLastSlash(element)
            # Return the modified element
            modified_element
        end
        return modified_ar
    end

    def self.show_spinner(interval = 0.1)
    # Create a new thread for the spinner
    spinner_thread = Thread.new do
        loop do
            if (ENV["CONSOLE_BLANK_SPINNER_CHARS"] == "true")
                CHARS.each do |char|
                    print char
                    sleep interval
                    print "\b"
                end
            else
                BLANK_CHARS.each do |char|
                    print char
                    sleep interval
                    print "\b"
                end
            end
        end
    end

    # Allow the main thread to continue execution
    yield

    # Stop the spinner thread when done
    spinner_thread.kill
    end

    def self.match_liquid_variable?(string)
        # Pattern with optional whitespace at the beginning and end
        pattern = /\A\s*\{\{ site\.(?:\w+\.)*\w+ \}\}(\s*$)?/
        string =~ pattern
    end

    def self.find_value_in_yaml(yaml_file, path, excludePath)
        config = YAML.load_file(yaml_file)
        keys = path.sub(excludePath, '').split(".")
        value = "not_found"
        keys.reduce(config) do |hash, key|
          value = hash.is_a?(Hash)? hash[key] : "not_found:#{yaml_file}"
        end
        return value
    end

    def self.getArrayDuplicates(ar)
        occurrences = Hash.new(0)
        ar.each { |element| occurrences[element] += 1 }
        duplicates = occurrences.select { |_, count| count > 1 }.keys
        return duplicates
    end

    def self.removeFrontMatter(content)
        return content.gsub(/^---.*?---\n/m, '')
    end

    def self.find_object_by_key_value(objArray, key, value)
        objArray.find { |item| item["#{key}"] == value }
    end

    def self.find_object_by_multiple_key_value(objArray, criteria)
        objArray.find do |obj|
            criteria.all? { |key, value| obj[key] == value }
        end
    end

    def self.text_pre_process(text)
        
        text = text.downcase # everyhing to lowercase
        text = text
            .gsub(/\{\{([^}]*)\}\}/, "")
            .gsub(/\{\{([^}]*)/, "")
            .gsub(/([^}]*)\}\}/, "")    # remove all not rendered tags
        text = text.gsub(/\s\s+/, ". ") # better mark sentences, replace multiple spaces with '. '
        text = text.gsub(/\n\s+/, "")
        text = text.gsub(/\.{2,}/, '.') # replace multiple dots with single dot

        text = text.delete("\n\r\t")

        text.strip
    end

    def self.run_python_script(site, python_script, script_parameter, callback)
        json_arg = Shellwords.escape(script_parameter.to_json)
        python_script_with_param = "#{site.data["buildConfig"]["pyLaunch"]} #{python_script} #{json_arg}"

        outputNo = 0
        Open3.popen3(python_script_with_param) do |stdin, stdout, stderr, wait_thr|
            stdout.each do |line|
                begin
                    response = JSON.parse(line)
                    outputNo += 1

                    # we use stderr to print to console some things from the py scripts
                    # that's because stdout is used to pass to ruby the results of the py scripts
                    # here is the code to actually output to console the messages from the py scripts
                    # HEADS UP!!!
                    # better to suppress warnings to be shown by py scripts and leave only errors
                    # otherwise the console may be "invaded" by warnings raised by any py script on traceback
                    stderr.each_line do |line|
                        puts "#{line}"
                    end

                    callback.call({
                        "outputNo" => outputNo,
                        "payload" => response
                    })
                rescue JSON::ParserError => e
                    puts "Failed to parse JSON returned by #{python_script}: #{e.message}"
                end
            end

            exit_status = wait_thr.value
            unless exit_status.success?
                puts "Error running #{python_script}: #{stderr.read}"
            end
        end
    end

    def self.find_object_key_value(objects, criteria, return_key)
        found_object = find_object_by_multiple_key_value(objects, criteria)        
        found_object ? found_object[return_key] : nil
    end

    def self.uuid_gen()
        SecureRandom.uuid.gsub('-', '')[0, 10]    
    end

    def self.collect_with_descendants(original)
        result = []
        visited = Set.new

        # Sort by path depth (shallowest paths first)
        sorted = original.sort_by { |path| path.count('/') }

        define_singleton_method(:add_with_descendants) do |item|
            return if visited.include?(item)

            visited << item
            result << item

            # Find direct descendants (start with item and are longer)
            sorted.each do |candidate|
            next if visited.include?(candidate)
            if candidate.start_with?(item) && candidate != item
                add_with_descendants(candidate)
            end
            end
        end

        sorted.each do |item|
            add_with_descendants(item)
        end

        result
    end
    
    def self.extract_directory_from_path(path)
        # Remove query parameters and fragment identifiers
        clean_path = path.split(/[?#]/).first
        File.dirname(clean_path)
    end

end