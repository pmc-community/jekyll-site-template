// Let's do some work
const setTagsSupport = () => {
    setSearchList(
        '#tagSearchInput', 
        '#tagSearchResults', 
        'li[siteFunction="searchTagListItem"]', 
        '<li siteFunction="searchTagListItem">',
        '</li>',
        function(result) { showTagDetails(result);}
    );
    //setTagDetailsDataTable();
    setOpenTagCloudBtn();
    setTagButtons();
    setPageTagButtons();

    requestedTag = readQueryString('tag');
    if (requestedTag) showTagDetails(requestedTag);

    // from saved-items.js
    setSaveForLaterReadStatus();
    setRemoveFromSavedItemsStatus();
    setSaveForLaterRead();
    setRemoveFromSavedItems();
}
// work ends here
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
    if ( !tag ) return;
    if ( tag === 'undefined' ) return;
    $(`div[siteFunction="tagDetails"][tagReference="${tag}"]`).removeClass('d-none');
    $(`div[siteFunction="tagDetails"][tagReference!="${tag}"]`).addClass('d-none');
    $(`div[siteFunction="tagDetails"][tagReference="${tag}"]`).fadeIn();

    const $table = $(`table[tagReference="${tag}"]`).DataTable();
    if ($.fn.DataTable.isDataTable($table)) $table.destroy();
    setDataTable(
        'TagInfo', 
        `table[tagReference="${tag}"]`, 
        [null, { searchable: false, orderable: false}, null, null],
        (table) => {
            if(table) {
                console.log( `created: ${$(table.table().node()).attr('id')} for tag ${$(table.table().node()).attr('tagReference')}`);

                gotToCatBtn = {
                    attr: {
                        siteFunction: 'tableNavigateToCategories',
                        title: 'Go to categories'
                    },
                    className: 'btn-warning btn-sm text-light focus-ring focus-ring-warning mb-2',
                    text: 'Categories',
                    action: () => {
                        window.location.href = '/cat-info'
                    }
                }

                gotToSavedItemsBtn = {
                    attr: {
                        siteFunction: 'tableNavigateToSavedItems',
                        title: 'Go to saved items'
                    },
                    className: 'btn-success btn-sm text-light focus-ring focus-ring-warning mb-2',
                    text: 'Saved items',
                    action: () => {
                        window.location.href = '/cat-info'
                    }
                }
                
                const btnArray = [];
                btnArray.push(gotToCatBtn);
                btnArray.push(gotToSavedItemsBtn);
                addAdditionalButtonsToTable(table, `table[tagReference="${tag}"]`, 'bottom2', btnArray);
            }
        }
    );

    history.replaceState({}, document.title, window.location.pathname);
}

// HEADS UP!!!
// this is not used anymore, datatable are created when activating a tad details view
// otherwise will have the features set at create time and will not be modified dynamically
// i.e. the head will not cover the whole table width when srollX is true or will not be responsive
const setTagDetailsDataTable = () => {
    // creating tables one-by-one to be able to do potential post-processing on callback
    $('table[siteFunction="tagDetailsPageTable"]').each(function() {
        setDataTable(
            'TagInfo', 
            `table[tagReference="${$(this).attr('tagReference')}"]`, 
            [null, { searchable: false, orderable: false}, null, null],
            (table) => {
                table.responsive.rebuild();
                table.responsive.recalc();
                table.columns.adjust().draw();
                console.log( `created: ${$(table.table().node()).attr('id')} for tag ${$(table.table().node()).attr('tagReference')}`);
            }
        )
    });
    
}

const setOpenTagCloudBtn = () => {
    $(document).ready(function ()  {
        $('#openTagCloud').click(function() {
            $('#cloud_tag_container').fadeIn();
        });
    });
}
