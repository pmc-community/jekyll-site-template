require 'yaml'
require_relative 'modules/col-utilities'


puts "\e[H\e[2J" # clear the console
puts "\e[32m-----------------------\nSTARTING AUTO COLLECTION\n\e[0m"

wDir = File.expand_path('..', __dir__)

puts "\e[35mLooking for collections on: \e[0m"

onStorageCollections = ColUtilities.getOnStorageCollections(wDir)
jtdCollections = ColUtilities.getYMLSection(wDir + '/_config.yml','just_the_docs')['collections'].keys
jekyllCollections = ColUtilities.getYMLSection(wDir + '/_config.yml','collections').keys

# this converts to lowercase
# puts "Storage:\t" + onStorageCollections.sort_by(&:downcase).join('; ')
puts "Storage:\t" + onStorageCollections.sort.join('; ')
puts "Theme:\t\t" + jtdCollections.sort.join('; ')
puts "Jekyll:\t\t" + jekyllCollections.sort.join('; ')

puts "\e[35m\nChecking collections ... \e[0m"
ColUtilities.checkCollections(wDir, onStorageCollections, jtdCollections, jekyllCollections)

puts "\e[32m\nEND AUTO COLLECTION\n-----------------------\n\e[0m"
