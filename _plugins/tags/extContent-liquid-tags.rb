# CUSTOM LIQUID TAGS TO INCLUDE CONTENT FROM EXTERNAL SOURCES
# EXTERNAL SOURCES = 
#   - PUBLIC/PRIVATE GITHUB REPOS
#   - OTHER FILES FROM THE SAME SITE 

require 'json'
require_relative '../../tools/modules/content-utilities'
require_relative "../../tools/modules/globals"

module Jekyll

    module ExtContent
        
        # external repo =  any GitHub repo (public or private) to which the site can have access using a personal access token
        # calls to public repos are also authenticated in order to extend the limit 
        # (although the GitHub doc is not clear, it seems that there is a limit oh ~5000 calls to raw api/hour/IP)
        class ExternalRepoContent < Liquid::Tag
  
            def initialize(tag_name, input, context)
                super
                @input = input
            end

            def render(context)
                begin
                    if( !@input.nil? && !@input.empty? )
                        fileInfo = JSON.parse(Liquid::Template.parse(@input).render(context))
                    end
                    rescue
                        begin
                            fileInfo = JSON.parse(@input)
                        rescue
                            Globals.putsColText(Globals::RED, "ExternalRepoContent tag got bad json string as input\n")
                        end
                end
                ContentUtilities.getExternalContentFromGitHub(fileInfo)
            end
        end

        # MM = Multi Markers
        # multiple pairs od start and end markers can be passed to the tag
        # the tag will concatenate the markups between each pair, including or exluding the markers
        class ExternalRepoContentMM < Liquid::Tag
  
            def initialize(tag_name, input, context)
                super
                @input = input
            end

            def render(context)
                begin
                    if( !@input.nil? && !@input.empty? )
                        fileInfo = JSON.parse(Liquid::Template.parse(@input).render(context))
                    end
                    rescue
                        begin
                            fileInfo = JSON.parse(@input)
                        rescue
                            Globals.putsColText(Globals::RED, "ExternalRepoContentMM tag got bad json string as input\n")
                        end
                end
                ContentUtilities.getExternalContentFromGitHubMM(fileInfo)
            end
        end

        # external site content = any md file in the same site, regardles to its position in the site structure
        # it overcomes the limitation of Jekyll include_relative tag whch does not accept full file paths or ../.. syntax
        class ExternalSiteContent < Liquid::Tag
  
            def initialize(tag_name, input, context)
                super
                @input = input
            end

            def render(context)
                begin
                    if( !@input.nil? && !@input.empty? )
                        fileInfo = JSON.parse(Liquid::Template.parse(@input).render(context))
                    end
                    rescue
                        begin
                            fileInfo = JSON.parse(@input)
                        rescue
                            Globals.putsColText(Globals::RED, "ExternalSiteContent tag got bad json string as input\n")
                        end
                end
                ContentUtilities.getExternalSiteContent(fileInfo)
            end
        end

        # MM = Multi Markers
        # multiple pairs od start and end markers can be passed to the tag
        # the tag will concatenate the markups between each pair, including or exluding the markers
        class ExternalSiteContentMM < Liquid::Tag
  
            def initialize(tag_name, input, context)
                super
                @input = input
            end

            def render(context)
                begin
                    if( !@input.nil? && !@input.empty? )
                        fileInfo = JSON.parse(Liquid::Template.parse(@input).render(context))
                    end
                    rescue
                        begin
                            fileInfo = JSON.parse(@input)
                        rescue
                            Globals.putsColText(Globals::RED, "ExternalSiteContentMM tag got bad json string as input\n")
                        end
                end
                ContentUtilities.getExternalSiteContentMM(fileInfo)
            end
        end
    
    end

end
  
Liquid::Template.register_tag('ExternalRepoContent', Jekyll::ExtContent::ExternalRepoContent)
Liquid::Template.register_tag('ExternalRepoContentMM', Jekyll::ExtContent::ExternalRepoContentMM)

Liquid::Template.register_tag('ExternalSiteContent', Jekyll::ExtContent::ExternalSiteContent)
Liquid::Template.register_tag('ExternalSiteContentMM', Jekyll::ExtContent::ExternalSiteContentMM)
  
