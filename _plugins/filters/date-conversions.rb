module Jekyll
  module DateToUtcTimestamp
    def date_to_utc_timestamp(input)
      require 'date'
      
      months = {
        "Jan" => 1, "Feb" => 2, "Mar" => 3, "Apr" => 4,
        "May" => 5, "Jun" => 6, "Jul" => 7, "Aug" => 8,
        "Sep" => 9, "Oct" => 10, "Nov" => 11, "Dec" => 12
      }
      
      # Parse the input date string
      day, month, year = input.split('-')
      day = day.to_i
      month = months[month]
      year = year.to_i

      # Create a DateTime object in UTC
      date = DateTime.new(year, month, day)
      
      # Convert to UTC timestamp
      timestamp = date.to_time.to_i
      
      return timestamp
    end
  end
end

Liquid::Template.register_filter(Jekyll::DateToUtcTimestamp)
