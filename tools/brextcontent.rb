require_relative 'modules/globals'
require_relative 'modules/file-utilities'
require_relative 'modules/extContent-utilities'

# pretty print objects
require 'pp'

site_dir = ARGV[0] || 'doc-contents'
#clearScreen = ARGV[1]
silent = ARGV[2]&.downcase == 'true'? true : false

Globals.clearConsole() if ARGV[1]&.downcase == 'true'

Globals.putsColText(Globals::GREEN,"-----------------------\nSTART EXTERNAL CONTENTS CHECK")
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
  
