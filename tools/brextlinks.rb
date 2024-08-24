require_relative 'modules/globals'
require_relative 'modules/file-utilities'
require_relative 'modules/link-utilities'

site_dir = ARGV[0] || 'doc-contents'
#clearScreen = ARGV[1]
silent = ARGV[2]&.downcase == 'true'? true : false

Globals.clearConsole() if ARGV[1]&.downcase == 'true'

Globals.putsColText(Globals::GREEN,"-----------------------\nSTART BROKEN EXTERNAL LINKS CHECK")
Globals.putsColText(Globals::PURPLE,"HEADS UP!!!\nOnly files containing external links will be checked.\nLinks to local dev env (localhost) will be reported as broken in pre-flight since the site is not up when this check is performed.")
FileUtilities.clear_or_create_file("#{Globals::ROOT_DIR}/tools/checks/broken-external-links.log")

extLinksInPages = 
    LinkUtilities.filterEmptyKeys(
        LinkUtilities.filterLinksToGetExternalOnly(
            LinkUtilities.scanFilesForLinks(site_dir)
        )
    )

brokenLinks = 0
brokenLinks = LinkUtilities.checkExternalLinks(extLinksInPages, silent)

endMessage = brokenLinks > 0 ? "See checks/broken-external-links.log" : "Sky clear ..."
FileUtilities.write_file("#{Globals::ROOT_DIR}/tools/checks/check.log", "External Links #{Globals::ARROW_RIGHT} #{endMessage}\n")
Globals.putsColText(Globals::PURPLE,endMessage)
print (Globals::BACK_1_ROW)
Globals.putsColText(Globals::GREEN,"END BROKEN EXTERNAL LINKS CHECK\n-----------------------")

