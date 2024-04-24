// Let's do some work
const setTagsSupport = () => {
    setTagButtons();
    showTagDetails(readQueryString());
}
// work ends here

const setTagButtons = () => {
    $(window).on('load', () => {
        $('button[siteFunction="tagButton"]').click( function() {
            const selectedTag = $(this).attr('id');
            showTagDetails(selectedTag);
        } );
    });
}

const readQueryString = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tag = urlParams.get('tag');
    return tag;
}

const showTagDetails = (tag) => {
    if ( !tag ) return
    $(`div[siteFunction="tagDetails"][tagReference="${tag}"]`).removeClass('d-none');
    $(`div[siteFunction="tagDetails"][tagReference!="${tag}"]`).addClass('d-none');
}


