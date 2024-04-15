require_relative 'modules/globals'
require_relative 'modules/file-utilities'
require_relative 'modules/extContent-utilities'

# pretty print objects
require 'pp'

site_dir = ARGV[0] || 'doc-contents'
clearScreen = ARGV[1]
silent = ARGV[2]&.downcase == 'true'? true : false

Globals.clearConsole() if ARGV[1]&.downcase == 'true'

Globals.putsColText(Globals::GREEN,"-----------------------\nSTART EXTERNAL CONTENTS CHECK")
Globals.putsColText(Globals::PURPLE,"HEADS UP!!!\n - Only files containing explicit calls for external content will be checked.")
Globals.putsColText(Globals::PURPLE," - Explicit call means that the parameters of getExternalContent(...) are provided as literals or are site vars, in the form {{ site.propLevel1. ... propLevelN.propStringValue }}")
Globals.putsColText(Globals::PURPLE," - Site configs must be defined in _data/siteConfig.yml")
FileUtilities.clear_or_create_file("#{Globals::ROOT_DIR}/tools/checks/broken-external-content.log")


results = ExtContentUtilities.replaceValuesWithYAML(
    ExtContentUtilities.findCallsForExternalContent(site_dir), Globals::SITECONFIG_YML
).select { |_, value| value.is_a?(Array) && !value.empty? }

pp results if !silent

brokenContent = 0
endMessage = brokenContent > 0 ? "See checks/broken-external-content.log" : "Sky clear ..."

FileUtilities.write_file("#{Globals::ROOT_DIR}/tools/checks/check.log", "External Content #{Globals::ARROW_RIGHT} #{endMessage}\n")
Globals.putsColText(Globals::PURPLE,endMessage)
print (Globals::BACK_1_ROW)
Globals.putsColText(Globals::GREEN,"END EXTERNAL CONTENT CHECK\n-----------------------")
  
