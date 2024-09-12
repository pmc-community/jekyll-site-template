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
    priority :high # actually can be anywhere, but the sooner, the better

    def generate(site)
      # better have it in env, to be able to set it fast in any deployment env, 
      # without being necessary to edit site confguration files
      algoliaEnabled = ENV["ALGOLIA_SEARCH_ENABLED"] 
      if (algoliaEnabled == 'true')
        Globals.putsColText(Globals::PURPLE,"Generating Algolia settings ...")

        # algoliaSettings to be used only on server side, when building, to not expose the write key
        algoliaSettings = {
          "algoliaEnabled" => algoliaEnabled,
          "algoliaAppID" => ENV["ALGOLIA_APP_ID"],
          "algoliaIndex" => ENV["ALGOLIA_INDEX"],
          "algoliaWriteApiKey" => ENV["ALGOLIA_WRITE_API_KEY"],
          "algoliaPublicApiKey" => ENV["ALGOLIA_PUBLIC_API_KEY"]
        }

        algoliaClientSettings = {
          "algoliaEnabled" => algoliaEnabled,
          "algoliaAppID" => ENV["ALGOLIA_APP_ID"],
          "algoliaIndex" => ENV["ALGOLIA_INDEX"],
          "algoliaPublicApiKey" => ENV["ALGOLIA_PUBLIC_API_KEY"],
          "algoliaSearchBoxContainer" => site.data["buildConfig"]["algoliaSearch"]["container"],
          "algoliaDebug" => site.data["buildConfig"]["algoliaSearch"]["debug"],
          "algoliaMaxResultsPerGroup" => site.data["buildConfig"]["algoliaSearch"]["maxResultsPerGroup"],
          "algoliaHitsPerPage" => site.data["buildConfig"]["algoliaSearch"]["hitsPerPage"],
          "algoliaSendInsights" => site.data["buildConfig"]["algoliaSearch"]["insights"],
          "algoliaTextHighlightPrefixTag" => site.data["buildConfig"]["algoliaSearch"]["textHighlightPrefixTag"],
          "algoliaTextHighlightPostfixTag" => site.data["buildConfig"]["algoliaSearch"]["textHighlightPostfixTag"],
          "algoliaRaiseIssueLink" => "https://github.com/#{site.data["buildConfig"]["github"]["user"]}/#{site.data["buildConfig"]["github"]["repo"]}/issues/new?title="
        }

        site.data["algolia_integration"] = algoliaSettings.to_json
        site.data["algolia_client_integration"] = algoliaClientSettings.to_json
        Globals.moveUpOneLine
        Globals.clearLine
        Globals.putsColText(Globals::PURPLE,"Generating Algolia settings ... done")
      else
        algoliaSettings = {}
        site.data["algolia_integration"] = algoliaSettings.to_json
        site.data["algolia_client_integration"] = algoliaSettings.to_json
      end
    end

  end

end
  