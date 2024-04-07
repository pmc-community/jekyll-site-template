<!--- 
    HEADS UP!!!
    IN THE SCRIPT BELOW, THE SYNTAX MUST BE 100% STRICT:
        EACH LINE MUST END WITH ';'
        NO JAVASCRIPT COMMENTS ARE ALLOWED
        OTHERWISE, PARSING CAN BE WRONG AND THE SCRIPT MAY BE NOT EXECUTED 

    HEADS UP!!!
    ANY CONTENT TO BE RENDERED BEFORE THE EXTERNAL CONTENT MUST BE GIVEN
    AS THE LAST PARAMETER TO THE FUNCTION, OTHERWISE MAY NOT STICK TOGETHER
    WITH THE EXTERNAL CONTENT DUE TO THE ASYNC NATURE OF HTTP REQUEST 
 
    HEADS UP!!!
    IF YOU DON'T HAVE A BACKEND AVAILABLE (THAT'S THE CASE WITH GITHUB PAGES)
    BE SURE THAT YOU HAVE ACCESS TO THE EXTERNAL CONTENT WITHOUT AUTHENTICATION/AUTHORIZATION
    BECAUSE YOU WILL NOT BE ABLE TO DO IT ON CLIENT SIDE WITHOUT EXPOSING PASSWORD OR KEYS 

    HEADS UP!!!
    ANY PARAMETERS TO BE PASSED TO JS FUNCTIONS MUST BE INITIALIZED BEFORE CALLING THE FUNCTION
    OTHERWISE THEY MAY BE NOT PASSED CORRECTLY 
--->

<script>
    getExternalMDContent (
        'https://raw.githubusercontent.com/pmc-community/figma/main/ReactPluginTemplate/README.md', 
        'before',
        '{{ site.siteConfig.extContentMarkers.startExposedSection }}',
        '{{ site.siteConfig.extContentMarkers.endExposedSection }}',
        '```Markdown content generated from a part of partial which loads a part from an external md file and place it on top of the content area```',
        '',
        'doc-contents/partials/partExtFile.md'
    );
</script>
