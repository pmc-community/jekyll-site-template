require_relative 'modules/globals'
require_relative 'modules/file-utilities'
require_relative 'modules/permalinks-utilities'

site_dir = ARGV[0] || 'doc-contents'
#clearScreen = ARGV[1]
silent = ARGV[2]&.downcase == 'true'? true : false
ignore = ARGV[3] || '[""]' 

Globals.clearConsole() if ARGV[1]&.downcase == 'true'

Globals.putsColText(Globals::GREEN,"-----------------------\nSTART PERMALINKS CHECK")
FileUtilities.clear_or_create_file("#{Globals::ROOT_DIR}/tools/checks/permalinks.log")

sitePermalinks = PermalinksUtilities.getPermalinks(site_dir)

badPermalinks = PermalinksUtilities.checkPermalinks(site_dir, sitePermalinks, silent, ignore)

endMessage = badPermalinks > 0 ? "See checks/permalinks.log" : "Sky clear ..."
FileUtilities.write_file("#{Globals::ROOT_DIR}/tools/checks/check.log", "Permalinks #{Globals::ARROW_RIGHT} #{endMessage}\n")
Globals.putsColText(Globals::PURPLE,endMessage)
print (Globals::BACK_1_ROW)
Globals.putsColText(Globals::GREEN,"END PERMALINKS CHECK\n-----------------------")

