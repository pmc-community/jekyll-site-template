source "https://rubygems.org"

# DOTENV MUST BE FIRST
gem 'dotenv', groups: [:development, :test]

# a good idea is to use a newer version of Jekyll
# HEADS UP!
# CHECK THE MAXIMUM JEKYLL VERSION ACCEPTED BY GITHUB PAGES (IF THE SITE IS DEPLOYED IN GHP)
# IF DEPLOY FROM BRANCH, AS OF APRIL 2024, THIS IS 3.9.5
# IF DEPLOY FROM ACTION, CAN BE THE LATEST JEKYLL VERSION
gem "jekyll", "~> 4.3.3"

# HEADS UP!
# JTD 0.8.0 IS THE MAXIMUM THEME VERSION WORKING WITH GHP WHN DEPLOY FROM BRANCH
gem "just-the-docs"

# THIS IS THE LAST VERSION OF GHP AS OF APRIL 2024 AND WORKS MAX. WITH JEKYLL 3.9.5
# SHOULD BE USED ONLY IF DEPLOY FROM BRANCH ON GITHUB PAGES, OTHERWISE WE USE gem jekyll above
#gem "github-pages", "~> 231", group: :jekyll_plugins

# If you have any plugins, put them here!
#group :jekyll_plugins do
#  gem "jekyll-feed", "~> 0.12" # feed for posts but we don't use posts here see also _config.yml/plugins
#end

# Windows and JRuby does not include zoneinfo files, so bundle the tzinfo-data gem
# and associated library.
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

# Performance-booster for watching directories on Windows
gem "wdm", "~> 0.1.1", :platforms => [:mingw, :x64_mingw, :mswin]

# Lock `http_parser.rb` gem to `v0.6.x` on JRuby builds since newer versions of the gem
# do not have a Java counterpart.
gem "http_parser.rb", "~> 0.6.0", :platforms => [:jruby]

gem "webrick", "~> 1.8"

# is no the last version but this one works both with jekyll 4.3.3 and macOS high sierra for local testing
gem 'jekyll-sass-converter', '2.0.0'
