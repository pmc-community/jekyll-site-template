require_relative "../../tools/modules/globals"
require_relative "../../tools/modules/file-utilities"
require 'nokogiri'
require 'tf-idf-similarity'
require 'matrix'
require 'dotenv'

Dotenv.load

module Jekyll

  class AlgoliaSettingsGenerator < Generator
    safe true
    priority :high

    def generate(site)
      algoliaEnabled = ENV["ALGOLIA_SEARCH_ENABLED"] # better heve it in env, to be able to set it fast in any deployment env
      if (algoliaEnabled == 'true')
        Globals.putsColText(Globals::PURPLE,"Generating Algolia settings ...")
        algoliaSettings = {
          "algoliaEnabled" => algoliaEnabled,
          "algoliaAppID" => ENV["ALGOLIA_APP_ID"],
          "algoliaIndex" => ENV["ALGOLIA_INDEX"],
          "algoliaWriteApiKey" => ENV["ALGOLIA_WRITE_API_KEY"],
          "algoliaPublicApiKey" => ENV["ALGOLIA_PUBLIC_API_KEY"]
        }
        site.data["algolia_integration"] = algoliaSettings.to_json
        Globals.moveUpOneLine
        Globals.clearLine
        Globals.putsColText(Globals::PURPLE,"Generating Algolia settings ... done")
      else
        algoliaSettings = {}
        site.data["algolia_integration"] = algoliaSettings.to_json
      end
    end

  end

end
  