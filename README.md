# Documentation site for Figma Resources
This is the documentation site for Figma Resources

# Requires
## For Ruby Tools
Tools are located in /tools directory and used to automate some work before building the site. So, the requires must be installed but doesn't need to be included in the gem file since the site is not using them
 - yaml: gem install yaml

 # Deployments
 - works with GitHub pages, deployment from action, not from branch
 - works with Netlify

 # HEADS UP!!!
 Never use html comments in the form <!--- --->, with the sequence "---", because these will be considered as front matter by Ruby scripts that will parse those files and will clearly raise errors since it expects yaml format between ---. Html comments can be <!-- -->