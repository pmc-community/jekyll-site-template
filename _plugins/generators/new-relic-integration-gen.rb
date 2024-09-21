require_relative "../../tools/modules/globals"
require 'dotenv'

Dotenv.load

module Jekyll

  class NewRelicSettingsGenerator < Generator
    safe true
    priority :high # actually can be anywhere, but the sooner, the better

    def generate(site)
      
      nrEnabled = ENV["NR_ENABLED"] 
      if (nrEnabled == 'true')
        Globals.putsColText(Globals::PURPLE,"Generating New Relic settings ...")

        # newRelicSettings to be used only on server side, when building, to not expose the write key
        newRelicSettings = {
          "newRelicEnabled" => nrEnabled,
          "newRelicBrowserEnabled" => ENV["NR_BROWSER_ENABLED"],
          "newRelicAccountID" => ENV["NR_ACCOUNT_ID"],
          "newRelicBroswerAppID" => ENV["NR_BROWSER_APP_ID"],
          "newRelicBrowserAppLicenseKey" => ENV["NR_BROWSER_APP_LICENSE_KEY"],
          "newRelicBrowserAppBeacon" => ENV["NR_BROWSER_BEACON"]
        }

        site.data["new_relic_integration"] = newRelicSettings.to_json
        Globals.moveUpOneLine
        Globals.clearLine
        Globals.putsColText(Globals::PURPLE,"Generating New Relic settings ... done")
      else
        newRelicSettings = {}
        site.data["new_relic_integration"] = newRelicSettings.to_json
      end
    end

  end

end
  