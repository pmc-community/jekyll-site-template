module Jekyll

  module MaxReadingTimeFilter

    def max_reading_time(array)
      return nil unless array.is_a?(Array) && !array.empty?
      array.max_by { |obj| obj['readingTime'].to_i }
    end
  end

  module MinReadingTimeFilter

    def min_reading_time(array)
      return nil unless array.is_a?(Array) && !array.empty?
      array.min_by { |obj| obj['readingTime'].to_i }
    end
  end

  module AverageReadingTimeFilter
    def average_reading_time(array)
      return nil unless array.is_a?(Array) && !array.empty?

      total_reading_time = array.inject(0) do |sum, obj|
        sum + (obj['readingTime'].to_i)
      end

      average = total_reading_time / array.size.to_f

      average.round(2)
    end
  end

end

Liquid::Template.register_filter(Jekyll::MaxReadingTimeFilter)
Liquid::Template.register_filter(Jekyll::MinReadingTimeFilter)
Liquid::Template.register_filter(Jekyll::AverageReadingTimeFilter)
