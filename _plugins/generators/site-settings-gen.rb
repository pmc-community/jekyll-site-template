require_relative "../../tools/modules/globals"
require_relative "../../tools/modules/file-utilities"
require 'fileutils'
require 'json'
require 'dotenv'
require 'time'

Dotenv.load

module Jekyll

  class SiteSettings < Generator
    safe true
    priority :lowest # better to be the last

    def generate(site)
      Globals.putsColText(Globals::PURPLE,"Generating site settings ...")
      settings_path = "assets/config/siteSettings.json"
      enLanguage_path = "assets/locales/en.json"

      # ensure that lastUpdateDate is the right one
      page_list_path = "#{site.data["buildConfig"]["rawContentFolder"]}/page_list.json"
      basePageList = JSON.parse(FileUtilities.read_json_file(page_list_path).to_json)
      sitePageList = JSON.parse(site.data["page_list"])

      sitePageList.each do |page|
        basePage = Globals.find_object_by_multiple_key_value(basePageList, {"permalink" => page["permalink"]})
        createTime =  basePage["createTime"]
        createTimeUTC = Time.parse(createTime).to_i rescue 0
        
        lastUpdate =  basePage["lastUpdate"]
        lastUpdateUTC = Time.parse(lastUpdateUTC).to_i rescue 0

        Globals.find_object_by_multiple_key_value(sitePageList, {"permalink" => page["permalink"]})["createTime"] = createTime
        Globals.find_object_by_multiple_key_value(sitePageList, {"permalink" => page["permalink"]})["createTimeUTC"] = createTimeUTC
        Globals.find_object_by_multiple_key_value(sitePageList, {"permalink" => page["permalink"]})["lastUpdate"] = lastUpdate
        Globals.find_object_by_multiple_key_value(sitePageList, {"permalink" => page["permalink"]})["lastUpdateUTC"] = lastUpdateUTC
      end

      allSettings = {
        "isProd" => ENV["JEKYLL_ENV"] != "production" ? false : true,
        "settings" => site.data["siteConfig"],
        "pageList" => sitePageList,
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
        "newRelicSettings" => JSON.parse(site.data["new_relic_client_integration"]),
        "engLanguage" => JSON.parse(File.read(enLanguage_path))
      }
      allSettings["settings"]["siteTitle"] = site.config["title"]

      FileUtilities.overwrite_file(settings_path, JSON.pretty_generate(allSettings))

      Globals.moveUpOneLine
      Globals.clearLine
      Globals.putsColText(Globals::PURPLE,"Generating site settings ... done")

    end

  end

end
