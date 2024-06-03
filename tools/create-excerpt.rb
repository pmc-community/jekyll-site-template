require 'openai'
require_relative "modules/globals"
require "dotenv"

Dotenv.load
client = OpenAI::Client.new(
    access_token: ENV["CHAT_GPT_PROJECT_KEY"],
    organization_id: ENV["CHAT_GPT_ORG_ID"],
    project_id: ENV["CHAT_GPT_PRJ_ID"]
)

def generate_excerpt(chatClient, text)
    
    begin
        response = chatClient.chat(
            parameters: {
                model: "gpt-3.5-turbo",
                max_tokens: 50,
                messages: [
                    { 
                        role: "system", 
                        content: text
                    }
                ],
                temperature: 0.7,
            })   
        return  response.dig("choices", 0, "message", "content")
    rescue
        return response
    end

end


file_path = File.join("#{Globals::ROOT_DIR}/doc-contents/", "00-intro.md")
page_content = File.read(file_path).gsub(/\A(---\s*\n.*?\n?)^---\s*\n/m, '')

excerpt = generate_excerpt(client, page_content)
puts excerpt
