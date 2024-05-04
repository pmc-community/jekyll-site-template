// Let's do some work
const setCatSupport = () => {
    setSearchList(
        '#catSearchInput', 
        '#catSearchResults', 
        'li[siteFunction="searchCatListItem"]', 
        '<li siteFunction="searchCatListItem">',
        '</li>',
        function(result) { console.log(result); }
    );
    
    /*
    setTagDetailsDataTable();
    setOpenTagCloudBtn();
    setTagButtons();
    setPageTagButtons();
    showTagDetails(readQueryString());

    // from saved-items.js
    setSaveForLaterReadStatus();
    setRemoveFromSavedItemsStatus();
    setSaveForLaterRead();
    setRemoveFromSavedItems();
    */
}
// work ends here

/*
const setPageTagButtons = () => {
    $(window).on('load', () => {
        $('button[siteFunction="pageTagButton"]').click( function() {
            const selectedTag = $(this).attr('id');
            showTagDetails(selectedTag.match(/pageTag_(.*)/)[1]);
            setSaveForLaterReadStatus();
            setRemoveFromSavedItemsStatus();
        } );
    });
}

const setTagButtons = () => {
    $(window).on('load', () => {
        $('button[siteFunction="tagButton"]').click( function() {
            const selectedTag = $(this).attr('id');
            showTagDetails(selectedTag);
            setSaveForLaterReadStatus();
            setRemoveFromSavedItemsStatus();
        } );
    });
}

const showTagDetails = (tag) => {
    if ( !tag ) return
    $(`div[siteFunction="tagDetails"][tagReference="${tag}"]`).removeClass('d-none');
    $(`div[siteFunction="tagDetails"][tagReference!="${tag}"]`).addClass('d-none');
    $(`div[siteFunction="tagDetails"][tagReference="${tag}"]`).fadeIn();
    history.replaceState({}, document.title, window.location.pathname);
}

const setTagDetailsDataTable = () => {
    setDataTable(
        'TagInfo', 
        'table[siteFunction="tagDetailsPageTable"]', 
        [null, { searchable: false }, null, null]
    )
}

const setOpenTagCloudBtn = () => {
    $(document).ready(function ()  {
        $('#openTagCloud').click(function() {
            $('#cloud_tag_container').fadeIn();
        });
    });
}
*/