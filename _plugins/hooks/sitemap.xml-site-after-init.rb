# generating sitemap.xml which is useful for SEO and Algolia search
# should be :site and :after-init to be triggered only once per build/serve.
# otherwise may lead to a endless loop when building/serving the site

require 'yaml'
require_relative "../../tools/modules/globals"
require 'dotenv'

Dotenv.load

Jekyll::Hooks.register :site, :after_init do |site|
    Globals.putsColText(Globals::PURPLE,"Generating sitemap.xml ...")
    numPages = 0
    doc_contents_dir = File.join(site.source, Globals::DOCS_ROOT)
    sitemap = []
    Dir.glob(File.join(doc_contents_dir, '**', '*.{md,html}')).each do |file_path|
        next if file_path.index("404")
        content = File.read(file_path)
        front_matter = {}

        if content =~ /^(---\s*\n.*?\n?)^(---\s*$\n?)/m
            begin
                front_matter = YAML.load(Regexp.last_match[1])
                front_matter = {} if !front_matter["permalink"]
            rescue
                front_matter = {} if !front_matter.is_a?(Hash)
            end
        end

        if front_matter != {}
            numPages += 1
            url = file_path.sub(site.source, '').sub(/\.md$/, '.html').sub(/\.html$/, '')
            url = url.chomp('index') if url.end_with?('index')
            permalink = front_matter["permalink"]
            permalink = permalink.start_with?('/') ? permalink : "/#{permalink}"
            sitemap << {
                'url' => ENV["DEPLOY_PROD_BASE_URL"] + permalink,
                'lastmod' => front_matter['lastmod'] || File.mtime(file_path).strftime('%Y-%m-%d'),
                'changefreq' => front_matter['changefreq'] || 'weekly',
                'priority' => front_matter['priority'] || '0.5'
            }
        end

    end

    sitemap.sort_by! { |page| page['lastmod'] }

    sitemap_content = <<~XML
        <?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        #{sitemap.map { |page| generate_sitemap_entry(page) }.join("\n")}
        </urlset>
    XML
    File.write(File.join(Globals::ROOT_DIR, 'sitemap.xml'), sitemap_content)
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
