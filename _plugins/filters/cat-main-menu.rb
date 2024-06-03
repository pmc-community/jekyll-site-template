require_relative "../../tools/modules/globals"

module Jekyll
    
    module CatMainMenu
        def cat_main_menu(input)
            begin
                catMenu = {}
                catArray= JSON.parse(input)
                catNo = catArray.length
                catMenu["catNo"] = catNo

                hasMoreCat = catNo > 4 ? true : false
                catMenu["hasMoreCat"] = hasMoreCat

                catMenu["firstLevelMenuItems"] = catArray if !hasMoreCat
                catMenu["firstLevelMenuItems"] = catArray[0..3] if hasMoreCat
                catMenu["secondLevelMenuItems"] = [] if !hasMoreCat
                catMenu["secondLevelMenuItems"] = catArray[4..-1] if hasMoreCat

                catNoLevel2 = catMenu["secondLevelMenuItems"].length
                catMenu["catNoLevel2"] = catNoLevel2
                hasMoreCatLevel2 = catNoLevel2 > 10 ? true : false
                catMenu["hasMoreCatLevel2"] = hasMoreCatLevel2
                catMenu["secondLevelMenuItems"] = catMenu["secondLevelMenuItems"][0..9] if hasMoreCatLevel2

                catMenu
            rescue
                Globals.putsColText(Globals::YELLOW, "#{input} string is not a valid JSON\n")
            end
        end
    end

end
  
Liquid::Template.register_filter(Jekyll::CatMainMenu)