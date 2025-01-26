// Let's do some work
const setCatSupport = () => {

    $(document).ready(() => {
        setCatPageSavedButtonsStatus();
        setCustomCatCloud();
        setCatInfoPageButtonsFunctions();
        setCatSearchList();
        updateCatSearchList();
        setCatCloudButtonsContextMenu();
        setPageCatButtonsContextMenu();

        requestedCat = readQueryString('cat');
        if (requestedCat) showCatDetails(requestedCat);

    });

    // from utilities.js
    removeObservers('.offcanvas class=hiding getClass=true');
    setElementChangeClassObserver('.offcanvas', 'hiding', true, () => {
        setCatPageSavedButtonsStatus();
        
        // cat was passed to pageInfo global before opening the offcanvas 
        // in order to preserve the reference to the active cat details datatable
        // see processCatDetailsTableRowClick
        updateAllCatInfoOnPage(pageInfo.cat);

        // check if the active cat details is for a cat that still exists and close the details if not
        const activeCatDetails = $('div[siteFunction="catDetails"]:not(.d-none)').attr('catReference') || '';
        if (!globAllCats.includes(activeCatDetails.trim())) 
            $('div[siteFunction="catDetails"]:not(.d-none)').remove();
        else
            {
                $('div[siteFunction="catDetails"]:not(.d-none)').addClass('d-none');
                showCatDetails(pageInfo.cat);
            }
        
    });
    
}
// work ends here

// FUNCTIONS
const updateAllCatInfoOnPage = (catForActiveCatDetailsTable = null) => {
    createGlobalLists();
    setCustomCatCloud(); //only custom cats are dynamic, site cats don't need update since cannot be modified
    updateCatSearchList(); //update the cat search list items to have all custom cats modifications
    setCatSearchList(); //cat search list must be recreated after the update of the list items
    if (catForActiveCatDetailsTable)
        addCustomCatsToPages(null, catForActiveCatDetailsTable); //update custom cats for the pages in the active cat details datatable
}

const setCustomCatCloud = () => {

    const getCatCloudElement = (cat, numPages) => {
         
        return  (
            `
                <button 
                    siteFunction="catButton" 
                    catType="customCat"
                    id="${cat}" type="button" 
                    class="focus-ring focus-ring-warning px-2 mr-2 my-2 btn btn-sm btn btn-sm text-success fw-medium border-0 shadow-none position-relative"
                    title = "Details for category ${cat}">
                    ${cat}
                    <span class="fw-normal border px-2 rounded bg-warning-subtle text-dark">
                        ${numPages}
                    </span>
                </button>
            `
        );
    } 

    $('button[catType="customCat"]').remove();
    globCustomCats.forEach(cat => {
        $('div[siteFunction="catCloudContainerBody"]').append($(getCatCloudElement(cat, getCatPages(cat))));
    });
}

const setCatInfoPageButtonsFunctions = () => {

    // click "Categories" button and show the cat cloud container
    $('#openCatCloud').off('click').click(function() {
        $('#cloud_cat_container').fadeIn();
    });

    // click on cat button in the cat cloud and show the cat details table
    // delegate listener at document level since buttons are dynamically added/removed/modified
    $(document)
        .off('click', 'button[siteFunction="catButton"]')
        .on('click', 'button[siteFunction="catButton"]', function() {
            const selectedCat = $(this).attr('id');
            showCatDetails(selectedCat);
            setCatPageSavedButtonsStatus(); 
        });

    // click on the cat button in cat details table and show the details table for the clicked cat
    // delegate listener at document level since buttons are dynamically added/removed/modified
    $(document)
        .off('click', 'button[siteFunction="pageCatButton"]')
        .on('click', 'button[siteFunction="pageCatButton"]', function(event) {
            const handlePageCatButtonClick = (event) => {
                const selectedCat = $(event.target).attr('id');
                showCatDetails(selectedCat.match(/pageCat_(.*)/)[1]);
                setCatPageSavedButtonsStatus(); 
            }   
            handlePageCatButtonClick(event);
        });
    
    // remove page from saved items
    // delegate event handler to document since the buttons are not available when setting the listener
    $(document)
        .off('click', 'button[siteFunction="catPageItemRemoveFromSavedItems"]')
        .on('click', 'button[siteFunction="catPageItemRemoveFromSavedItems"]', function() {
            const pageToRemove = {
                siteInfo: {
                    permalink: $(this).attr('pageRefPermalink'),
                    title: $(this).attr('pageRefTitle')
                }
            }
            removePageFromSavedItems(pageToRemove);
            setCatPageSavedButtonsStatus();
            updateAllCatInfoOnPage($(this).attr('catForCatTableDetailsReference'));
        });
    
    // save page to saved items
    // delegate event handler to document since the buttons are not available when setting the listener
    $(document)
        .off('click', 'button[siteFunction="catPageItemSaveForLaterRead"]')
        .on('click', 'button[siteFunction="catPageItemSaveForLaterRead"]', function() {
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
            setCatPageSavedButtonsStatus();
            updateAllCatInfoOnPage($(this).attr('catForCatTableDetailsReference'));
        });

    // update cat for all pages when click "Update" in the context menu for custom cat in cat cloud
    // delegate event handler to document since the buttons are not available when setting the listener
    $(document)
        .off('click', 'button[siteFunction="catCloudEditCustomCat"]')
        .on('click', 'button[siteFunction="catCloudEditCustomCat"]', handleCatUpdate);

    // update cat for a page when click "Update" in the context menu for custom cats in page cat column from a datatable
    // delegate event handler to document since the buttons are not available when setting the listener
    $(document)
        .off('click', 'button[siteFunction="pageCatEditCustomCat"]')
        .on('click', 'button[siteFunction="pageCatEditCustomCat"]', handlePageCatUpdate);

    // add cat for a page when click "Add" in the context menu for custom cats in page cat column from a datatable
    // delegate event handler to document since the buttons are not available when setting the listener
    $(document)
        .off('click', 'button[siteFunction="pageCatAddCustomCat"]')
        .on('click', 'button[siteFunction="pageCatAddCustomCat"]', handlePageCatAdd);

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
        (filteredList) => { updateCatSearchListItems(filteredList); },
        preFlight.envInfo
    );
}

const setCatInfoPageSearchList = (cat) => {
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

    const pageSearchHtml = (cat) => {
        return (
            `
                <div id="${cat.replace(/ /g, "_")}_add_page_to_cat" class="p-3">
                    <div class="mb-2 fw-medium" siteFunction="labelForPageSearchList">Add document to category</div>
                    <div>
                        <input 
                            type="text" 
                            autocomplete="off" 
                            class="form-control" 
                            id="${cat.replace(/ /g, "_")}_pageSearchInput"  
                            placeholder="type, select, hit enter ...">
                        <ul 
                            siteFunction="searchPageList" 
                            id="${cat.replace(/ /g, "_")}_pageSearchResults">
                            ${pageSearchListItems()}
                        </ul>
                    </div>
                </div>
            `
        )
    }

    const setRawSearchList = () => {
        return new Promise ( (resolve, reject) => {
            $(document).ready(function() {$(`div[siteFunction="catDetails"][catReference="${cat}"]`).append(pageSearchHtml(cat));});
            resolve();
        });
    }
    
    setRawSearchList()
        .then(() => {
            setSearchList(
                `#${cat.replace(/ /g, "_")}_pageSearchInput`, 
                `#${cat.replace(/ /g, "_")}_pageSearchResults`, 
                `li[siteFunction="searchPageListItem"]`, 
                `<li siteFunction="searchPageListItem">`,
                '</li>',
                false,
                (result) => { catInfoAddPageToCat(result); },
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

const catInfoAddPageToCat = (result) => {
    const activeCat = $('div[siteFunction="catDetails"]:not(.d-none)').attr('catReference') || '';
    if (activeCat.trim() !== '') {
        if (catList.includes(activeCat.trim()))
            showToast('Cannot add a page to a site category', 'bg-danger', 'text-light');
        else {
            const page = transformStringFromPageSearchList(result);
            addCat(activeCat.trim(), {siteInfo: page});
            showCatDetails(activeCat.trim());
            updateAllCatInfoOnPage();
        }
    }
    else {
        showToast('Select a custom category to use this feature!', 'bg-warning', 'text-dark');
    }
}

const showCatDetails = (cat) => {

    if ( !cat ) return;
    if ( cat === 'undefined' ) return;
    if ( cat === '' ) return;

    const siteCatPageNo = catList.includes(cat) ? catDetails[cat].numPages : 0;
    const customCatPageNo = catList.includes(cat) ? 0 : getCatPages(cat);
    if (siteCatPageNo + customCatPageNo === 0 ) return;

    if( $.fn.DataTable.isDataTable(`table[catReference="${cat}"]`) ) {
        $(`table[catReference="${cat}"]`).DataTable().destroy();
        $(`table[catReference="${cat}"]`).removeAttr('id').removeAttr('aria-describedby');
    }

    let tableData = [];
    if (siteCatPageNo === 0 && customCatPageNo > 0 ) {
        tableData = buildCatPagesListForCustomCat(cat);
        createSimpleCatTable(cat, tableData);
    }

    $(`div[siteFunction="catDetails"][catReference="${cat}"]`).removeClass('d-none');
    $(`div[siteFunction="catDetails"][catReference!="${cat}"]`).addClass('d-none');
    $('div[siteFunction="catDetails"]').removeAttr('style'); // to clear some style values added by a potential previous close button click
    $(`div[siteFunction="catDetails"][catReference="${cat}"]`).fadeIn();

    const colDefinition = [
        // page name
        {
            data: 'pageTitle',
            className: 'alwaysCursorPointer',
            title:'Title',
            createdCell: function(td, cellData, rowData, row, col) {
                $(td)
                    .attr('siteFunction', 'catInfoCatTablePageTitle')
                    .attr('title', `Click here for more info about page ${cellData.replace(/<\/?[^>]+(>|$)/g, "")}`)
                    .attr('catReference', `${cat}`)
                    .attr('colFunction', 'pageTitle')
                    .addClass('fw-normal align-self-center align-middle');
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
                    .attr('catReference', `${cat}`)
                    .attr('colFunction', 'pageLastUpdate')
                    .addClass('fw-normal align-self-center align-middle');
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
                    .attr('catReference', `${cat}`)
                    .attr('colFunction', 'pageActions')
                    .addClass('fw-normal align-self-center align-middle')
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
                    .attr('catReference', `${cat}`)
                    .attr('colFunction', 'pageExcerpt')
                    .addClass('fw-normal align-self-center align-middle');
            }
        }, 

        // other cats
        {
            data: 'pageOtherCats',
            title:'Other Categories',
            type: 'string',
            exceptWhenRowSelect: true,
            createdCell: function(td, cellData, rowData, row, col) {
                const permalink = $(rowData.pageActions).find('[siteFunction="catPageItemLinkToDoc"]').attr('href');
                $(td)
                    .attr('catReference', `${cat}`)
                    .attr('colFunction', 'catInfoCatTablePageOtherCats')
                    .attr('pageTitleReference', `${rowData.pageTitle.replace(/<\/?[^>]+(>|$)/g, "").trim()}`)
                    .attr('pagePermalinkReference', `${permalink.trim()}`)
                    .addClass('fw-normal align-self-center align-middle');
                
                if(preFlight.envInfo.device.deviceType === 'mobile') {
                        $(td).children().first().addClass('d-flex');
                    }
            }
        }
    ];

    const commonAdditionalTableSettings = {
        
        scrollX: true,

        fixedColumns: {
            "left": 1
        },
        "createdRow": function(row, data, dataIndex) {
            const permalink = $(data.pageActions).find('[siteFunction="catPageItemLinkToDoc"]').attr('href');
            $(row)
                .attr('siteFunction', 'catInfoCatTablePageRow')
                .attr('catReference', `${cat}`)
                .attr('pageTitleReference', `${data.pageTitle.replace(/<\/?[^>]+(>|$)/g, "").trim()}`)
                .attr('pagePermalinkReference', `${permalink.trim()}`);
        }
    }; 

    const additionalTableSettings = tableData.length === 0 ? 
        commonAdditionalTableSettings : 
        {...commonAdditionalTableSettings, data:tableData};

    setDataTable(
        `table[catReference="${cat}"]`,
        `CatPages_${cat.trim()}`,     
        colDefinition,
        (table) => { postProcessCatDetailsTable(table, cat) }, // will execute after the table is created
        (rowData) => { processCatDetailsTableRowClick(rowData, `table[catReference="${cat}"]`, cat) }, // will execute when click on row
        additionalTableSettings // additional datatable settings for this table instance
    );

    if (_.map(globCustomCats, _.toLower).includes(cat.toLowerCase())) setCatInfoPageSearchList(cat);
    history.replaceState({}, document.title, window.location.pathname);
}

const createSimpleCatTable = (cat, tableData) => {

    const catDetailsCardHeader = (cat) => {
        return (
            `
                <div class="card-header d-flex justify-content-between border-bottom border-secondary border-opacity-25">
                    <span class="fs-6 fw-medium">Category:
                        <button 
                            siteFunction="catForActiveCatDetailsDatatable" id="${cat}" 
                            type="button" 
                            class="px-3 ml-1 btn btn-sm text-success fw-medium border-0 shadow-none position-relative">
                            ${cat}       
                        </button>
                    </span>
                    <button 
                        siteFunction="btnClose" 
                        whatToClose="div[catReference=&quot;${cat.trim()}&quot;]" 
                        type="button" class="btn-close" 
                        aria-label="Close">
                    </button>
                 </div>
            `
        );
    }

    const cardDetailsCardBody = (cat) => {
        return (
            `
                <div class="card-body">
                    <table style="display:none" siteFunction="catDetailsPageTable" class="table table-hover" catReference="${cat}">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th siteFunction="tableDateField">Last Update</th>
                                <th>Actions</th>
                                <th>Excerpt</th>
                                <th>Other Categories</th>
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

    $(`div[siteFunction="catDetails"][catReference="${cat}"]`).remove();
    const $catDetailsContainer = $(`<div catReference="${cat}" siteFunction="catDetails" class="d-none card shadow bg-transparent border border-secondary border-opacity-25">`);
    $catDetailsContainer.append($(catDetailsCardHeader(cat)));
    $catDetailsContainer.append($(cardDetailsCardBody(cat)));
    $('div[id="cat_details"]').append($catDetailsContainer);
    // small delay to avoid visibility of white table background for dummy table on dark theme
    setTimeout(()=>{$(`table[siteFunction="catDetailsPageTable"][catReference="${cat}"]`).removeAttr('style')} ,100);
    

}

const postProcessCatDetailsTable = (table, cat) => {
    if(table) {
        addAdditionalCatButtons(table, cat);
        addCustomCatsToPages(table, cat);
    }   
}

const processCatDetailsTableRowClick = (rowData, tableSelector, cat) => {

    // cats may contain spaces 
    // so we need to extract them from the html to prevent .split(' ') to provide wrong cats
    // NOT USED
    const extractCats = (cats) => {
        const tempElement = document.createElement('div');
        tempElement.innerHTML = `${cats}`;
        const buttons = tempElement.querySelectorAll('button');
        const buttonTexts = Array.from(buttons).map(button => button.textContent.trim());
        return buttonTexts;
    }

    const extractPermalink = (actionsHtml) => {
        const tempElement = document.createElement('div');
        tempElement.innerHTML = `${actionsHtml}`;
        const linkToDoc = tempElement.querySelector('a[siteFunction="catPageItemLinkToDoc"]');
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
        cat:cat //need to pass cat too because we need a reference to the cat details datatable when returning from page info offcanvas
    };
    
    showPageFullInfoCanvas(pageInfo);
}

const addAdditionalCatButtons = (table, cat) => {
    waitForI18Next().then(() => {
        // post processing table: adding 2 buttons in the bottom2 zone
        gotToTagBtn = {
            attr: {
                siteFunction: `tableNavigateToTags_${cat}`,
                title: i18next.t('dt_custom_buttons_go_to_tags_btn_title'),
                "data-i18n": '[title]dt_custom_buttons_go_to_tags_btn_title;dt_custom_buttons_go_to_tags_btn_text'
            },
            className: 'btn-warning btn-sm text-light focus-ring focus-ring-warning mb-2',
            text: i18next.t('dt_custom_buttons_go_to_tags_btn_text'),
            action: () => {
                window.location.href = '/tag-info'
            }
        }
    
        gotToSavedItemsBtn = {
            attr: {
                siteFunction: `tableNavigateToSavedItems_${cat}`,
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
        btnArray.push(gotToTagBtn);
        btnArray.push(gotToSavedItemsBtn);
        addAdditionalButtonsToTable(table, `table[catReference="${cat}"]`, 'bottom2', btnArray);
    });
}

const updateCatSearchList = () => {
    getCatType = (cat) => {
        return _.findIndex(globCustomCats, item => item.toLowerCase() === cat.toLowerCase()) === -1 ? 'siteCat' : 'customCat'
    }

    getCustomCatListElement = (cat) => {
        return (
            `
                <li 
                    siteFunction="searchCatListItem"
                    catType="${getCatType(cat)}"
                    catReference="${cat}">
                    ${cat}
                </li>
            `
        );
    }

    $('li[catType="customCat"]').remove();
    globCustomCats.forEach(cat => {
        $('ul[siteFunction="searchCatList"]').append($(getCustomCatListElement(cat)));
    });
}

const updateCatSearchListItems = (list) => {
    $('li[sitefunction="searchCatListItem"]').each(function() {
        $(this).attr('catReference', $(this).text().trim());
        $(this).attr(
            'catType', 
            _.findIndex(globCustomCats, item => item.toLowerCase() === $(this).text().trim().toLowerCase()) === -1 ? 
                'siteCat' : 
                'customCat'
        );
    });
}

const setCatPageSavedButtonsStatus = () => {

    const setRemoveFromSavedItemsStatus = () => {
        $('button[siteFunction="catPageItemRemoveFromSavedItems"]').each( function() {
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
        $('button[siteFunction="catPageItemSaveForLaterRead"]').each( function() {
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

const buildCatPagesListForCustomCat = (cat) => {
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
    
    const colPageActions = (cat, permalink, title) => {

        return (
            `
                <div class="btn-group"> 
                    <a 
                        siteFunction="catPageItemLinkToDoc" 
                        class="btn btn-sm btn-info" 
                        href="${permalink}" 
                        title="Read page ${title}" 
                        catForCatTableDetailsReference="${cat}" 
                        target="_blank"> 
                        <i class="bi bi-book" style="font-size:1.2rem"></i> 
                    </a> 
                    
                    <button 
                        siteFunction="catPageItemSaveForLaterRead" 
                        pageRefPermalink="${permalink}" 
                        pageRefTitle="${title}" 
                        class="btn btn-sm btn-success disabled" 
                        title="Save page ${title} for later read" 
                        catForCatTableDetailsReference="${cat}"> 
                        <i class="bi bi-bookmark-plus" style="font-size:1.2rem"></i> 
                    </button>
                    
                    <button 
                        siteFunction="catPageItemRemoveFromSavedItems" 
                        pageRefPermalink="${permalink}" 
                        pageRefTitle="${title}" 
                        class="btn btn-sm btn-warning" 
                        title="Remove page ${title} from saved documents" 
                        catForCatTableDetailsReference="${cat}"> 
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

    const colPageOtherCats = (cat, pageOtherCats) => {

        const otherCatBtnItem = (cat) => {
        
            const catType = _.findIndex(globCustomCats, item => item.toLowerCase() === cat.trim().toLowerCase()) > 0 ?
                'customCat' :
                'siteCat';
            
            const catBtnType = _.findIndex(globCustomCats, item => item.toLowerCase() === cat.trim().toLowerCase()) > 0 ? 
                'text-success' : 
                'text-danger';
    
            return (
                `
                    <button 
                        siteFunction="pageCatButton" 
                        catType="${catType}" 
                        catReference="${cat}" 
                        id="pageCat_${cat}" 
                        type="button" 
                        class="focus-ring focus-ring-warning px-3 mr-2 my-1 btn btn-sm ${catBtnType} fw-medium border-0 shadow-none position-relative" 
                        title="Details for category ${cat}"> 
                        ${cat} 
                    </button>
                `
            );
        }

        let buttons = '';
        pageOtherCats.forEach(cat => { buttons += otherCatBtnItem(cat); });

        buttons = '<span>' + buttons + '</span>';
        buttons = buttons
            .replace(/[\n\t]/g, '') // remove newlines and tabs
            .replace(/\s\s+/g, ' ') // replace multiple spaces with single space
            .replace(/>\s+</g, '><') // remove spaces between > <
            .replace(/\s+</g, '<') // remove spaces before <
            .replace(/>\s+/g, '>'); // remove spaces after >
        return buttons;

    }

    getArrayOfCatSavedPages(cat).forEach(page => {
        const sitePage = getObjectFromArray ({permalink: page.permalink, title: page.title}, pageList);

        const pageTitle = colPageTitle(page.title);
        const pageLastUpdate = colPageLastUpdate(formatDate(sitePage.lastUpdate));
        const pageExcerpt = colPageExcerpt(sitePage.excerpt);
        const pageActions = colPageActions(cat, page.permalink, page.title);
        
        const pageOtherCats = _.uniq(_.pull(
            [
                ...sitePage.categories.sort(), 
                ...getPageCats({siteInfo:{permalink:page.permalink, title: page.title}}).sort()
            ], 
            cat
        )); // get all site and custom cats, except for the one which was clicked
        
        tableData.push({
            pageTitle: pageTitle,
            pageLastUpdate: pageLastUpdate,
            pageActions: pageActions,
            pageExcerpt: pageExcerpt,
            pageOtherCats: colPageOtherCats(cat, pageOtherCats)
        });
    });

    return tableData;
}

const addCustomCatsToPages = (table = null, cat = null) => {
    if (!table && !cat) return;

    let nodes;
    if (table) nodes = table.rows().nodes();
    if (cat) nodes = $(`table[catReference="${cat}"]`).DataTable().rows().nodes();

    $.each(nodes, function(index, node) {
        const title = $(node.outerHTML).attr('pageTitleReference');
        const permalink = $(node.outerHTML).attr('pagePermalinkReference');
        const pageInformation = {
            siteInfo: {
                title: title,
                permalink: permalink
            }
        };
        
        setPageOtherCustomCats(pageInformation, cat);

    });
}

const setPageOtherCustomCats = (pageInformation, crtCat = null) => {

    const getCustomCatButtonElement = (cat) => {
        return (
            `
                <button 
                    siteFunction="pageCatButton"
                    catType="customCat" 
                    catReference="${cat}"
                    id="pageCat_${cat}" 
                    type="button" 
                    class="align-self-center text-nowrap focus-ring focus-ring-warning px-3 mr-2 my-1 btn btn-sm text-success fw-medium border-0 shadow-none position-relative"
                    title = "Details for category ${cat}">${cat}
                </button>
            `
        )
    }

    const customCats = _.pull(getPageCats(pageInformation), crtCat);

    const $pageOtherCatsElement = $(`td[colFunction="catInfoCatTablePageOtherCats"][pageTitleReference="${pageInformation.siteInfo.title}"][pagePermalinkReference="${pageInformation.siteInfo.permalink}"]`);

    const $pageOtherCustomCatElement = $(`td[colFunction="catInfoCatTablePageOtherCats"][pageTitleReference="${pageInformation.siteInfo.title}"][pagePermalinkReference="${pageInformation.siteInfo.permalink}"] button[siteFunction="pageCatButton"][catType="customCat"]`);
    
    $pageOtherCustomCatElement.each(function() { $(this).remove() });
    
    customCats.forEach(cat => {        

        // remove potential wrong display of a customCat as siteCat
        const $pageOtherCustomCatElement__WRONG = $(`td[colFunction="catInfoCatTablePageOtherCats"][pageTitleReference="${pageInformation.siteInfo.title}"][pagePermalinkReference="${pageInformation.siteInfo.permalink}"] button[siteFunction="pageCatButton"][catType="siteCat"][catReference="${cat}"]`);
        $pageOtherCustomCatElement__WRONG.remove();

        $pageOtherCatsElement.each(function() {
            $(this).children().first().append($(getCustomCatButtonElement(cat)));
        })
    });

}

const setCatCloudButtonsContextMenu = () => {

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
                html: getMenuItemHtml(`Remove the category from all pages`,'Remove category', 'bi-trash'),
                handler: handleCatRemoval
            }
        ],
        footer: preFlight.envInfo.device.deviceType === 'desktop' ?
            `
                <input type="text" autocomplete="off" class="form-control my-2  d-none d-md-block" id="catCloudEditCustomCatInput">
                <button 
                    siteFunction="catCloudEditCustomCat"
                    catForCatTableDetailsReference="" 
                    catReference=""
                    id="catCloudEditCustomCat" 
                    type="button" 
                    class="focus-ring focus-ring-warning btn btn-sm btn-warning my-2 position-relative d-none d-md-block">
                    Update      
                </button>
            ` :
            ``
    };
    
    setContextMenu (
        'button[sitefunction="catButton"][catType="customCat"]', 
        'body', 
        menuContent, 
        (menuItem, itemClicked) => {
            // get the menu item click handler and execute it            
            getContextMenuItemHandler(
                menuItem.text().replace(/[\n\r\t]/g, '').trim(), 
                menuContent
            ).bind(
                null,
                // cat to be processed
                $(itemClicked.prop('outerHTML')).children().remove().end().text().replace(/[\n\r\t]/g, '').trim(),
                // cat for the active cat details datatable
                $('div[siteFunction="catDetails"]:not(.d-none) button[sitefunction="catForActiveCatDetailsDatatable"]').text().trim() 
            )();
        },
        (event) => {
            // cat to be processed
            const $catBtn = $(event.target).closest('button[sitefunction="catButton"][catType="customCat"]').clone();
            const cat = $($catBtn.prop('outerHTML')).children().remove().end().text().replace(/[\n\r\t]/g, '').trim();
            $('#catCloudEditCustomCatInput').val(cat);
            if (preFlight.envInfo.device.deviceType === 'dektop') $('#catCloudEditCustomCatInput').focus();

            // cat for active cat details datatable
            const catForActiveCatDetailsDatatable = $('div[siteFunction="catDetails"]:not(.d-none) button[sitefunction="catForActiveCatDetailsDatatable"]').text().trim();
            
            $('button[siteFunction="catCloudEditCustomCat"]').attr('catForCatTableDetailsReference',catForActiveCatDetailsDatatable);
            $('button[siteFunction="catCloudEditCustomCat"]').attr('catReference', cat);
        },
        ['catCloudContextMenu'] //additonal class for the context menu container
    );
}

const handleCatRemoval = (cat, catForActiveCatDetailsDatatable = null) => {
    if (!cat) return;
    if (cat === 'undefined') return;
    if (cat === '') return;

    if (!deleteCatFromAllPages(cat)) return;
    createGlobalLists();
    updateAllCatInfoOnPage(catForActiveCatDetailsDatatable);

    // remove the cat details container id it is open for the cat we delete
    if (cat.toLowerCase() === catForActiveCatDetailsDatatable.toLowerCase())
        $(`div[siteFunction="catDetails"][catReference="${cat}"]`).remove();

}

const handleCatUpdate = () => {
    const cat = cleanText($('#catCloudEditCustomCatInput').val());

    const oldCat = $('button[siteFunction="catCloudEditCustomCat"]').attr('catReference');
    $('.context-menu').remove();

    if (!cat) return;
    if (cat === 'undefined') return;
    if (cat === '') return;

    
    if (!oldCat) return;
    if (oldCat === 'undefined') return;
    if (oldCat === '' ) return;

    if (!updateCatForAllPages(oldCat,cat)) return;
    createGlobalLists();
    
    const catForActiveCatDetailsDatatable = $('div[siteFunction="catDetails"]:not(.d-none) button[sitefunction="catForActiveCatDetailsDatatable"]').text().trim();

    updateAllCatInfoOnPage(catForActiveCatDetailsDatatable);

    // update the cat details card header if it is visible for the cat we update
    if (oldCat.toLowerCase() === catForActiveCatDetailsDatatable.toLowerCase())
        $('button[sitefunction="catForActiveCatDetailsDatatable"]').text(cat);
}

const setPageCatButtonsContextMenu = () => {

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
                html: getMenuItemHtml(`Remove the cat from page`,'Remove category', 'bi-x-circle'),
                handler: handlePageCatDelete
            }
        ],
        footer: preFlight.envInfo.device.deviceType === 'desktop' ?
            `
                <input type="text" autocomplete="off" class="form-control my-2 d-none d-md-block" id="pageCatEditCustomCatInput">

                <div class="mb-2 d-none d-md-block">
                    <button 
                        siteFunction="pageCatEditCustomCat"
                        catForCatTableDetailsReference="" 
                        catReference=""
                        id="pageCatEditCustomCat" 
                        type="button" 
                        class="focus-ring focus-ring-warning btn btn-sm btn-warning mt-2 position-relative pageCatContextMenuFooterBtn">
                        Update      
                    </button>

                    <button 
                        siteFunction="pageCatAddCustomCat"
                        catForCatTableDetailsReference="" 
                        catReference=""
                        id="pageCatEditCustomCat" 
                        type="button" 
                        class="focus-ring focus-ring-warning btn btn-sm btn-success mt-2 position-relative pageCatContextMenuFooterBtn">
                        Add      
                    </button>
                </div>
            ` :
            ``
    };
    
    setContextMenu (
        'button[sitefunction="pageCatButton"]', 
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

                // cat to be processed
                $(itemClicked.prop('outerHTML')).children().remove().end().text().replace(/[\n\r\t]/g, '').trim(),

                // cat for the active cat details datatable
                $('div[siteFunction="catDetails"]:not(.d-none) button[sitefunction="catForActiveCatDetailsDatatable"]').text().trim() 
            )();
        },
        (event) => {
            // cat to be processed
            const $catBtn = $(event.target).closest('button[sitefunction="pageCatButton"][catType="customCat"]').clone();
            const cat = $($catBtn.prop('outerHTML')).children().remove().end().text().replace(/[\n\r\t]/g, '').trim();
            $('#pageCatEditCustomCatInput').val(cat);
            if (preFlight.envInfo.device.deviceType === 'desktop') $('#pageCatEditCustomCatInput').focus();

            // cat for active cat details datatable
            const catForActiveCatDetailsDatatable = $('div[siteFunction="catDetails"]:not(.d-none) button[sitefunction="catForActiveCatDetailsDatatable"]').text().trim();
            
            // set needed attributes to the context menu footer buttons
            $('button[siteFunction="pageCatEditCustomCat"]').attr('catForCatTableDetailsReference',catForActiveCatDetailsDatatable);
            $('button[siteFunction="pageCatEditCustomCat"]').attr('catReference', cat);

            $('button[siteFunction="pageCatAddCustomCat"]').attr('catForCatTableDetailsReference',catForActiveCatDetailsDatatable);
            $('button[siteFunction="pageCatAddCustomCat"]').attr('catReference', cat);

            const page = {
                title: $(event.target).closest('td').attr('pageTitleReference'),
                permalink: $(event.target).closest('td').attr('pagePermalinkReference'),
            };

            $('button[siteFunction="pageCatEditCustomCat"]').attr('pageTitleReference', page.title);
            $('button[siteFunction="pageCatEditCustomCat"]').attr('pagePermalinkReference', page.permalink);

            $('button[siteFunction="pageCatAddCustomCat"]').attr('pageTitleReference', page.title);
            $('button[siteFunction="pageCatAddCustomCat"]').attr('pagePermalinkReference', page.permalink);

            // removing things that are not applicable to site cats
            if (_.findIndex(globCustomCats, item => item.toLowerCase() === cat.trim().toLowerCase()) === -1 ) {
                $('.context-menu-list').remove();
                $('button[sitefunction="pageCatEditCustomCat"]').remove();
                $('hr[sitefunction="contextMenuSeparator"]').remove();
            }

        },
        ['pageCatContextMenu'] //additonal class for the context menu container
    );
}

const handlePageCatDelete = (page = {}, cat, catForActiveCatDetailsDatatable) => {

    if (!cat) return;
    if (cat === 'undefined') return;
    if (cat === '') return;

    if (!page) return;    
    if (!page.title) return;
    if (page.title === 'undefined') return;
    if (page.title === '') return;
    
    if (!page.permalink) return;
    if (page.permalink === 'undefined') return;
    if (page.permalink === '') return;

    deleteCatFromPage(cat, {siteInfo:page});
    updateAllCatInfoOnPage(catForActiveCatDetailsDatatable);
    $('.context-menu').remove();

}

const handlePageCatUpdate = () => {
    const cat = cleanText($('#pageCatEditCustomCatInput').val());
    const oldCat = $('button[siteFunction="pageCatEditCustomCat"]').attr('catReference');
    const title = $('button[siteFunction="pageCatEditCustomCat"]').attr('pageTitleReference');
    const permalink = $('button[siteFunction="pageCatEditCustomCat"]').attr('pagePermalinkReference');
    const page = {
        title: title,
        permalink: permalink
    };
    
    const catForActiveCatDetailsDatatable = $('div[siteFunction="catDetails"]:not(.d-none) button[sitefunction="catForActiveCatDetailsDatatable"]').text().trim();

    updateCatForPage (oldCat, cat, {siteInfo:page})
    updateAllCatInfoOnPage(catForActiveCatDetailsDatatable);
    $('.context-menu').remove();
}

const handlePageCatAdd = () => {
    const cat = cleanText($('#pageCatEditCustomCatInput').val());
    const title = $('button[siteFunction="pageCatAddCustomCat"]').attr('pageTitleReference');
    const permalink = $('button[siteFunction="pageCatAddCustomCat"]').attr('pagePermalinkReference');

    if (!cat) return;
    if (cat === 'undefined') return;
    if (cat === '') return;
    
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
    
    const catForActiveCatDetailsDatatable = $('div[siteFunction="catDetails"]:not(.d-none) button[sitefunction="catForActiveCatDetailsDatatable"]').text().trim();

    addCat(cat, {siteInfo: page});
    updateAllCatInfoOnPage(catForActiveCatDetailsDatatable);
    $('.context-menu').remove();
}