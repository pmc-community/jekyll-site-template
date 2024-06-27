require 'json'
require_relative "../../tools/modules/globals"

module Jekyll

    module SitePages
        class SitePages < Liquid::Tag
  
            def initialize(tag_name, input, context)
                super
                @input = input
            end

            def render(context)
                begin
                    if( !@input.nil? && !@input.empty? )
                        info = JSON.parse(Liquid::Template.parse(@input).render(context))
                        _ = info # noop to prevent warnings for not using variable. to be removed when the variable will be used

                    end
                    rescue
                        begin
                            info = JSON.parse(@input)
                            rescue
                                Globals.putsColText(Globals::RED, "SitePages tag got bad json string as input\n")
                        end
                end
                context.registers[:site].data["page_list"] if context && context.registers[:site] && context.registers[:site].data
                
            end
        end

        class PageExcerpt < Liquid::Tag
  
            def initialize(tag_name, input, context)
                super
                @input = input
            end

            def render(context)
                begin
                    if( !@input.nil? && !@input.empty? )
                        param = Liquid::Template.parse(@input).render(context)
                        permalink = JSON.parse(param.gsub('=>', ':'))["permalink"]
                        pages = context && context.registers[:site] && context.registers[:site].data ?
                            JSON.parse(context.registers[:site].data["page_list"]) :
                            []
                        matched_page = pages.find { |obj| obj["permalink"] == permalink }
                    end
                    rescue
                        begin
                            param = JSON.parse(@input)
                            matched_page = pages.find { |obj| obj["permalink"] == permalink }
                        rescue
                            Globals.putsColText(Globals::RED, "#{context['page']['url']}: PageExcerpt tag got bad json string as input\n")
                        end
                end
                excerpt = matched_page["excerpt"] ? matched_page["excerpt"] : "" if matched_page
                excerpt
            end
            
        end

        class PageTags < Liquid::Tag
  
            def initialize(tag_name, input, context)
                super
                @input = input
            end

            def render(context)
                begin
                    if( !@input.nil? && !@input.empty? )
                        param = Liquid::Template.parse(@input).render(context)
                        permalink = JSON.parse(param.gsub('=>', ':'))["permalink"]
                        tagExcept = JSON.parse(JSON.parse(param.gsub('=>', ':'))["except"].to_json)
                        pages = JSON.parse(context.registers[:site].data["page_list"])
                        matched_page = pages.find { |obj| obj["permalink"] == permalink }
                    end
                    rescue
                        begin
                            param = JSON.parse(@input)
                            permalink = param["permalink"]
                            tagExcept = JSON.parse(param["except"].to_json) || []
                            matched_page = pages.find { |obj| obj["permalink"] == permalink }
                        rescue
                            Globals.putsColText(Globals::RED, "#{context['page']['url']}: PageTags tag got bad json string as input(#{param})\n")
                        end
                end
                tags = matched_page["tags"] ? matched_page["tags"] : [] if matched_page
                tagExcept.each do |tag|
                    tags.delete(tag)
                end
                tags.to_json
            end
            
        end

    end
end
  
Liquid::Template.register_tag('SitePages', Jekyll::SitePages::SitePages)
Liquid::Template.register_tag('PageExcerpt', Jekyll::SitePages::PageExcerpt)
Liquid::Template.register_tag('PageTags', Jekyll::SitePages::PageTags)
  
