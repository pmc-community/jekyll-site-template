require 'thread'
require 'yaml'

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

    # removing last 15 chars '/tools/modules/'
    ROOT_DIR = __dir__[0..-15]
    DOCS_DIR = "#{ROOT_DIR}/doc-contents"
    DOCS_ROOT = "doc-contents"

    # config files
    CONFIG_YML = "#{ROOT_DIR}/_config.yml"
    SITECONFIG_YML = "#{ROOT_DIR}/_data/siteConfig.yml"
    PAGECONFIG_YML = "#{ROOT_DIR}/_data/pageConfig.yml"
    LOG_FILE = "#{ROOT_DIR}/tools/checks/check.log"
    
    def self.putsColText(col, text)
        puts col + text + RESET
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
        CHARS.each do |char|
            print char
            sleep interval
            print "\b"
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

end