require_relative 'modules/globals'
require_relative 'modules/file-utilities'
require_relative 'modules/link-utilities'

site_dir = ARGV[0] || 'doc-contents'
#clearScreen = ARGV[1]
silent = ARGV[2]&.downcase == 'true'? true : false

Globals.clearConsole() if ARGV[1]&.downcase == 'true'

Globals.putsColText(Globals::GREEN,"-----------------------\nSTART BROKEN INTERNAL LINKS CHECK")
Globals.putsColText(Globals::PURPLE,"HEADS UP!!! Only files containing internal links will be checked.")
FileUtilities.clear_or_create_file("#{Globals::ROOT_DIR}/tools/checks/broken-internal-links.log")

sitePermalinks = LinkUtilities.getPermalinks(site_dir).uniq

originalLinksInPages = LinkUtilities.filterEmptyKeys(
    LinkUtilities.filterLinksToGetInternalOnly(
      LinkUtilities.scanFilesForLinks(site_dir)
    )
  )

brokenLinks = LinkUtilities.checkInternalLinks(originalLinksInPages, sitePermalinks, silent)

endMessage = brokenLinks > 0 ? "See checks/broken-internal-links.log" : "Sky clear ..."
FileUtilities.write_file("#{Globals::ROOT_DIR}/tools/checks/check.log", "Internal Links #{Globals::ARROW_RIGHT} #{endMessage}\n")
Globals.putsColText(Globals::PURPLE,endMessage)
print (Globals::BACK_1_ROW)
Globals.putsColText(Globals::GREEN,"END BROKEN INTERNAL LINKS CHECK\n-----------------------")

