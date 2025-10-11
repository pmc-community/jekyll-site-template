require_relative "../../tools/modules/globals"
require_relative "../../tools/modules/file-utilities"
require 'dotenv'
Dotenv.load

Jekyll::Hooks.register :site, :post_write do |site|
    algoliaSearch = ENV["ALGOLIA_SEARCH_ENABLED"]
    algoliaCustom = ENV["ALGOLIA_CUSTOM_ENABLED"]
    if (algoliaSearch || algoliaCustom)
        Globals.putsColText(Globals::PURPLE,"Algolia is enabled - updating just-the-docs.js ...")
        source = File.join(site.dest, 'assets/js/just-the-docs.js')
        jtdJS = File.read(source)
        
        jtdJS_upd = jtdJS.sub('initSearch();', '/*initSearch();*/')
        jtdJS = jtdJS_upd
        jtdJS_upd = jtdJS.sub('update();', '/*update();*/')
        jtdJS = jtdJS_upd
        jtdJS_upd = jtdJS.sub('setTimeout(update, 0);', '/*setTimeout(update, 0);*/')
        
        FileUtilities.overwrite_file(source, jtdJS_upd)
        Globals.moveUpOneLine
        Globals.clearLine
        Globals.putsColText(Globals::PURPLE,"Algolia is enabled - updating just-the-docs.js ... done")

    end
end

