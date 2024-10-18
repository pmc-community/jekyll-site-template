module Jekyll
  module CleanPermalink
    def clean_permalink(input)
      return '' unless input.is_a?(String)
      normalized = input.gsub(/^\/*|\/*$/, '')
      normalized
    end
  end
end

Liquid::Template.register_filter(Jekyll::CleanPermalink)