require_relative "../../tools/modules/globals"
require_relative "../../tools/modules/file-utilities"

Jekyll::Hooks.register :site, :post_write do |site|
  Globals.putsColText(Globals::PURPLE,"Copy site settings to _site ...")
  source = File.join(site.source, 'assets/config')
  destination = File.join(site.dest, 'assets/config')

  # Create destination directory if it doesn't exist
  FileUtils.mkdir_p(destination)

  # Copy files from source to destination
  FileUtils.cp_r(Dir.glob("#{source}/*"), destination)
  Globals.moveUpOneLine
  Globals.clearLine
  Globals.putsColText(Globals::PURPLE,"Copy site settings to _site ... done")
end

