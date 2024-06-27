// Let's do some work
const setCatSupport = () => {

    $(document).ready(() => {
        setCatSearchList();
        setCatInfoPageButtonsFunctions();


        requestedCat = readQueryString('cat');
        if (requestedCat) showCatDetails(requestedCat);
    });
    
}
// work ends here

// FUNCTIONS
const setCatInfoPageButtonsFunctions = () => {

    // click "Categories" button and show the cat cloud container
    $('#openCatCloud').off('click').click(function() {
        $('#cloud_cat_container').fadeIn();
    });

    // click on cat button in the tag cloud and show the cat details table
    // delegate listener at document level since buttons are dynamically added/removed/modified
    $(document)
        .off('click', 'button[siteFunction="catButton"]')
        .on('click', 'button[siteFunction="catButton"]', function() {
            const selectedCat = $(this).attr('id');
            showCatDetails(selectedCat);
            //setPageSavedButtonsStatus(); 
        });

}

const setCatSearchList = () => {
    setSearchList(
        '#catSearchInput', 
        '#catSearchResults', 
        'li[siteFunction="searchCatListItem"]', 
        '<li siteFunction="searchCatListItem">',
        '</li>',
        false,
        (result) => { showCatDetails(result); },
        (filteredList) => { updateCatSearchListItems(filteredList); }
    );
}

const showCatDetails = (cat) => {
    console.log(cat);

    history.replaceState({}, document.title, window.location.pathname);
}

const updateCatSearchListItems = (filteredList) => {
    console.log(filteredList)
}