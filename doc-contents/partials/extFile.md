<!--- 
    HEADS UP!!!
    IN THE SCRIPT BELOW, THE SYNTAX MUST BE 100% STRICT
    EACH LINE MUST END WITH ';'
    NOO JAVASCRIPT COMMENTS ARE ALLOWED
    OTHERWISE, PARSING CAN BE WRONG AND THE SCRIPT MAY BE NOT EXECUTED 

    HEADS UP!!!
    ANY CONTENT TO BE RENDERED BEFORE THE EXTERNAL CONTENT MUST BE GIVEN
    AS THE LAST PARAMETER TO THE FUNCTION, OTHERWISE MAY NOT STICK TOGETHER
    WITH THE EXTERNAL CONTENT DUE TO THE ASYNC NATURE OF HTTP REQUEST 

    HEADS UP!!!
    IF YOU DON'T HAVE A BACKEND AVAILABLE (THAT'S THE CASE WITH GITHUB PAGES)
    BE SURE THAT YOU HAVE ACCESS TO THE EXTERNAL CONTENT WITHOUT AUTHENTICATION/AUTHORIZATION
    BECAUSE YOU WILL NOT BE ABLE TO DO IT ON CLIENT SIDE WITHOUT EXPOSING PASSWORD OR KEYS 
--->

<script>
    getExternalMDContent (
        'https://raw.githubusercontent.com/pmc-community/figma/main/ReactPluginTemplate/READMEx.md', 
        'after',
        'fullFile',
        'fullFile',
        '```Markdown content generated from a partial which loads from a full external md file and place the content at the bottom of the content area```',
        '',
        'doc-contents/partials/extFile.md'
    );
</script>
