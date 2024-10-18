require_relative 'globals'
require 'pp'

module ExtContentUtilities
    def self.findCallsForExternalContent(site_dir)
        function_call_regex = /getExternalContent\s*\(\s*(['"])(.*?)\1\s*,\s*(['"])(.*?)\3\s*,\s*(['"])(.*?)\5\s*,\s*(['"])(.*?)\7\s*,\s*(['"])(.*?)\9\s*,\s*(['"])(.*?)\11\s*,\s*(['"])(.*?)\13\s*\)/
      
        results = {}
        Find.find(site_dir) do |path|
          results[path] = []
          next unless File.file?(path) && (path.end_with?('.html') || path.end_with?('.md'))
          file_content = File.read(path)
          file_content.scan(function_call_regex) do |match|
            values = {
              'contentURL' => match[1],
              'includeType' => match[3],
              'startMarker' => match[5],
              'endMarker' => match[7],
              'header' => match[9],
              'inlineContainer' => match[11],
              'originator' => match[13]
            }
            results[path].push( values)
          end
        end
        return results
    end

    def self.checkCallsForExternalContent(file_path)
      function_call_regex = /getExternalContent\s*\(\s*(['"])(.*?)\1\s*,\s*(['"])(.*?)\3\s*,\s*(['"])(.*?)\5\s*,\s*(['"])(.*?)\7\s*,\s*(['"])(.*?)\9\s*,\s*(['"])(.*?)\11\s*,\s*(['"])(.*?)\13\s*\)/
      result = false
      file_content = File.read(file_path)
      if file_content.match(function_call_regex) 
        result = true
      end
      return result
    end

    def self.replaceLiquidTags(value, yaml_file)
      value.gsub(/\{\{\s*site.data\.([^\s}]+)\s*\}\}/) do |match|
        yaml_path = $1
        yaml_value = Globals.find_value_in_yaml(yaml_file, yaml_path,"siteConfig.")
        yaml_value.nil? ? match : yaml_value
      end
    end

    def self.replaceValuesWithYAML(object, yaml_file)
      case object
      when Hash
        object.each do |key, value|
          if value.is_a?(String)
            object[key] = replaceLiquidTags(value, yaml_file)
          elsif value.is_a?(Hash) || value.is_a?(Array)
            replaceValuesWithYAML(value, yaml_file)
          end
        end
      when Array
        object.each_with_index do |value, index|
          if value.is_a?(String)
            object[index] = replaceLiquidTags(value, yaml_file)
          elsif value.is_a?(Hash) || value.is_a?(Array)
            replaceValuesWithYAML(value, yaml_file)
          end
        end
      end
    end
    
end