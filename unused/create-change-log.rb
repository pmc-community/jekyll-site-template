require_relative "../../tools/modules/globals"
require_relative "../../tools/modules/file-utilities"

Jekyll::Hooks.register :site, :post_write do |site|
  Globals.putsColText(Globals::PURPLE, "Creating change log ...")

  changeLogRootDir = File.join(site.source, "doc-change-log")
  rawContentDir = File.join(site.source, "doc-raw-contents")
  siteConfigDir = File.join(site.source, "assets/config")

  current_time = Time.now
  formatted_time_with_ms = current_time.strftime("%Y-%m-%d$%H:%M:%S.%L")

  new_folder_path = File.join(changeLogRootDir, formatted_time_with_ms)
  FileUtils.mkdir_p(new_folder_path)

  FileUtils.cp_r(Dir.glob("#{siteConfigDir}/*"), new_folder_path)
  FileUtils.cp_r(Dir.glob("#{rawContentDir}/*.json"), new_folder_path)

  folders = Dir.entries(changeLogRootDir).select do |entry|
    File.directory?(File.join(changeLogRootDir, entry)) && entry =~ /^\d{4}-\d{2}-\d{2}\$\d{2}:\d{2}:\d{2}.\d{3}$/
  end

  sorted_folders = folders.sort.reverse
  folders_to_delete = sorted_folders.drop(site.data["buildConfig"]["changeLog"]["history"])

  folders_to_delete.each do |folder|
    folder_path = File.join(changeLogRootDir, folder)
    FileUtils.rm_rf(folder_path)
  end

  Globals.moveUpOneLine
  Globals.clearLine
  Globals.putsColText(Globals::PURPLE,"Creating change log ... done")


end
