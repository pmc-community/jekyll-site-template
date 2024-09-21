require_relative "../../tools/modules/globals"
require_relative "../../tools/modules/col-utilities"

module Jekyll
  class FilteredCollectionsGenerator < Generator
    safe true
    priority :low # can be the last generator

    def generate(site)
      if (site.data["pageBuildConfig"]["/"]["sections"]["collections_section"]["enabledInHome"])
        Globals.putsColText(Globals::PURPLE,"Generating collections info ... ")
        filtered_collections = ColUtilities.getSiteCollections(site)
        #puts JSON.pretty_generate(filtered_collections)
        site.data['filtered_collections'] = filtered_collections
        Globals.moveUpOneLine
        Globals.clearLine
        Globals.putsColText( Globals::PURPLE, "Generating collections info ... done")
      end
    end
  end
end
