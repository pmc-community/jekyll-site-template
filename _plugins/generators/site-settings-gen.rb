require_relative "../../tools/modules/globals"
require_relative "../../tools/modules/file-utilities"
require 'fileutils'
require 'json'
require 'dotenv'

Dotenv.load

module Jekyll

  class SiteSettings < Generator
    safe true
    priority :lowest # better to be the last

    def generate(site)
      Globals.putsColText(Globals::PURPLE,"Generating site settings ...")
      settings_path = "assets/config/siteSettings.json"
      allSettings = {
        "settings" => site.data["siteConfig"],
        "pageList" => JSON.parse(site.data["page_list"]),
        "tagList" => JSON.parse(site.data["tag_list"]),
        "tagDetails" => site.data["tags_details"],
        "catList" => JSON.parse(site.data["category_list"]),
        "catDetails" => site.data["categories_details"],
        "hsSettings" => JSON.parse(site.data["hs_integration"]),
        "algoliaSettings" => JSON.parse(site.data["algolia_client_integration"]),
        "pageSettings" => site.data["pageConfig"],
        "gData" => {
          "ga" => site.data["buildConfig"]["googleAnalytics"],
          "gtm" => site.data["buildConfig"]["googleTagManager"]
        },
        "newRelicSettings" => JSON.parse(site.data["new_relic_client_integration"])
      }
      allSettings["settings"]["siteTitle"] = site.config["title"]

      FileUtilities.overwrite_file(settings_path, JSON.pretty_generate(allSettings))

      Globals.moveUpOneLine
      Globals.clearLine
      Globals.putsColText(Globals::PURPLE,"Generating site settings ... done")

    end

  end

end
