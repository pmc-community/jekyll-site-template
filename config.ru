# config.ru

require 'rack'
require 'jekyll'
require 'fileutils'
require 'rack/cors' # Require rack-cors gem

class TheSite
  def initialize
    @site_directory = '_site'
  end

  def call(env)
    # Build the Jekyll site if the _site directory doesn't exist
    build_site unless Dir.exist?(@site_directory)

    # Serve the Jekyll site using Rack::File middleware
    Rack::Static.new(
      -> (_) { [404, {}, []] }, # Fallback to 404 if file not found
      urls: [""], # Serve from the root URL
      root: @site_directory,
      index: 'index.html', # Specify index.html as the default file
      header_rules: [
        [:all, { 'Cache-Control' => 'public, max-age=3600' }]
      ]
    ).call(env)
  end

  private

  def build_site
    # Trigger Jekyll build process
    Jekyll::Commands::Build.process({}, Jekyll.configuration({}))
  end
end

# Use Rack::Cors middleware and configure CORS headers
use Rack::Cors do
  allow do
    origins 'https://*.githubusercontent.com' # Allow requests from any origin
    resource '*', headers: :any, methods: [:get, :options], credentials: true  # Allow GET and OPTIONS requests
  end
end

# Run Rack application
run TheSite.new
