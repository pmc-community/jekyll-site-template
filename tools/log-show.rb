require_relative 'modules/globals'

Globals.putsColText(Globals::GREEN,"\n-----------------------\nLOOK WHAT A GREAT JOB YOU DID!!!")
begin
    # Read the contents of a file
    file_contents = File.read(Globals::LOG_FILE)
  
    # Output the file contents
    puts file_contents
  rescue Errno::ENOENT => e
    puts "File not found: #{e.message}"
  rescue => e
    puts "An error occurred: #{e.message}"
end

print (Globals::BACK_1_ROW)
Globals.putsColText(Globals::GREEN,"-----------------------\n")
  