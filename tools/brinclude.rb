require 'jekyll'
require_relative 'modules/file-utilities'
require_relative 'modules/globals'

site_dir = ARGV[0] || 'doc-contents'
silent = ARGV[2]&.downcase == 'true'? true : false

Globals.clearConsole() if ARGV[1]&.downcase == 'true'

#Globals.clearConsole()
Globals.putsColText(Globals::GREEN,"-----------------------\nSTART BROKEN INCLUDES CHECK")

FileUtilities.clear_or_create_file("#{Globals::ROOT_DIR}/tools/checks/broken-includes.log")

brokeIncludes = 0
fileErrors = 0
# Loop through all Markdown files in the site directory
Dir.glob("#{site_dir}/**/*.md").each do |file_path|
  puts "checking #{file_path}" if !silent
  fileErrors = FileUtilities.check_includes(file_path, File.read(file_path), File.dirname(file_path), silent)
  if (fileErrors >0 )
    brokeIncludes = fileErrors
  end
end

endMessage = brokeIncludes > 0 ? "See checks/broken-includes.log" : "Sky clear ..."
FileUtilities.write_file("#{Globals::ROOT_DIR}/tools/checks/check.log", "Include tags #{Globals::ARROW_RIGHT} #{endMessage}\n")
Globals.putsColText(Globals::PURPLE,endMessage)
print (Globals::BACK_1_ROW)
Globals.putsColText(Globals::GREEN,"END BROKEN INCLUDES CHECK\n-----------------------")
