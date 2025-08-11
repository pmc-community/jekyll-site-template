# _plugins/ignore_txt.rb
Jekyll::Hooks.register :site, :post_read do |site|
  site.pages.delete_if do |page|
    page.path.start_with?("doc-contents/") && page.extname == ".txt"
  end

  site.collections.each_value do |collection|
    collection.docs.delete_if do |doc|
      doc.path.start_with?(site.in_source_dir("doc-contents/")) && File.extname(doc.path) == ".txt"
    end
  end
end
