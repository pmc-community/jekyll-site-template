// Let's do some work
const setTagsSupport = () => {
   
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
        
    
    $(document).ready(()=> {
        setCustomTagCloud();
        updateTagSearchList();
        setTagSearchList();
    });
    
    // from utilities.js
    removeObservers('.offcanvas class=hiding getClass=true');
    setElementChangeClassObserver('.offcanvas', 'hiding', true, () => {
        setSaveForLaterReadStatus();
        setRemoveFromSavedItemsStatus();
        setCustomTagCloud();
        updateTagSearchList();
        setTagSearchList();
        setPageOtherCustomTags(pageInfo);
    });

}
// work ends here

// FUNCTIONS
const setPageOtherCustomTags = (pageInformation) => {

    const getCustomTagButtonElement = (tag) => {
        return (
            `
                <button 
                    siteFunction="pageTagButton"
                    tagType="customTag" 
                    id="${tag}" 
                    type="button" 
                    class="focus-ring focus-ring-warning px-3 mr-2 my-1 btn btn-sm btn-success position-relative"
                    title = "Details for tag ${tag}">
                    ${tag}
                </button>
            `
        )
    }

    const customTags = getPageTags(pageInformation);
    if ( customTags.length > 0 ) {

        const $pageOtherTagsElement = $(`td[colFunction="tagInfoTagTablePageOtherTags"][pageTitleReference="${pageInformation.siteInfo.title}"][pagePermalinkReference="${pageInformation.siteInfo.permalink}"]`);

        const $pageOtherCustomTagElement = $(`td[colFunction="tagInfoTagTablePageOtherTags"][pageTitleReference="${pageInformation.siteInfo.title}"][pagePermalinkReference="${pageInformation.siteInfo.permalink}"] button[siteFunction="pageTagButton"][tagType="customTag"]`);


        if ( $pageOtherTagsElement.length > 0 ) {
            $pageOtherCustomTagElement.remove(); 
            customTags.forEach(tag => {
                $pageOtherTagsElement.each(function() {
                    $(this).children().first().append($(getCustomTagButtonElement(tag)))
                })
            });
        }
    }

}

const setTagSearchList = () => {
    setSearchList(
        '#tagSearchInput', 
        '#tagSearchResults', 
        'li[siteFunction="searchTagListItem"]', 
        '<li siteFunction="searchTagListItem">',
        '</li>',
        function(result) { showTagDetails(result);}
    );
}

const updateTagSearchList = () => {
    getCustomTagListElement = (tag) => {
        return (
            `
                <li 
                    siteFunction="searchTagListItem"
                    tagType="customTag"
                    tagReference="${tag}">
                    ${tag}
                </li>
            `
        );
    }

    $('li[tagType="customTag"]').remove();
    globCustomTags.forEach(tag => {
        $('ul[siteFunction="searchTagList"]').append($(getCustomTagListElement(tag)));
    });
}

const setCustomTagCloud = () => {

    const getTagCloudElement = (tag, numPages) => {
         
        return  (
            `
                <button 
                    siteFunction="tagButton" 
                    tagType="customTag"
                    id="${tag}" type="button" 
                    class="focus-ring focus-ring-warning px-3 mr-5 my-2 btn btn-sm btn-success position-relative"
                    title = "Details for tag ${tag}">
                    ${tag}
                    <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill text-bg-warning">
                        ${numPages}
                    </span>
                </button>
            `
        );
    } 

    $('button[tagType="customTag"]').remove();
    globCustomTags.forEach(tag => {
        $('div[siteFunction="tagCloudContainerBody"]').append($(getTagCloudElement(tag, getTagPages(tag))));
    });
}

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
    if ( tag === '' ) return;

    const siteTagPageNo = tagList.includes(tag) ? tagDetails[tag].numPages : 0;
    const customTagPageNo = tagList.includes(tag) ? 0 : getTagPages(tag);
    if (siteTagPageNo + customTagPageNo === 0 ) return;

    if (siteTagPageNo === 0 && customTagPageNo > 0 ) {
        console.log(tag);
        return; // TO BE REMOVED WHEN CUSTOM TAGS FUNCTIONALITY WILL BE ADDED
    }

    $(`div[siteFunction="tagDetails"][tagReference="${tag}"]`).removeClass('d-none');
    $(`div[siteFunction="tagDetails"][tagReference!="${tag}"]`).addClass('d-none');
    $(`div[siteFunction="tagDetails"][tagReference="${tag}"]`).fadeIn();

    if( $.fn.DataTable.isDataTable(`table[tagReference="${tag}"]`) ) {
        //console.log($(`table[tagReference="${tag}"]`).prop('outerHTML'));
        $(`table[tagReference="${tag}"]`).DataTable().destroy();
        $(`table[tagReference="${tag}"]`).removeAttr('id').removeAttr('aria-describedby')
        //console.log($(`table[tagReference="${tag}"]`).prop('outerHTML'));
    }
    
    // exceptWhenRowSelect: true to make the column inactive when click in a table row
    // this is a custom column configuration, not a standard DataTables column configuration
    // is good to be used for columns having already a functional role in the table (such as buttons)
    setDataTable(
        `table[tagReference="${tag}"]`,
        tag.trim().replace(/\s+/g, "_"),
        
        // columns settings
        [
            // page name
            {
                className: 'alwaysCursorPointer' 
            }, 

            // last update
            {
                type: 'date', 
                className: 'dt-left', 
                exceptWhenRowSelect: true
            }, 

            // action buttons
            { 
                searchable: false, 
                orderable: false, 
                exceptWhenRowSelect: true
            }, 
            
            // excerpt
            {
                exceptWhenRowSelect: true
            }, 

            // other tags
            {
                exceptWhenRowSelect: true
            }
        ],

        (table) => { postProcessTagDetailsTable(table, tag) },
        (rowData) => { processTagDetailsTableRowClick(rowData, `table[tagReference="${tag}"]`, tag) },
        {
            scrollX:true,
            fixedColumns: {
                "left": 1
            }
        }
    );

    history.replaceState({}, document.title, window.location.pathname);
}

const processTagDetailsTableRowClick = (rowData, tableSelector, tag) => {
    // tags may contain spaces 
    // so we need to extract them from the html to prevent .split(' ') to provide wrong tags
    const extractTags = (tags) => {
        const tempElement = document.createElement('div');
        tempElement.innerHTML = `${tags}`;
        const buttons = tempElement.querySelectorAll('button');
        const buttonTexts = Array.from(buttons).map(button => button.textContent.trim());
        return buttonTexts;
    }

    const extractPermalink = (actionsHtml) => {
        const tempElement = document.createElement('div');
        tempElement.innerHTML = `${actionsHtml}`;
        const linkToDoc = tempElement.querySelector('a[siteFunction="tagPageItemLinkToDoc"]');
        return linkToDoc.getAttribute('href');
    }

    // process rowData when click on row
    const cleanRowData = rowData.data.map(element => element.replace(/<[^>]*>/g, '').trim().replace(/\s+/g, ' '));
    cleanRowData[4] = extractTags(rowData.data[4]);
    const permalink = extractPermalink(rowData.data[2]);
    const title = cleanRowData[0];

    pageInfo = {
        siteInfo: getObjectFromArray ({permalink: permalink, title: title}, pageList),
        savedInfo: getPageSavedInfo (permalink, title)
    };
    
    showPageFullInfoCanvas(pageInfo);
}

const postProcessTagDetailsTable = (table, tag) => {
    if(table) {
        addAdditionalButtons(table, tag);
        addCustomTagsToPages(table, tag);
    }   
}

const addCustomTagsToPages = (table) => {
    const nodes = table.rows().nodes();

    $.each(nodes, function(index, node) {
        const title = $(node.outerHTML).attr('pageTitleReference');
        const permalink = $(node.outerHTML).attr('pagePermalinkReference');
        const pageInformation = {
            siteInfo: {
                title: title,
                permalink: permalink
            }
        };
        
        setPageOtherCustomTags(pageInformation)

    });
}

const addAdditionalButtons = (table, tag) => {
     // post processing table: adding 2 buttons in the bottom2 zone
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

const setOpenTagCloudBtn = () => {
    $(document).ready(function ()  {
        $('#openTagCloud').click(function() {
            $('#cloud_tag_container').fadeIn();
        });
    });
}