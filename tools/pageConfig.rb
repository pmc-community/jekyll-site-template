require_relative 'modules/globals'
require_relative 'modules/file-utilities'
require_relative 'modules/pageConfig-utilities'

site_dir = ARGV[0] || 'doc-contents'
#clearScreen = ARGV[1]
silent = ARGV[2]&.downcase == 'true'? true : false

Globals.clearConsole() if ARGV[1]&.downcase == 'true'

Globals.putsColText(Globals::GREEN,"-----------------------\nSTART PAGE CONFIG CHECK")
FileUtilities.clear_or_create_file("#{Globals::ROOT_DIR}/tools/checks/page-config.log")

sitePermalinks = PageConfigUtilities.getPermalinks(site_dir).uniq
pageConfigPermalinks = PageConfigUtilities.getPageConfigPermalinks (Globals::PAGECONFIG_YML)

pageConfigErrors = PageConfigUtilities.checkPageConfigPermalinks(site_dir, Globals::PAGECONFIG_YML, sitePermalinks, pageConfigPermalinks, silent)

endMessage = pageConfigErrors > 0 ? "See checks/page-config.log" : "Sky clear ..."
FileUtilities.write_file("#{Globals::ROOT_DIR}/tools/checks/check.log", "Pages Configuration #{Globals::ARROW_RIGHT} #{endMessage}\n")
Globals.putsColText(Globals::PURPLE,endMessage)
print (Globals::BACK_1_ROW)
Globals.putsColText(Globals::GREEN,"END PAGE CONFIG CHECK\n-----------------------")

