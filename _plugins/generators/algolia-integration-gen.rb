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
          "algoliaPublicApiKey" => ENV["ALGOLIA_PUBLIC_API_KEY"],
          "algoliaDocSearchEnabled" => true,
          "algoliaCustomEnabled" => false
        }

        if (ENV["ALGOLIA_CUSTOM_ENABLED"] == 'true')
          algoliaSettings["algoliaCustomAppID"] = ENV["ALGOLIA_CUSTOM_APP_ID"] 
          algoliaSettings["algoliaCustomIndex"] = ENV["ALGOLIA_CUSTOM_INDEX"]
          algoliaSettings["algoliaCustomWriteApiKey"] = ENV["ALGOLIA_CUSTOM_WRITE_API_KEY"]
          algoliaSettings["algoliaCustomAdminApiKey"] = ENV["ALGOLIA_CUSTOM_ADMIN_API_KEY"]
          algoliaSettings["algoliaDocSearchEnabled"] = false
          algoliaSettings["algoliaCustomEnabled"] = true
        end

        algoliaClientSettings = {
          "algoliaEnabled" => algoliaEnabled == 'true' ? true : false,
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
          # raise issue link is configured from GitHub settings but it can be any link
          # HEADS UP!!!! the link must always in the form https:// something.com/path?title= because algolia.js
          # adds the query to the url and may not work if not pointing to GitHub repo
          # non GitHub links may be more useful for documentations that are mostly accessed by non-tech users
          # who doesn't have GitHub accounts
          "algoliaRaiseIssueLink" => "https://github.com/#{site.data["buildConfig"]["github"]["user"]}/#{site.data["buildConfig"]["github"]["repo"]}/issues/new?title=",
          "algoliaDocSearchEnabled" => true,
          "algoliaCustomEnabled" => false
        }

        if (ENV["ALGOLIA_CUSTOM_ENABLED"] == 'true')
          algoliaClientSettings["algoliaCustomAppID"] = ENV["ALGOLIA_CUSTOM_APP_ID"] 
          algoliaClientSettings["algoliaCustomIndex"] = ENV["ALGOLIA_CUSTOM_INDEX"]
          algoliaClientSettings["algoliaCustomPublicApiKey"] = ENV["ALGOLIA_CUSTOM_PUBLIC_API_KEY"]
          algoliaClientSettings["algoliaDocSearchEnabled"] = false
          algoliaClientSettings["algoliaCustomEnabled"] = true
        end

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
  