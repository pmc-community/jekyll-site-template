# generating sitemap.xml which is useful for SEO and Algolia search
# should be :site and :after-init to be triggered only once per build/serve.
# otherwise may lead to a endless loop when building/serving the site

require 'yaml'
require_relative "../../tools/modules/globals"
require_relative "../../tools/modules/file-utilities"
require_relative "../../tools/modules/link-utilities"
require 'dotenv'

Dotenv.load

Jekyll::Hooks.register :site, :post_write do |site|
    Globals.putsColText(Globals::PURPLE,"Generating sitemap.xml ...")
    numPages = 0
    doc_contents_dir = File.join(site.source, Globals::DOCS_ROOT)
    sitemap = []
    Dir.glob(File.join(doc_contents_dir, '**', '*.{md,html}')).each do |file_path|
        next if file_path.index("404")
        content = File.open(file_path, "rb", &:read).encode('UTF-8', invalid: :replace, undef: :replace)

        front_matter = {}

        content.gsub!("\r\n", "\n")
        if content =~ /^(---\s*\n.*?\n?)^(---\s*$\n?)/m
            begin
                front_matter = YAML.load(Regexp.last_match[1])
                front_matter = {} if !front_matter["permalink"]
            rescue
                front_matter = {} if !front_matter.is_a?(Hash)
            end
        end

        if front_matter != {}
            #puts "after frontmatter check: #{file_path}"
            numPages += 1
            url = file_path.sub(site.source, '').sub(/\.md$/, '.html').sub(/\.html$/, '')
            url = url.chomp('index') if url.end_with?('index')
            permalink = front_matter["permalink"]
            permalink = permalink.start_with?('/') ? permalink : "/#{permalink}"

            # adding default language pages to sitemap.xml
            # these are without language code in the url
            # default language is the fallbackLang in _data/siteConfig.yml, multilang section
            #url = ENV["DEPLOY_PROD_BASE_URL"] + permalink
            url = "https://docaroo.innohub.space#{permalink}"
            validUrl = LinkUtilities.check_link(url)
            puts "url=#{url} valid=#{validUrl}"
            #if (validUrl == 0)
                sitemap << {
                    'url' => ENV["DEPLOY_PROD_BASE_URL"] + permalink,
                    'lastmod' => front_matter['lastmod'] || File.mtime(file_path).strftime('%Y-%m-%d'),
                    'changefreq' => front_matter['changefreq'] || 'weekly',
                    'priority' => front_matter['priority'] || '0.5'
                }
            #end

            # add language pages to sitemap
            # need to read the siteConfig.yml because at the moment of :after_init the site var is not known yet
            # :after_init cannot be changed with something that ensures site var to be known because may lead to an endless loop for generating sitemap.xml
            content = File.open("_data/siteConfig.yml","" "rb", &:read).encode('UTF-8', invalid: :replace, undef: :replace)
            siteConfig = YAML.load(content);
            languages = siteConfig["multilang"]["availableLang"]
            siteLang = siteConfig["multilang"]["siteLanguage"]
            defaultLanguage = siteConfig["multilang"]["fallbackLang"]
            siteLangCode = languages[defaultLanguage]["lang"]
            languages.each do |language|
                if (FileUtilities.file_exists?("assets/locales/#{language["lang"]}.json", Globals::ROOT_DIR))
                    # we don't add the default language pages to sitemap.xml
                    # because those pages were already added before

                    if (language["lang"] != siteLangCode)
                        url = ENV["DEPLOY_PROD_BASE_URL"] + "/#{language["lang"]}" + permalink
                        validUrl = LinkUtilities.check_link(url)
                        #puts "#{url} ... #{validUrl}"
                        if (validUrl == 0 )
                            sitemap << {
                                'url' => ENV["DEPLOY_PROD_BASE_URL"] + "/#{language["lang"]}" + permalink,
                                'lastmod' => front_matter['lastmod'] || File.mtime(file_path).strftime('%Y-%m-%d'),
                                'changefreq' => front_matter['changefreq'] || 'weekly',
                                'priority' => front_matter['priority'] || '0.5'
                            }
                        end
                    end
                end
            end
            
        end

    end

    sitemap.sort_by! { |page| page['lastmod'] }

    sitemap_content = <<~XML
        <?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        #{sitemap.map { |page| generate_sitemap_entry(page) }.join("\n")}
        </urlset>
    XML
    #File.write(File.join(Globals::ROOT_DIR, 'sitemap.xml'), sitemap_content)
    sitemap_path = File.join(site.dest, 'sitemap.xml')
    File.write(sitemap_path, sitemap_content)
    Globals.moveUpOneLine
    Globals.clearLine
    Globals.putsColText(Globals::PURPLE,"Generating sitemap.xml ... done (#{numPages} pages)")
  
end

def generate_sitemap_entry(page)
    <<~XML
      <url>
        <loc>#{page['url']}</loc>
        <lastmod>#{page['lastmod']}</lastmod>
        <changefreq>#{page['changefreq']}</changefreq>
        <priority>#{page['priority']}</priority>
      </url>
    XML
end
