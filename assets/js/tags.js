// Let's do some work

const setTagsSupport = () => {

    $(document).ready(()=> {
    
        setPageSavedButtonsStatus();  
        setCustomTagCloud();
        setTagInfoPageButtonsFunctions();
        updateTagSearchList();
        setTagSearchList();
        setTagCloudButtonsContextMenu();
        setPageTagButtonsContextMenu();

        requestedTag = readQueryString('tag');
        if (requestedTag) showTagDetails(requestedTag);
    });
    
    // from utilities.js
    removeObservers('.offcanvas class=hiding getClass=true');
    setElementChangeClassObserver('.offcanvas', 'hiding', true, () => {
        setPageSavedButtonsStatus();
        
        // tag was passed to pageInfo global before opening the offcanvas 
        // in order to preserve the reference to the active tag details datatable
        // see processTagDetailsTableRowClick
        updateAllTagInfoOnPage(pageInfo.tag);

        // check if the active tag details is for a tag that still exists and close the details if not
        const activeTagDetails = $('div[siteFunction="tagDetails"]:not(.d-none)').attr('tagReference') || '';
        if (!globAllTags.includes(activeTagDetails.trim())) 
            $('div[siteFunction="tagDetails"]:not(.d-none)').remove();
        else {
            $('div[siteFunction="tagDetails"]:not(.d-none)').addClass('d-none');
            showTagDetails(pageInfo.tag)
        }

    });

}
// work ends here

// FUNCTIONS
const updateAllTagInfoOnPage = (tagForActiveTagDetailsTable = null) => {
    createGlobalLists();
    setCustomTagCloud(); //only custom tags are dynamic, site tags don't need update since cannot be modified
    updateTagSearchList(); //update the tag search list items to have all custom tags modifications
    setTagSearchList(); //tag search list must be recreated after the update of the list items
    if (tagForActiveTagDetailsTable) 
        addCustomTagsToPages(null, tagForActiveTagDetailsTable); //update custom tags for the pages in the active tag details datatable
}

const setTagInfoPageButtonsFunctions = () => {

    // click "Tag Cloud" button and show the tag cloud container
    $('#openTagCloud').off('click').click(function() {
        $('#cloud_tag_container').fadeIn();
    });

    // click on tag button in the tag cloud and show the tag details table
    // delegate listener at document level since buttons are dynamically added/removed/modified
    $(document)
        .off('click', 'button[siteFunction="tagButton"]')
        .on('click', 'button[siteFunction="tagButton"]', function() {
            const selectedTag = $(this).attr('id');
            showTagDetails(selectedTag);
            setPageSavedButtonsStatus(); 
        });

    // click on the tag button in tag details table and show the details table for the clicked tag
    // delegate listener at document level since buttons are dynamically added/removed/modified
    $(document)
        .off('click', 'button[siteFunction="pageTagButton"]')
        .on('click', 'button[siteFunction="pageTagButton"]', function(event) {
            const handlePageTagButtonClick = (event) => {
                const selectedTag = $(event.target).attr('id');
                showTagDetails(selectedTag.match(/pageTag_(.*)/)[1]);
                setPageSavedButtonsStatus(); 
            }   
            handlePageTagButtonClick(event);
        });

    // remove page from saved items
    // delegate event handler to document since the buttons are not available when setting the listener
    $(document)
        .off('click', 'button[siteFunction="tagPageItemRemoveFromSavedItems"]')
        .on('click', 'button[siteFunction="tagPageItemRemoveFromSavedItems"]', function() {
            const pageToRemove = {
                siteInfo: {
                    permalink: $(this).attr('pageRefPermalink'),
                    title: $(this).attr('pageRefTitle')
                }
            }
            removePageFromSavedItems(pageToRemove);
            setPageSavedButtonsStatus();
            updateAllTagInfoOnPage($(this).attr('tagForTagTableDetailsReference'));
        });

    // save page to saved items
    // delegate event handler to document since the buttons are not available when setting the listener
    $(document)
        .off('click', 'button[siteFunction="tagPageItemSaveForLaterRead"]')
        .on('click', 'button[siteFunction="tagPageItemSaveForLaterRead"]', function() {
            const pageToSave = {
                siteInfo: {
                    permalink: sanitizeURL($(this).attr('pageRefPermalink')),
                    title: DOMPurify.sanitize($(this).attr('pageRefTitle')),
                    customTags: [],
                    customCategories: [],
                    customNotes:[]
                }
            }
            savePageToSavedItems(pageToSave);
            setPageSavedButtonsStatus();
            updateAllTagInfoOnPage($(this).attr('tagForTagTableDetailsReference'));
        });

    // update tag for all pages when click "Update" in the context menu for custom tags in tag cloud
    // delegate event handler to document since the buttons are not available when setting the listener
    $(document)
        .off('click', 'button[siteFunction="tagCloudEditCustomTag"]')
        .on('click', 'button[siteFunction="tagCloudEditCustomTag"]', handleTagUpdate);

    // update tag for a page when click "Update" in the context menu for custom tags in page tag column from a datatable
    // delegate event handler to document since the buttons are not available when setting the listener
    $(document)
        .off('click', 'button[siteFunction="pageTagEditCustomTag"]')
        .on('click', 'button[siteFunction="pageTagEditCustomTag"]', handlePageTagUpdate);
    
    // add tag for a page when click "Add" in the context menu for custom tags in page tag column from a datatable
    // delegate event handler to document since the buttons are not available when setting the listener
    $(document)
        .off('click', 'button[siteFunction="pageTagAddCustomTag"]')
        .on('click', 'button[siteFunction="pageTagAddCustomTag"]', handlePageTagAdd);

}

const setPageTagButtonsContextMenu = () => {

    const getMenuItemHtml = (title, text, icon) => {
        return `
            <li title="${title}">
                <a class="icon-link">
                    <i class="bi ${icon}"></i>
                    <span class="tagAndCatContextMenu">${text}</span>
                </a>
            </li>`
    }

    const menuContent = 
    {   
        header: '',
        menu:[
            {
                html: getMenuItemHtml(`Remove the tag from page`,'Remove tag', 'bi-x-circle'),
                handler: handlePageTagDelete
            }
        ],
        footer: preFlight.envInfo.device.deviceType === 'desktop' ?
            `
                <input type="text" autocomplete="off" class="form-control my-2 d-none d-md-block" id="pageTagEditCustomTagInput">

                <div class="mb-2  d-none d-md-block">
                    <button 
                        siteFunction="pageTagEditCustomTag"
                        tagForTagTableDetailsReference="" 
                        tagReference=""
                        id="pageTagEditCustomTag" 
                        type="button" 
                        class="focus-ring focus-ring-warning btn btn-sm btn-warning mt-2 position-relative pageTagContextMenuFooterBtn">
                        Update      
                    </button>

                    <button 
                        siteFunction="pageTagAddCustomTag"
                        tagForTagTableDetailsReference="" 
                        tagReference=""
                        id="pageTagEditCustomTag" 
                        type="button" 
                        class="focus-ring focus-ring-warning btn btn-sm btn-success mt-2 position-relative pageTagContextMenuFooterBtn">
                        Add      
                    </button>
                </div>
            ` :
            ``
    };
    
    setContextMenu (
        'button[sitefunction="pageTagButton"]', 
        'body', 
        menuContent, 
        (menuItem, itemClicked) => {
            // get the menu item click handler and execute it            
            getContextMenuItemHandler(
                menuItem.text().replace(/[\n\r\t]/g, '').trim(), 
                menuContent
            ).bind(
                null,
                // page
                {
                    title: itemClicked.closest('td').attr('pageTitleReference'),
                    permalink: itemClicked.closest('td').attr('pagePermalinkReference')
                },

                // tag to be processed
                $(itemClicked.prop('outerHTML')).children().remove().end().text().replace(/[\n\r\t]/g, '').trim(),

                // tag for the active tag details datatable
                $('div[siteFunction="tagDetails"]:not(.d-none) button[sitefunction="tagForActiveTagDetailsDatatable"]').text().trim() 
            )();
        },
        (event) => {
            // tag to be processed
            const $tagBtn = $(event.target).closest('button[sitefunction="pageTagButton"][tagtype="customTag"]').clone();
            const tag = $($tagBtn.prop('outerHTML')).children().remove().end().text().replace(/[\n\r\t]/g, '').trim();
            $('#pageTagEditCustomTagInput').val(tag);
            if (preFlight.envInfo.device.deviceType === 'dsktop') $('#pageTagEditCustomTagInput').focus();

            // tag for active tag details datatable
            const tagForActiveTagDetailsDatatable = $('div[siteFunction="tagDetails"]:not(.d-none) button[sitefunction="tagForActiveTagDetailsDatatable"]').text().trim();
            
            // set needed attributes to the context menu footer buttons
            $('button[siteFunction="pageTagEditCustomTag"]').attr('tagForTagTableDetailsReference',tagForActiveTagDetailsDatatable);
            $('button[siteFunction="pageTagEditCustomTag"]').attr('tagReference', tag);

            $('button[siteFunction="pageTagAddCustomTag"]').attr('tagForTagTableDetailsReference',tagForActiveTagDetailsDatatable);
            $('button[siteFunction="pageTagAddCustomTag"]').attr('tagReference', tag);

            const page = {
                title: $(event.target).closest('td').attr('pageTitleReference'),
                permalink: $(event.target).closest('td').attr('pagePermalinkReference'),
            };

            $('button[siteFunction="pageTagEditCustomTag"]').attr('pageTitleReference', page.title);
            $('button[siteFunction="pageTagEditCustomTag"]').attr('pagePermalinkReference', page.permalink);

            $('button[siteFunction="pageTagAddCustomTag"]').attr('pageTitleReference', page.title);
            $('button[siteFunction="pageTagAddCustomTag"]').attr('pagePermalinkReference', page.permalink);

            // removing things that are not applicable to site tags
            if (_.findIndex(globCustomTags, item => item.toLowerCase() === tag.trim().toLowerCase()) === -1 ) {
                $('.context-menu-list').remove();
                $('button[sitefunction="pageTagEditCustomTag"]').remove();
                $('hr[sitefunction="contextMenuSeparator"]').remove();
            }

        },
        ['pageTagContextMenu'] //additonal class for the context menu container
    );
}

const handlePageTagDelete = (page = {}, tag, tagForActiveTagDetailsDatatable) => {

    if (!tag) return;
    if (tag === 'undefined') return;
    if (tag === '') return;

    if (!page) return;    
    if (!page.title) return;
    if (page.title === 'undefined') return;
    if (page.title === '') return;
    
    if (!page.permalink) return;
    if (page.permalink === 'undefined') return;
    if (page.permalink === '') return;

    deleteTagFromPage(tag, {siteInfo:page});
    updateAllTagInfoOnPage(tagForActiveTagDetailsDatatable);
    $('.context-menu').remove();

}

const handlePageTagUpdate = () => {
    const tag = cleanText($('#pageTagEditCustomTagInput').val());
    const oldTag = $('button[siteFunction="pageTagEditCustomTag"]').attr('tagReference');
    const title = $('button[siteFunction="pageTagEditCustomTag"]').attr('pageTitleReference');
    const permalink = $('button[siteFunction="pageTagEditCustomTag"]').attr('pagePermalinkReference');
    const page = {
        title: title,
        permalink: permalink
    };
    
    const tagForActiveTagDetailsDatatable = $('div[siteFunction="tagDetails"]:not(.d-none) button[sitefunction="tagForActiveTagDetailsDatatable"]').text().trim();

    updateTagForPage (oldTag, tag, {siteInfo:page})
    updateAllTagInfoOnPage(tagForActiveTagDetailsDatatable);
    $('.context-menu').remove();
}

const handlePageTagAdd = () => {
    const tag = cleanText($('#pageTagEditCustomTagInput').val());
    const title = $('button[siteFunction="pageTagAddCustomTag"]').attr('pageTitleReference');
    const permalink = $('button[siteFunction="pageTagAddCustomTag"]').attr('pagePermalinkReference');

    if (!tag) return;
    if (tag === 'undefined') return;
    if (tag === '') return;
    
    if (!title) return;
    if (title === 'undefined') return;
    if (title === '') return;
    
    if (!permalink) return;
    if (permalink === 'undefined') return;
    if (permalink === '') return;
    
    const page = {
        title: title,
        permalink: permalink
    };
    
    const tagForActiveTagDetailsDatatable = $('div[siteFunction="tagDetails"]:not(.d-none) button[sitefunction="tagForActiveTagDetailsDatatable"]').text().trim();

    addTag(tag, {siteInfo: page});
    updateAllTagInfoOnPage(tagForActiveTagDetailsDatatable);
    $('.context-menu').remove();
}

const setTagCloudButtonsContextMenu = () => {

    const getMenuItemHtml = (title, text, icon) => {
        return `
            <li title="${title}">
                <a class="icon-link">
                    <i class="bi ${icon}"></i>
                    <span class="tagAndCatContextMenu">${text}</span>
                </a>
            </li>`
    }

    const menuContent = 
    {   
        header: '',
        menu:[
            {
                html: getMenuItemHtml(`Remove the tag from all pages`,'Remove tag', 'bi-trash'),
                handler: handleTagRemoval
            }
        ],
        footer: preFlight.envInfo.device.deviceType === 'desktop' ?
            `
                <input type="text" autocomplete="off" class="form-control my-2 d-none d-md-block" id="tagCloudEditCustomTagInput">
                <button 
                    siteFunction="tagCloudEditCustomTag"
                    tagForTagTableDetailsReference="" 
                    tagReference=""
                    id="tagCloudEditCustomTag" 
                    type="button" 
                    class="focus-ring focus-ring-warning btn btn-sm btn-warning my-2 position-relative d-none d-md-block">
                    Update      
                </button>
            ` :
            ``
    };
    
    setContextMenu (
        'button[sitefunction="tagButton"][tagType="customTag"]', 
        'body', 
        menuContent, 
        (menuItem, itemClicked) => {
            // get the menu item click handler and execute it            
            getContextMenuItemHandler(
                menuItem.text().replace(/[\n\r\t]/g, '').trim(), 
                menuContent
            ).bind(
                null,
                // tag to be processed
                $(itemClicked.prop('outerHTML')).children().remove().end().text().replace(/[\n\r\t]/g, '').trim(),
                // tag for the active tag details datatable
                $('div[siteFunction="tagDetails"]:not(.d-none) button[sitefunction="tagForActiveTagDetailsDatatable"]').text().trim() 
            )();
        },
        (event) => {
            // tag to be processed
            const $tagBtn = $(event.target).closest('button[sitefunction="tagButton"][tagtype="customTag"]').clone();
            const tag = $($tagBtn.prop('outerHTML')).children().remove().end().text().replace(/[\n\r\t]/g, '').trim();
            $('#tagCloudEditCustomTagInput').val(tag);
            if (preFlight.envInfo.device.deviceType === 'dsktop') $('#tagCloudEditCustomTagInput').focus();

            // tag for active tag details datatable
            const tagForActiveTagDetailsDatatable = $('div[siteFunction="tagDetails"]:not(.d-none) button[sitefunction="tagForActiveTagDetailsDatatable"]').text().trim();
            
            $('button[siteFunction="tagCloudEditCustomTag"]').attr('tagForTagTableDetailsReference',tagForActiveTagDetailsDatatable);
            $('button[siteFunction="tagCloudEditCustomTag"]').attr('tagReference', tag);
        },
        ['tagCloudContextMenu'] //additonal class for the context menu container
    );
}

const handleTagUpdate = () => {
    const tag = cleanText($('#tagCloudEditCustomTagInput').val());

    const oldTag = $('button[siteFunction="tagCloudEditCustomTag"]').attr('tagReference');
    $('.context-menu').remove();

    if (!tag) return;
    if (tag === 'undefined') return;
    if (tag === '') return;

    
    if (!oldTag) return;
    if (oldTag === 'undefined') return;
    if (oldTag === '' ) return;

    if (!updateTagForAllPages(oldTag,tag)) return;
    createGlobalLists();
    
    const tagForActiveTagDetailsDatatable = $('div[siteFunction="tagDetails"]:not(.d-none) button[sitefunction="tagForActiveTagDetailsDatatable"]').text().trim();

    updateAllTagInfoOnPage(tagForActiveTagDetailsDatatable);

    // update the tag details card header if it is visible for the tag we update
    if (oldTag.toLowerCase() === tagForActiveTagDetailsDatatable.toLowerCase())
        $('button[sitefunction="tagForActiveTagDetailsDatatable"]').text(tag);
}

const handleTagRemoval = (tag, tagForActiveTagDetailsDatatable = null) => {
    if (!tag) return;
    if (tag === 'undefined') return;
    if (tag === '') return;

    if (!deleteTagFromAllPages(tag)) return;
    createGlobalLists();
    updateAllTagInfoOnPage(tagForActiveTagDetailsDatatable);

    // remove the tag details container id it is open for the tag we delete
    if (tag.toLowerCase() === tagForActiveTagDetailsDatatable.toLowerCase())
        $(`div[siteFunction="tagDetails"][tagReference="${tag}"]`).remove();

}

const setPageOtherCustomTags = (pageInformation, crtTag = null) => {

    const getCustomTagButtonElement = (tag) => {
        return (
            `
                <button 
                    siteFunction="pageTagButton"
                    tagType="customTag" 
                    tagReference="${tag}"
                    id="pageTag_${tag}" 
                    type="button" 
                    class="align-self-center text-nowrap focus-ring focus-ring-warning px-3 mr-2 my-1 btn btn-sm btn-success position-relative"
                    title = "Details for tag ${tag}">${tag}
                </button>
            `
        )
    }

    const customTags = _.pull(getPageTags(pageInformation), crtTag);

    const $pageOtherTagsElement = $(`td[colFunction="tagInfoTagTablePageOtherTags"][pageTitleReference="${pageInformation.siteInfo.title}"][pagePermalinkReference="${pageInformation.siteInfo.permalink}"]`);

    const $pageOtherCustomTagElement = $(`td[colFunction="tagInfoTagTablePageOtherTags"][pageTitleReference="${pageInformation.siteInfo.title}"][pagePermalinkReference="${pageInformation.siteInfo.permalink}"] button[siteFunction="pageTagButton"][tagType="customTag"]`);
    
    $pageOtherCustomTagElement.remove();
    
    customTags.forEach(tag => {        

        // remove potential wrong display of a customTag as siteTag
        const $pageOtherCustomTagElement__WRONG = $(`td[colFunction="tagInfoTagTablePageOtherTags"][pageTitleReference="${pageInformation.siteInfo.title}"][pagePermalinkReference="${pageInformation.siteInfo.permalink}"] button[siteFunction="pageTagButton"][tagType="siteTag"][tagReference="${tag}"]`);
        $pageOtherCustomTagElement__WRONG.remove();

        $pageOtherTagsElement.each(function() {
            $(this).children().first().append($(getCustomTagButtonElement(tag)))
        })
    });

}

const setTagSearchList = () => {
    setSearchList(
        '#tagSearchInput', 
        '#tagSearchResults', 
        'li[siteFunction="searchTagListItem"]', // this will be updated in callbackFilteredList to add specific tag attributes, based on tag type
        '<li siteFunction="searchTagListItem">',
        '</li>',
        false, // case insensitive
        (result) => { showTagDetails(result); },
        (filteredList) => { updateTagSearchListItems(filteredList); },
        preFlight.envInfo
    );
}

const updateTagSearchListItems = (list) => {
    $('li[sitefunction="searchTagListItem"]').each(function() {
        $(this).attr('tagReference', $(this).text().trim());
        $(this).attr(
            'tagType', 
            _.findIndex(globCustomTags, item => item.toLowerCase() === $(this).text().trim().toLowerCase()) === -1 ? 
                'siteTag' : 
                'customTag'
        );
    });
}

const updateTagSearchList = () => {
    getTagType = (tag) => {
        return _.findIndex(globCustomTags, item => item.toLowerCase() === tag.toLowerCase()) === -1 ? 'siteTag' : 'customTag'
    }

    getCustomTagListElement = (tag) => {
        return (
            `
                <li 
                    siteFunction="searchTagListItem"
                    tagType="${getTagType(tag)}"
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

// here we set the datatable with tag details
const showTagDetails = (tag) => {

    if ( !tag ) return;
    if ( tag === 'undefined' ) return;
    if ( tag === '' ) return;

    const siteTagPageNo = tagList.includes(tag) ? tagDetails[tag].numPages : 0;
    const customTagPageNo = tagList.includes(tag) ? 0 : getTagPages(tag);
    if (siteTagPageNo + customTagPageNo === 0 ) return;

    $(`div[siteFunction="tagDetails"]`).addClass('d-none');
    $('div[siteFunction="tagDetails"]').removeAttr('style'); 

    if( $.fn.DataTable.isDataTable(`table[tagReference="${tag}"]`) ) {
        $(`table[tagReference="${tag}"]`).DataTable().destroy();
    }

    let tableData = [];
    if (siteTagPageNo === 0 && customTagPageNo > 0 ) {
        tableData = buildTagPagesListForCustomTag(tag);
        createSimpleTable(tag, tableData);
    }

    // columns settings
    // always a good idea to set the data mapping for each column
    // maybe we need to replace the datatable rows from a dynamic source and we would need the data mapping

    // exceptWhenRowSelect: true to make the column inactive when click in a table row (click on that column dows not trigger the click on row event)
    // this is a custom column configuration, not a standard DataTables column configuration
    // is good to be used for columns having already a functional role in the table (such as buttons)
    const colDefinition = [
        // page name
        {
            data: 'pageTitle',
            className: 'alwaysCursorPointer',
            title:'Title',
            createdCell: function(td, cellData, rowData, row, col) {
                $(td)
                    .attr('siteFunction', 'tagInfoTagTablePageTitle')
                    .attr('title', `Click here for more info about page ${cellData.replace(/<\/?[^>]+(>|$)/g, "")}`)
                    .attr('tagReference', `${tag}`)
                    .attr('colFunction', 'pageTitle')
                    .addClass('fw-normal align-self-center align-middle border-bottom border-secondary border-opacity-25');
            }
        }, 

        // last update
        {
            data: 'pageLastUpdate',
            title:'Last Update',
            type: 'date-dd-MMM-yyyy', 
            className: 'dt-left', 
            exceptWhenRowSelect: true,
            createdCell: function(td, cellData, rowData, row, col) {
                $(td)
                    .attr('siteFunction', 'tableDateField')
                    .attr('tagReference', `${tag}`)
                    .attr('colFunction', 'pageLastUpdate')
                    .addClass('fw-normal align-self-center align-middle border-bottom border-secondary border-opacity-25');
            }
        }, 

        // action buttons
        { 
            data: 'pageActions',
            title:'Actions',
            type: 'string',
            searchable: false, 
            orderable: false, 
            exceptWhenRowSelect: true,
            createdCell: function(td, cellData, rowData, row, col) {
                $(td)
                    .attr('tagReference', `${tag}`)
                    .attr('colFunction', 'pageActions')
                    .addClass('fw-normal align-self-center align-middle border-bottom border-secondary border-opacity-25')
                    .removeClass('dt-type-numeric');
            }

        }, 
        
        // excerpt
        {
            data: 'pageExcerpt',
            type: 'string',
            title:'Excerpt',
            exceptWhenRowSelect: true,
            width: '30%',
            visible: false,
            createdCell: function(td, cellData, rowData, row, col) {
                $(td)
                    .attr('tagReference', `${tag}`)
                    .attr('colFunction', 'pageExcerpt')
                    .addClass('fw-normal align-self-center align-middle border-bottom border-secondary border-opacity-25');
            }
        }, 

        // other tags
        {
            data: 'pageOtherTags',
            title:'Other Tags',
            type: 'string',
            exceptWhenRowSelect: true,
            width: '400px',
            createdCell: function(td, cellData, rowData, row, col) {
                const permalink = $(rowData.pageActions).find('[siteFunction="tagPageItemLinkToDoc"]').attr('href');
                $(td)
                    .attr('tagReference', `${tag}`)
                    .attr('colFunction', 'tagInfoTagTablePageOtherTags')
                    .attr('pageTitleReference', `${rowData.pageTitle.replace(/<\/?[^>]+(>|$)/g, "").trim()}`)
                    .attr('pagePermalinkReference', `${permalink.trim()}`)
                    .addClass('fw-normal align-self-center align-middle border-bottom border-secondary border-opacity-25');
                if(preFlight.envInfo.device.deviceType === 'mobile') {
                    $(td).children().first().addClass('d-flex');
                }
            }
        }
    ];

    const commonAdditionalTableSettings = {

        scrollX:true,

        fixedColumns: {
            "left": 1
        },

        "createdRow": function(row, data, dataIndex) {
            const permalink = $(data.pageActions).find('[siteFunction="tagPageItemLinkToDoc"]').attr('href');
            $(row)
                .attr('siteFunction', 'tagInfoTagTablePageRow')
                .attr('tagReference', `${tag}`)
                .attr('pageTitleReference', `${data.pageTitle.replace(/<\/?[^>]+(>|$)/g, "").trim()}`)
                .attr('pagePermalinkReference', `${permalink.trim()}`);
        }
    }; 

    const additionalTableSettings = tableData.length === 0 ? 
        commonAdditionalTableSettings : 
        {...commonAdditionalTableSettings, data:tableData};

    setDataTable(
        `table[tagReference="${tag}"]`,
        `TagPages_${tag.trim()}`,     
        colDefinition,
        (table) => { postProcessTagDetailsTable(table, tag) }, // will execute after the table is created
        (rowData) => { processTagDetailsTableRowClick(rowData, `table[tagReference="${tag}"]`, tag) }, // will execute when click on row
        additionalTableSettings // additional datatable settings for this table instance
    );
    
    if (_.map(globCustomTags, _.toLower).includes(tag.toLowerCase())) setTagInfoPageSearchList(tag);
    history.replaceState({}, document.title, window.location.pathname);

    $(`div[siteFunction="tagDetails"][tagReference="${tag}"]`).removeClass('d-none');
    $(`div[siteFunction="tagDetails"][tagReference="${tag}"]`).fadeIn();
}

const showTagDetails__ASYNC = (tag) => {
    return new Promise ( (resolve, reject) => {
        showTagDetails(tag);
        resolve();
    });
}

const createSimpleTable = (tag, tableData) => {

    const tagDetailsCardHeader = (tag) => {
        return (
            `
                <div class="card-header d-flex justify-content-between border-bottom border-secondary border-opacity-25">
                    <span class="fs-6 fw-medium">Tag:
                        <button 
                            siteFunction="tagForActiveTagDetailsDatatable" id="${tag}" 
                            type="button" 
                            class="px-3 ml-1 btn btn-sm btn-success position-relative">
                            ${tag}       
                        </button>
                    </span>
                    <button 
                        siteFunction="btnClose" 
                        whatToClose="div[tagReference=&quot;${tag.trim()}&quot;]" 
                        type="button" class="btn-close" 
                        aria-label="Close">
                    </button>
                 </div>
            `
        );
    }

    const cardDetailsCardBody = (tag) => {
        return (
            `
                <div class="card-body">
                    <table style="display:none" siteFunction="tagDetailsPageTable" class="table table-hover" tagReference="${tag}">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th siteFunction="tableDateField">Last Update</th>
                                <th>Actions</th>
                                <th>Excerpt</th>
                                <th>Other Tags</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `
        );
    }

    $(`div[siteFunction="tagDetails"][tagReference="${tag}"]`).remove();
    const $tagDetailsContainer = $(`<div tagReference="${tag}" siteFunction="tagDetails" class="d-none card shadow bg-transparent border border-secondary border-opacity-25">`);
    $tagDetailsContainer.append($(tagDetailsCardHeader(tag)));
    $tagDetailsContainer.append($(cardDetailsCardBody(tag)));
    $('div[id="tag_details"]').append($tagDetailsContainer);
    // small delay to avoid visibility of white table background for dummy table on dark theme
    setTimeout(()=>{$(`table[siteFunction="tagDetailsPageTable"][tagReference="${tag}"]`).removeAttr('style')} ,100);

}

const buildTagPagesListForCustomTag = (tag) => {
    let tableData = [];

    const colPageTitle = (title) => {
        return `<span>${title}</span>`
    }

    const colPageLastUpdate = (date) => {
        return `<span>${date}</span>`
    }

    const colPageExcerpt = (excerpt) => {
        return `<span>${excerpt}</span>`
    }
    
    const colPageActions = (tag, permalink, title) => {

        return (
            `
                <div class="btn-group"> 
                    <a 
                        siteFunction="tagPageItemLinkToDoc" 
                        class="btn btn-sm btn-info" 
                        href="${permalink}" 
                        title="Read page ${title}" 
                        tagForTagTableDetailsReference="${tag}" 
                        target="_blank"> 
                        <i class="bi bi-book" style="font-size:1.2rem"></i> 
                    </a> 
                    
                    <button 
                        siteFunction="tagPageItemSaveForLaterRead" 
                        pageRefPermalink="${permalink}" 
                        pageRefTitle="${title}" 
                        class="btn btn-sm btn-success disabled" 
                        title="Save page ${title} for later read" 
                        tagForTagTableDetailsReference="${tag}"> 
                        <i class="bi bi-bookmark-plus" style="font-size:1.2rem"></i> 
                    </button>
                    
                    <button 
                        siteFunction="tagPageItemRemoveFromSavedItems" 
                        pageRefPermalink="${permalink}" 
                        pageRefTitle="${title}" 
                        class="btn btn-sm btn-warning" 
                        title="Remove page ${title} from saved documents" 
                        tagForTagTableDetailsReference="${tag}"> 
                        <i class="bi bi-bookmark-x" style="font-size:1.2rem"></i> 
                    </button>
                </div>
            `
        )   // format the output string to look nice
            .replace(/[\n\t]/g, '') // remove newlines and tabs
            .replace(/\s\s+/g, ' ') // replace multiple spaces with single space
            .replace(/>\s+</g, '><') // remove spaces between > <
            .replace(/\s+</g, '<') // remove spaces before <
            .replace(/>\s+/g, '>'); // remove spaces after >
    }

    const colPageOtherTags = (tag, pageOtherTags) => {

        const otherTagBtnItem = (tag) => {
        
            const tagType = _.findIndex(globCustomTags, item => item.toLowerCase() === tag.trim().toLowerCase()) > 0 ?
                'customTag' :
                'siteTag';
            
            const tagBtnType = _.findIndex(globCustomTags, item => item.toLowerCase() === tag.trim().toLowerCase()) > 0 ? 
                'btn-success' : 
                'btn-primary';
    
            return (
                `
                    <button 
                        siteFunction="pageTagButton" 
                        tagType="${tagType}" 
                        tagReference="${tag}" 
                        id="pageTag_${tag}" 
                        type="button" 
                        class="focus-ring focus-ring-warning px-3 mr-2 my-1 btn btn-sm ${tagBtnType} position-relative" 
                        title="Details for tag ${tag}"> 
                        ${tag} 
                    </button>
                `
            );
        }

        let buttons = '';
        pageOtherTags.forEach(tag => { buttons += otherTagBtnItem(tag); });

        buttons = '<span>' + buttons + '</span>';
        buttons = buttons
            .replace(/[\n\t]/g, '') // remove newlines and tabs
            .replace(/\s\s+/g, ' ') // replace multiple spaces with single space
            .replace(/>\s+</g, '><') // remove spaces between > <
            .replace(/\s+</g, '<') // remove spaces before <
            .replace(/>\s+/g, '>'); // remove spaces after >
        return buttons;

    }

    getArrayOfTagSavedPages(tag).forEach(page => {
        const sitePage = getObjectFromArray ({permalink: page.permalink, title: page.title}, pageList);

        const pageTitle = colPageTitle(page.title);
        const pageLastUpdate = colPageLastUpdate(formatDate(sitePage.lastUpdate));
        const pageExcerpt = colPageExcerpt(sitePage.excerpt);
        const pageActions = colPageActions(tag, page.permalink, page.title);
        
        const pageOtherTags = _.uniq(_.pull(
            [
                ...sitePage.tags.sort(), 
                ...getPageTags({siteInfo:{permalink:page.permalink, title: page.title}}).sort()
            ], 
            tag
        )); // get all site and custom tags, except for the one which was clicked
        
        tableData.push({
            pageTitle: pageTitle,
            pageLastUpdate: pageLastUpdate,
            pageActions: pageActions,
            pageExcerpt: pageExcerpt,
            pageOtherTags: colPageOtherTags(tag, pageOtherTags)
        });
    });

    return tableData;
}

const processTagDetailsTableRowClick = (rowData, tableSelector, tag) => {

    // tags may contain spaces 
    // so we need to extract them from the html to prevent .split(' ') to provide wrong tags
    // NOT USED
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

    const stripHtml = (html) => {
        return html.replace(/<\/?[^>]+(>|$)/g, "").trim();
      };

    // process rowData when click on row
    const cleanRowData  = _.mapValues(rowData.data, stripHtml);
    const permalink = extractPermalink(rowData.data.pageActions);
    const title = cleanRowData.pageTitle;

    pageInfo = {
        siteInfo: getObjectFromArray ({permalink: permalink, title: title}, pageList),
        savedInfo: getPageSavedInfo (permalink, title),
        tag:tag //need to pass tag too because we need a reference to the tag details datatable when returning from page info offcanvas
    };
    
    showPageFullInfoCanvas(pageInfo);
}

const postProcessTagDetailsTable = (table, tag) => {
    if(table) {
        addAdditionalButtons(table, tag);
        addCustomTagsToPages(table, tag);
    }   
}

const addCustomTagsToPages = (table = null, tag = null) => {
    if (!table && !tag) return;

    let nodes;
    if (table) nodes = table.rows().nodes();
    if (tag) nodes = $(`table[tagReference="${tag}"]`).DataTable().rows().nodes();

    $.each(nodes, function(index, node) {
        const title = $(node.outerHTML).attr('pageTitleReference');
        const permalink = $(node.outerHTML).attr('pagePermalinkReference');
        const pageInformation = {
            siteInfo: {
                title: title,
                permalink: permalink
            }
        };
        
        setPageOtherCustomTags(pageInformation, tag);

    });
}

const addAdditionalButtons = (table, tag) => {

    waitForI18Next().then(() => {
        // post processing table: adding 2 buttons in the bottom2 zone
        gotToCatBtn = {
            attr: {
                siteFunction: `tableNavigateToCategories_${tag}`,
                title: i18next.t('dt_custom_buttons_go_to_cats_btn_title'),
                "data-i18n": '[title]dt_custom_buttons_go_to_cats_btn_title;dt_custom_buttons_go_to_cats_btn_text'
            },
            className: 'btn-warning btn-sm text-light focus-ring focus-ring-warning mb-2',
            text: i18next.t('dt_custom_buttons_go_to_cats_btn_text'),
            action: () => {
                window.location.href = '/cat-info'
            }
        }

        gotToSavedItemsBtn = {
            attr: {
                siteFunction: `tableNavigateToSavedItems_${tag}`,
                title: i18next.t('dt_custom_buttons_go_to_docs_btn_title'),
                "data-i18n": '[title]dt_custom_buttons_go_to_docs_btn_title;dt_custom_buttons_go_to_docs_btn_text'
            },
            className: 'btn-success btn-sm text-light focus-ring focus-ring-warning mb-2',
            text: i18next.t('dt_custom_buttons_go_to_docs_btn_text'),
            action: () => {
                window.location.href = '/site-pages?showPages=1'
            }
        }
        const btnArray = [];
        btnArray.push(gotToCatBtn);
        btnArray.push(gotToSavedItemsBtn);
        addAdditionalButtonsToTable(table, `table[tagReference="${tag}"]`, 'bottom2', btnArray);
    });
}

const setPageSavedButtonsStatus = () => {

    const setRemoveFromSavedItemsStatus = () => {
        $('button[siteFunction="tagPageItemRemoveFromSavedItems"]').each( function() {
            const pageToSave = {
                permalink: $(this).attr('pageRefPermalink'),
                title: $(this).attr('pageRefTitle')
            }
            const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];        
            if (!findObjectInArray(pageToSave, savedItems)) $(this).addClass('disabled');
            else $(this).removeClass('disabled')
        });
    }
    
    const setSaveForLaterReadStatus = () => {
        $('button[siteFunction="tagPageItemSaveForLaterRead"]').each( function() {
            const pageToSave = {
                permalink: $(this).attr('pageRefPermalink'),
                title: $(this).attr('pageRefTitle')
            }
            const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    
            if (findObjectInArray(pageToSave, savedItems)) $(this).addClass('disabled');
            else $(this).removeClass('disabled')
        });
    }
    
    setRemoveFromSavedItemsStatus();
    setSaveForLaterReadStatus();
}

const setTagInfoPageSearchList = (tag) => {
    const listItem = (page) => {
        return `<li siteFunction="searchPageListItem">${page.title} (${page.permalink})</li>`
    }

    const pageSearchListItems = () => {
        let html=''
        pageList.forEach(page => {
            html += listItem(page);
        });
        return html;
    }

    const pageSearchHtml = (tag) => {
        return (
            `
                <div id="${tag.replace(/ /g, "_")}_add_page_to_tag" class="p-3">
                    <div class="mb-2 fw-medium" siteFunction="labelForPageSearchList">Add document to tag</div>
                    <div>
                        <input 
                            type="text" 
                            autocomplete="off" 
                            class="form-control" 
                            id="${tag.replace(/ /g, "_")}_pageSearchInput"  
                            placeholder="type, select, hit enter ...">
                        <ul 
                            siteFunction="searchPageList" 
                            id="${tag.replace(/ /g, "_")}_pageSearchResults">
                            ${pageSearchListItems()}
                        </ul>
                    </div>
                </div>
            `
        )
    }

    const setRawSearchList = () => {
        return new Promise ( (resolve, reject) => {
            $(document).ready(function() {$(`div[siteFunction="tagDetails"][tagReference="${tag}"]`).append(pageSearchHtml(tag));});
            resolve();
        });
    }
    
    setRawSearchList()
        .then(() => {
            setSearchList(
                `#${tag.replace(/ /g, "_")}_pageSearchInput`, 
                `#${tag.replace(/ /g, "_")}_pageSearchResults`, 
                `li[siteFunction="searchPageListItem"]`, 
                `<li siteFunction="searchPageListItem">`,
                '</li>',
                false,
                (result) => { tagInfoAddPageToTag(result); },
                (filteredList) => {},
                preFlight.envInfo
            );
        })
        .then(() => {
            setTimeout(()=>{ 
                applyColorSchemaCorrections();
            },100);
        });
}

const tagInfoAddPageToTag = (result) => {
    const activeTag = $('div[siteFunction="tagDetails"]:not(.d-none)').attr('tagReference') || '';
    if (activeTag.trim() !== '') {
        if (tagList.includes(activeTag.trim()))
            showToast('Cannot add a page to a site tag', 'bg-danger', 'text-light');
        else {
            const page = transformStringFromPageSearchList(result);
            addTag(activeTag.trim(), {siteInfo: page});
            showTagDetails(activeTag.trim());
            updateAllTagInfoOnPage();
        }
    }
    else {
        showToast('Select a custom tag to use this feature!', 'bg-warning', 'text-dark');
    }
}
