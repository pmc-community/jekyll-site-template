// HEADS UP!!!
// pageInfo is a global

// DISABLE INTERACTIONS UNTIL OFFCANVAS IS FULLY LOADED
// TO PREVENT CLOSING OFFCANVAS TOO FAST WHICH MAY LEAD TO DATATABLES INIT WARNINGS IN MAIN PAGE
$(document).on('show.bs.offcanvas', '#offcanvasPageFullInformation', function () {
    // Disable clicks on the entire page
    $('body').css('pointer-events', 'none');
});

$(document).on('shown.bs.offcanvas', '#offcanvasPageFullInformation', function () {
    // Re-enable clicks after fully opened, with a small delay, just in case!
    setTimeout(()=>$('body').css('pointer-events', 'auto'), 100);
});

// WRAPPED EXTERNAL FUNCTIONS
// see wrappers in utilities.js
REFRESH_PAGE_INFO_AFTER__savePageToSavedItems = REFRESH_PAGE_INFO_AFTER(savePageToSavedItems);
REFRESH_PAGE_INFO_AFTER__removePageFromSavedItems = REFRESH_PAGE_INFO_AFTER(removePageFromSavedItems);
REFRESH_PAGE_INFO_AFTER__removeAllCustomNotes = REFRESH_PAGE_INFO_AFTER(removeAllCustomNotes);

// ENTRY POINT
const showPageFullInfoCanvas = (pageInfo) => {
    if (pageInfo) {
        initPageFullInfoCanvasBeforeShow(pageInfo);
        $('#offcanvasPageFullInformation').offcanvas('show');
        initPageFullInfoCanvasAfterShow(pageInfo);
        initPageFullInfoCanvasAfterDocReady(pageInfo);
    }
}

// FUNCTIONS
const initPageFullInfoCanvasAfterDocReady = (pageInfo) => {
    REFRESH_PAGE_INFO_BEFORE__fillTagList(pageInfo);
    REFRESH_PAGE_INFO_BEFORE__setCustomTagContextMenu(pageInfo);

    REFRESH_PAGE_INFO_BEFORE__fillCatList(pageInfo);
    REFRESH_PAGE_INFO_BEFORE__setCustomCatContextMenu(pageInfo);
}

const initPageFullInfoCanvasAfterShow = (pageInfo) => {
    // for tags
    setTagEditor('#offcanvasPageFullInfoPageTagsEditor', pageInfo);

    // for cats
    setCatEditor('#offcanvasPageFullInfoPageCatsEditor', pageInfo);
}

const initPageFullInfoCanvasBeforeShow = (pageInfo) => {
    $('#offcanvasPageFullInfoPageGeneralCustomNotesEdit').val('');
    // for general and custom notes
    setPageStatusButtons(pageInfo);
    setCanvasSectionsOpeners();
    resetCustomNotesInputAreas();
    setCanvasButtonsFunctions(pageInfo);
    setInitialCanvasSectionsVisibility();
    fillPageTitle(pageInfo);
    fillPageLastUpdate(pageInfo);
    fillPageExcerpt(pageInfo);
    fillPageAutoSummary(pageInfo);
    fillPageRelatedPages(pageInfo);
    fillPageSimilarPages(pageInfo);
    setCustomNoteTextAreaLimits();
    initCustomNotesTable(pageInfo);
    setCanvasGeneralCustomNotesVisibility(pageInfo);

    // for tags
    setCanvasPageCustomTagsVisibility(pageInfo);

    // for cats
    setCanvasPageCustomCatsVisibility(pageInfo);
    
}

const setCustomTagContextMenu = (pageInfo) => {
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
                html: getMenuItemHtml(`Remove the tag from the doc ${pageInfo.siteInfo.title} only`,'Remove from doc', 'bi-x-circle'),
                handler: removeTagFromPage
            },
            {
                html: getMenuItemHtml('Remove the tag from all docs tagged with it','Remove from all docs', 'bi-trash'),
                handler: removeTagFromAllPages
            },
        ],
        footer: ''
    };
    
    setContextMenu (
        'div[sitefunction="offcanvasPageFullInfoPageTagsList"] a[pageTagType="customTag"]', 
        '.offcanvas-body', 
        menuContent, 
        (menuItem, itemClicked) => {
            REFRESH_PAGE_INFO_BEFORE_AND_AFTER__processSelectedTag( 
                menuItem, 
                itemClicked,
                menuContent,
                pageInfo
            ); 
        },
        null, // nothing to post-process after context menu is shown
        ['pageFullInfoCustomTagContextMenu'] //additonal class for the context menu container
    );
}
const REFRESH_PAGE_INFO_BEFORE__setCustomTagContextMenu = REFRESH_PAGE_INFO_BEFORE(setCustomTagContextMenu);

const setCustomCatContextMenu = (pageInfo) => {
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
                html: getMenuItemHtml(`Remove the category from the doc ${pageInfo.siteInfo.title} only`,'Remove from doc', 'bi-x-circle'),
                handler: removeCatFromPage
            },
            {
                html: getMenuItemHtml('Remove the category from all docs','Remove from all docs', 'bi-trash'),
                handler: removeCatFromAllPages
            },
        ],
        footer: ''
    };
    
    setContextMenu (
        'div[sitefunction="offcanvasPageFullInfoPageCatsList"] a[pageCatType="customCat"]', 
        '.offcanvas-body', 
        menuContent, 
        (menuItem, itemClicked) => {
            REFRESH_PAGE_INFO_BEFORE_AND_AFTER__processSelectedCat( 
                menuItem, 
                itemClicked,
                menuContent,
                pageInfo
            ); 
        },
        null, // nothing to post-process after context menu is shown
        ['pageFullInfoCustomCatContextMenu'] //additonal class for the context menu container
    );
}
const REFRESH_PAGE_INFO_BEFORE__setCustomCatContextMenu = REFRESH_PAGE_INFO_BEFORE(setCustomCatContextMenu);

const processSelectedTag = (menuItem, itemClicked, menuContent, pageInfo) => {
    const tag = itemClicked.text().trim();
    const action = menuItem.text().trim();
    const handler = getTagContextMenuItemHandler(action, menuContent).bind(null, tag, pageInfo);
    handler();
    
}
const REFRESH_PAGE_INFO_BEFORE_AND_AFTER__processSelectedTag = REFRESH_PAGE_INFO_BEFORE_AND_AFTER(processSelectedTag);

const processSelectedCat = (menuItem, itemClicked, menuContent, pageInfo) => {
    const cat = itemClicked.text().trim();
    const action = menuItem.text().trim();
    const handler = getCatContextMenuItemHandler(action, menuContent).bind(null, cat, pageInfo);
    handler();
    
}
const REFRESH_PAGE_INFO_BEFORE_AND_AFTER__processSelectedCat = REFRESH_PAGE_INFO_BEFORE_AND_AFTER(processSelectedCat);

const getTagContextMenuItemHandler = (action, menuContent) => {
    let handler = null;
    menuContent.menu.forEach (menuItem => {
        if ( $(menuItem.html).text().trim() === action ) handler = menuItem.handler
    });
    return handler;
}

const getCatContextMenuItemHandler = (action, menuContent) => {
    let handler = null;
    menuContent.menu.forEach (menuItem => {
        if ( $(menuItem.html).text().trim() === action ) handler = menuItem.handler
    });
    return handler;
}

const removeTagFromPage = (tag, pageInfo = {}) => {
    if (deleteTagFromPage(tag, pageInfo)) {
        pageInfo.savedInfo.customTags = getPageTags(pageInfo);
        REFRESH_PAGE_INFO_BEFORE__fillTagList(pageInfo);
        createGlobalLists();
    }
}

const removeCatFromPage = (cat, pageInfo = {}) => {
    if (deleteCatFromPage(cat, pageInfo)) {
        pageInfo.savedInfo.customCategories = getPageCats(pageInfo);
        REFRESH_PAGE_INFO_BEFORE__fillCatList(pageInfo);
        createGlobalLists();
    }
}

const removeTagFromAllPages = (tag, pageInfo = {}) => {
    if (deleteTagFromAllPages(tag)) {
        pageInfo.savedInfo.customTags = getPageTags(pageInfo);
        REFRESH_PAGE_INFO_BEFORE__fillTagList(pageInfo);
        createGlobalLists();
    }
}

const removeCatFromAllPages = (cat, pageInfo = {}) => {
    if (deleteCatFromAllPages(cat)) {
        pageInfo.savedInfo.customCategories = getPageCats(pageInfo);
        REFRESH_PAGE_INFO_BEFORE__fillCatList(pageInfo);
        createGlobalLists();
    }
}

const fillTagList = (pageInfo) => {
    const $tagItemsContainer = $('div[siteFunction="offcanvasPageFullInfoPageTagsList"]');
    const html = 
        `
            <a 
                siteFunction="offcanvasPageFullInfoPageTagButton" 
                type="button" 
                class="focus-ring focus-ring-warning px-3 mr-5 my-2 btn btn-sm position-relative"
                href="#">
                tag
            </a>
        `;
    
    $tagItemsContainer.empty();

    siteTags = pageInfo.siteInfo.tags || [];
    customTags = pageInfo.savedInfo.customTags || [];

    siteTags.sort().forEach( tag => {
        const $el = $(html);
        $el.text(tag);
        $el.attr('href',`/tag-info?tag=${tag}`);
        $el.removeClass('btn-primary').removeClass('btn-success').addClass('btn-primary');
        $el.appendTo( $tagItemsContainer);
    });

    customTags.sort().forEach( tag => {
        const $el = $(html);
        $el.text(tag);
        $el.attr('href',`/tag-info?tag=${tag}`);
        $el.attr('customTagRef', tag);
        $el.attr('pageTagType', 'customTag');
        $el.removeClass('btn-primary').removeClass('btn-primary').addClass('btn-success');
        $el.appendTo( $tagItemsContainer);
    });
}
const REFRESH_PAGE_INFO_BEFORE__fillTagList = REFRESH_PAGE_INFO_BEFORE(fillTagList);

const fillCatList = (pageInfo) => {
    const $catItemsContainer = $('div[siteFunction="offcanvasPageFullInfoPageCatsList"]');
    const html = 
        `
            <a 
                siteFunction="offcanvasPageFullInfoPageCatButton" 
                type="button" 
                class="focus-ring focus-ring-warning px-2 mr-1 my-2 btn btn-sm text-danger fw-medium border-0 shadow-none position-relative"
                href="#">
                cat
            </a>
        `;
    
    $catItemsContainer.empty();

    siteCats = pageInfo.siteInfo.categories || [];
    customCats = pageInfo.savedInfo.customCategories || [];

    siteCats.sort().forEach( cat => {
        const $el = $(html);
        $el.text(cat);
        $el.attr('href',`/cat-info?cat=${cat}`);
        $el.removeClass('text-danger').removeClass('text-success').addClass('text-danger');
        $el.appendTo( $catItemsContainer);
    });

    customCats.sort().forEach( cat => {
        const $el = $(html);
        $el.text(cat);
        $el.attr('href',`/cat-info?cat=${cat}`);
        $el.attr('customTagRef', cat);
        $el.attr('pageCatType', 'customCat');
        $el.removeClass('text-danger').removeClass('text-success').addClass('text-success');
        $el.appendTo( $catItemsContainer);
    });
}
const REFRESH_PAGE_INFO_BEFORE__fillCatList = REFRESH_PAGE_INFO_BEFORE(fillCatList);

const setCanvasGeneralCustomNotesVisibility = (pageInfo) => {
    if ( getPageStatusInSavedItems(pageInfo)) {
        $('div[siteFunction="offcanvasPageFullInfoPageGeneralCustomNotesLimitsAlert"]').show();
        $('div[siteFunction="offcanvasPageFullInfoPageGeneralCustomNotesSavePageAlert"]').hide();
        $('div[siteFunction="offcanvasPageFullInfoPageGeneralCustomNotesContainer"]').show();
    }
    else {
        $('div[siteFunction="offcanvasPageFullInfoPageGeneralCustomNotesLimitsAlert"]').hide();
        $('div[siteFunction="offcanvasPageFullInfoPageGeneralCustomNotesSavePageAlert"]').show();
        $('div[siteFunction="offcanvasPageFullInfoPageGeneralCustomNotesContainer"]').hide();
    }
}

const setCanvasPageCustomTagsVisibility = (pageInfo) => {
    if ( getPageStatusInSavedItems(pageInfo)) {
        $('div[siteFunction="offcanvasPageFullInfoPageCustomTags"]').show();
    }
    else {
        $('div[siteFunction="offcanvasPageFullInfoPageCustomTags"]').hide();
    }
}

const setCanvasPageCustomCatsVisibility = (pageInfo) => {
    if ( getPageStatusInSavedItems(pageInfo)) {
        $('div[siteFunction="offcanvasPageFullInfoPageCustomCats"]').show();
    }
    else {
        $('div[siteFunction="offcanvasPageFullInfoPageCustomCats"]').hide();
    }
}

const setPageStatusButtons = (pageInfo) => {
    if ( getPageStatusInSavedItems(pageInfo)) {
        $('button[siteFunction="offcanvasPageFullInfoPageSaveToSavedItems"]').addClass('disabled');
        $('button[siteFunction="offcanvasPageFullInfoPageRemoveFromSavedItems"]').removeClass('disabled');
    }
    else {
        $('button[siteFunction="offcanvasPageFullInfoPageSaveToSavedItems"]').removeClass('disabled');
        $('button[siteFunction="offcanvasPageFullInfoPageRemoveFromSavedItems"]').addClass('disabled');
    }
}

const resetCustomNotesInputAreas = () => {
    $('#offcanvasPageFullInfoPageGeneralCustomNotesEdit').val('');
    $('span[siteFunction="offcanvasPageFullInfoPageGeneralCustomNoteWords"]').text('W: 0');
    $('span[siteFunction="offcanvasPageFullInfoPageGeneralCustomNoteChars"]').text('C: 0');
}

const setCustomNoteTextAreaLimits = () => {
    keepTextInputLimits(
        '#offcanvasPageFullInfoPageGeneralCustomNotesEdit', 
        50, 
        250, 
        'span[siteFunction="offcanvasPageFullInfoPageGeneralCustomNoteWords"]', 
        'span[siteFunction="offcanvasPageFullInfoPageGeneralCustomNoteChars"]'
    );
}

const setCanvasButtonsFunctions = (pageInfo) => {

    // .off('click') is mandatory, otherwise the listener will be binded multiple times to the button
    // and the function will be executed for all history of pageInfo until the whole page is reloaded
    $('button[siteFunction="offcanvasPageFullInfoPageGeneralCustomNotesEditAdd"]').off('click').on('click', function() {
        REFRESH_PAGE_INFO_AFTER__addCustomNote(pageInfo);
    });

    $('button[siteFunction="offcanvasPageFullInfoPageGeneralCustomNotesEditUpdate"]').off('click').on('click', function() {
        const noteId = $('button[siteFunction="offcanvasPageFullInfoPageGeneralCustomNotesEditUpdate"]').attr('selectedNote');
        REFRESH_PAGE_INFO_AFTER__updateCustomNote(noteId, pageInfo);
    });

    $('button[siteFunction="offcanvasPageFullInfoPageGeneralCustomNotesEditDelete"]').off('click').on('click', function() {
        const noteId = $('button[siteFunction="offcanvasPageFullInfoPageGeneralCustomNotesEditDelete"]').attr('selectedNote');
        REFRESH_PAGE_INFO_AFTER__deleteCustomNote(noteId, pageInfo);
    });

    $('button[siteFunction="offcanvasPageFullInfoPageSaveToSavedItems"]').off('click').on('click', function() {
        REFRESH_PAGE_INFO_AFTER__savePageToSavedItems(pageInfo);
        setPageStatusButtons(pageInfo);
        setCanvasGeneralCustomNotesVisibility(pageInfo);
        setCanvasPageCustomTagsVisibility(pageInfo);
        setCanvasPageCustomCatsVisibility(pageInfo);

        // for custom notes
        refreshNotesTable(pageInfo);

        // for custom tags
        setTagEditor('#offcanvasPageFullInfoPageTagsEditor', pageInfo);
        REFRESH_PAGE_INFO_BEFORE__fillTagList(pageInfo);

        // for custom cats
        setCatEditor('#offcanvasPageFullInfoPageCatsEditor', pageInfo);
        REFRESH_PAGE_INFO_BEFORE__fillCatList(pageInfo);

    });
    
    $('button[siteFunction="offcanvasPageFullInfoPageRemoveFromSavedItems"]').off('click').on('click', function() {
        //removePageFromSavedItems(pageInfo);
        REFRESH_PAGE_INFO_AFTER__removePageFromSavedItems(pageInfo);
        setPageStatusButtons(pageInfo);
        setCanvasGeneralCustomNotesVisibility(pageInfo);
        setCanvasPageCustomTagsVisibility(pageInfo);
        setCanvasPageCustomCatsVisibility(pageInfo);

        // for custom notes
        refreshNotesTable(pageInfo);

        // for custom tags
        REFRESH_PAGE_INFO_BEFORE__fillTagList(pageInfo);
        createGlobalLists();

        // for custom cats
        REFRESH_PAGE_INFO_BEFORE__fillCatList(pageInfo);
        createGlobalLists();
    });
}

const refreshNotesTable = (pageInfo) => {
    const notesData = getPageNotes(pageInfo);
    const table = $('#offcanvasPageFullInfoPageGeneralCustomNotesTable').DataTable();
    table.rows().remove().draw();
    table.rows.add(notesData).draw();
}

const addCustomNote = (pageInfo) => {
    note = $('#offcanvasPageFullInfoPageGeneralCustomNotesEdit').val();
    if (addNote(note, pageInfo)) refreshNotesTable(pageInfo);
    resetCustomNotesInputAreas();
    toggleUpdateNoteButton();
    toggleDeleteNoteButton();
    unsetSelectedNote();
}
const REFRESH_PAGE_INFO_AFTER__addCustomNote = REFRESH_PAGE_INFO_AFTER(addCustomNote);

const updateCustomNote = (noteId, pageInfo) => {
    note = $('#offcanvasPageFullInfoPageGeneralCustomNotesEdit').val();
    if (updateNote(noteId, note, pageInfo)) refreshNotesTable(pageInfo);
    resetCustomNotesInputAreas();
    toggleUpdateNoteButton();
    toggleDeleteNoteButton();
    unsetSelectedNote();
}
const REFRESH_PAGE_INFO_AFTER__updateCustomNote = REFRESH_PAGE_INFO_AFTER(updateCustomNote);

const deleteCustomNote = (noteId, pageInfo) => {
    if (deleteNote(noteId, pageInfo)) refreshNotesTable(pageInfo);
    resetCustomNotesInputAreas();
    toggleUpdateNoteButton();
    toggleDeleteNoteButton();
    unsetSelectedNote();
}
const REFRESH_PAGE_INFO_AFTER__deleteCustomNote  = REFRESH_PAGE_INFO_AFTER(deleteCustomNote);

const setInitialCanvasSectionsVisibility = () => {
    $('div[siteFunction="offcanvasPageFullInfoPageGeneral"]').hide();
    $('div[siteFunction="offcanvasPageFullInfoPageTags"]').hide();
    $('div[siteFunction="offcanvasPageFullInfoPageCats"]').hide();
}

const setCanvasSectionsOpeners = () => {
    $('span[siteFunction="offcanvasPageFullInfoPageOpenGeneral"]').on('click', function() {
        $('div[siteFunction="offcanvasPageFullInfoPageGeneral"]').fadeIn();
    })

    $('span[siteFunction="offcanvasPageFullInfoPageTagsOpen"]').on('click', function() {
        $('div[siteFunction="offcanvasPageFullInfoPageTags"]').fadeIn();
    })

    $('span[siteFunction="offcanvasPageFullInfoPageCatsOpen"]').on('click', function() {
        $('div[siteFunction="offcanvasPageFullInfoPageCats"]').fadeIn();
    })
}

const fillPageTitle = (pageInfo) => {
    $('#offcanvasPageFullInformationTitle').text(`Doc information (${pageInfo.siteInfo.title})`);
    $('a[siteFunction="offcanvasPageFullInfoPageGeneralDocLink"]').text(pageInfo.siteInfo.title);
    $('a[siteFunction="offcanvasPageFullInfoPageGeneralDocLink"]').attr('href',pageInfo.siteInfo.permalink);
}

const fillPageLastUpdate = (pageInfo) => {
    $('span[siteFunction="offcanvasPageFullInfoPageGeneralLastUpdateDate"]').text(formatDate(pageInfo.siteInfo.lastUpdate));
}

const fillPageExcerpt = (pageInfo) => {
    pageExcerpt = pageInfo.siteInfo.excerpt || '---';
    $('span[siteFunction="offcanvasPageFullInfoPageGeneralExcerptText"]').text(pageExcerpt);
}

const fillPageRelatedPages = (pageInfo) => {
    const relatedPagesHtml = (relatedPages) => {
        let html = ''
        relatedPages.forEach(page => {
            const relatedPageExcerpt = getObjectFromArray(
                {
                    permalink: page.permalink, 
                    title: page.title
                }, 
                pageList
            ).excerpt || '';
            
            html = html + 
                `
                    <div class="my-3">
                        <a 
                            title="${relatedPageExcerpt}" 
                            class="text-nowrap m-3 m-md-1 py-1 px-2 bg-light-subtle rounded-pill" 
                            href="${page.permalink.indexOf('/') === 0 ? page.permalink : '/'+page.permalink}">
                            ${page.title}
                        </a>
                    </div>
                `
        });
        return html;
    }
    pageRelatedPages = pageInfo.siteInfo.relatedPages || [];
    $('div[siteFunction="offcanvasPageFullInfoPageGeneralRelatedPagesText"]').html(relatedPagesHtml(pageRelatedPages));
}

const fillPageSimilarPages = (pageInfo) => {
    const similarPagesHtml = (similarPages) => {
        let html = ''
        similarPages.forEach(page => {
            const similarPageExcerpt = getObjectFromArray(
                {
                    permalink: page.permalink, 
                    title: page.title
                }, 
                pageList
            ).excerpt || '';
            
            html = html + 
                `
                    <div class="my-3">
                        <a 
                            title="${similarPageExcerpt}" 
                            class="text-nowrap m-3 m-md-1 py-1 px-2 bg-light-subtle rounded-pill" 
                            href="${page.permalink.indexOf('/') === 0 ? page.permalink : '/'+page.permalink}">
                            ${page.title}
                        </a>
                    </div>
                `
        });
        return html;
    }
    pageSimilarPages = pageInfo.siteInfo.similarByContent.slice(0, settings.similarByContent.maxPages) || [];
    $('div[siteFunction="offcanvasPageFullInfoPageGeneralSimilarPagesText"]').html(similarPagesHtml(pageSimilarPages));
}

const fillPageAutoSummary = (pageInfo) => {
    pageAutoSummary = pageInfo.siteInfo.autoSummary || '---';
    $('span[siteFunction="offcanvasPageFullInfoPageGeneralAutoSummaryText"]').text(pageAutoSummary);
}

const initCustomNotesTable = (pageInfo) => {
    const permalink = pageInfo.siteInfo.permalink.trim();
    const $table = $('#offcanvasPageFullInfoPageGeneralCustomNotesTable').DataTable();
    if ($.fn.DataTable.isDataTable($table)) $table.destroy();
        
    setDataTable(
        '#offcanvasPageFullInfoPageGeneralCustomNotesTable',
        `PageCustomNotes_${permalink}`,
        
        // columns settings
        [
            // date
            {
                data: 'date',
                type: 'date',
                className: 'dt-left alwaysCursorPointer alwaysTextToLeft align-middle',
                width:'100px',
                createdCell: function(td, cellData, rowData, row, col) {
                    $(td).addClass('border-bottom border-secondary border-opacity-25');
                }
            }, 

            // note
            {
                data: "note",
                className: 'alwaysCursorPointer align-middle',
                width:'350px',
                createdCell: function(td, cellData, rowData, row, col) {
                    $(td).addClass('border-bottom border-secondary border-opacity-25');
                }
            },

            // note id
            { 
                data: "id",
                searchable: false, 
                orderable: false, 
                visible: false,
                width:'100px',
                className: 'alwaysCursorPointer align-middle',
                createdCell: function(td, cellData, rowData, row, col) {
                    $(td).addClass('border-bottom border-secondary border-opacity-25');
                }
            }

        ],

        (table) => { postProcessCustomNotesTable(table, pageInfo) },
        (rowData) => {processCustomNotesTabelsClickOnRow(rowData, pageInfo)},
        {
            order: [
                [0, "desc"]
            ],
            data: getPageNotes(pageInfo),
            autoWidth: false
        },
        null,
        preFlight.envInfo
    );
}

const processCustomNotesTabelsClickOnRow = (rowData, pageInfo) => {
    $('#offcanvasPageFullInfoPageGeneralCustomNotesEdit').val(rowData.data.note).on('input', function() { 
        disableDeleteNoteButton(); // disable delete if click on table and start typing in note text area
    });

    $('#offcanvasPageFullInfoPageGeneralCustomNotesEdit').trigger('keyup'); // to update word and char counts
    toggleDeleteNoteButton(true);
    toggleUpdateNoteButton(true);
    setSelectedNote(rowData);
}

const postProcessCustomNotesTable = (table, pageInfo) => {
    if(table) {
        // do some css corrections on mobile
        //applyTableStylesOnMobile();

        // create additional buttons under the table
        deleteAllNotes = {
            attr: {
                siteFunction: 'tablePageCustomNotesRemoveAllNotes',
                title: `Remove all custom notes for page ${pageInfo.siteInfo.title}`
            },
            className: 'btn-danger btn-sm text-light focus-ring focus-ring-warning mb-2',
            text: 'Delete Notes',
            action: () => {
                REFRESH_PAGE_INFO_AFTER__removeAllCustomNotes(pageInfo);
                const notesData = getPageNotes(pageInfo);
                table.clear().rows.add(notesData).draw();
                resetCustomNotesInputAreas();
                toggleUpdateNoteButton();
                toggleDeleteNoteButton();
                unsetSelectedNote();
        
            }
        };
        const btnArray = [];
        btnArray.push(deleteAllNotes);
        addAdditionalButtonsToTable(table, '#offcanvasPageFullInfoPageGeneralCustomNotesTable', 'bottom2', btnArray);      
    }   
}

const toggleDeleteNoteButton = (mode) => {
    if (mode) $('button[siteFunction="offcanvasPageFullInfoPageGeneralCustomNotesEditDelete"]').removeClass('disabled');
    else $('button[siteFunction="offcanvasPageFullInfoPageGeneralCustomNotesEditDelete"]').addClass('disabled');
}

const toggleUpdateNoteButton = (mode) => {
    if (mode) $('button[siteFunction="offcanvasPageFullInfoPageGeneralCustomNotesEditUpdate"]').removeClass('disabled');
    else $('button[siteFunction="offcanvasPageFullInfoPageGeneralCustomNotesEditUpdate"]').addClass('disabled');
}

const setSelectedNote = (rowData) => {
    $('button[siteFunction="offcanvasPageFullInfoPageGeneralCustomNotesEditDelete"]').attr('selectedNote', rowData.data.id);
    $('button[siteFunction="offcanvasPageFullInfoPageGeneralCustomNotesEditUpdate"]').attr('selectedNote', rowData.data.id)
}

const unsetSelectedNote = () => {
    $('button[siteFunction="offcanvasPageFullInfoPageGeneralCustomNotesEditDelete"]').attr('selectedNote', '');
    $('button[siteFunction="offcanvasPageFullInfoPageGeneralCustomNotesEditUpdate"]').attr('selectedNote', '')
}

const disableDeleteNoteButton = () => {
    toggleDeleteNoteButton();
    $('button[siteFunction="offcanvasPageFullInfoPageGeneralCustomNotesEditDelete"]').attr('selectedNote', '');
}

const setTagEditor = (editorSelector, pageInfo) => {
    if ( getPageStatusInSavedItems(pageInfo)) {
        const options = {
            toolbar: {
                show: false,
                selector: '#offcanvasPageFullInfoPageTagsEditorToolbar'
            },
            menuBar: {
                get show() {return options.toolbar.show},
                selector: '#offcanvasPageFullInfoPageTagsEditorMenubar'
            },
            builtInOptions: {}
        };

        setEditor(
            editorSelector, 
            options,
            (editor) => { postProcessTagEditor(editor, editorSelector, pageInfo); }, 
            (editor, callbackResponse) => { postProcessingEditorText(editor, editorSelector, pageInfo, callbackResponse); },
            (editor) => { postProcessEditorTextOnHitEnter(editor, pageInfo); }
        );
    }
}

const setCatEditor = (editorSelector, pageInfo) => {
    if ( getPageStatusInSavedItems(pageInfo)) {
        const options = {
            toolbar: {
                show: false,
                selector: '#offcanvasPageFullInfoPageCatsEditorToolbar'
            },
            menuBar: {
                get show() {return options.toolbar.show},
                selector: '#offcanvasPageFullInfoPageCatsEditorMenubar'
            },
            builtInOptions: {}
        };

        setEditor(
            editorSelector, 
            options,
            (editor) => { postProcessCatEditor(editor, editorSelector, pageInfo); }, 
            (editor, callbackResponse) => { postProcessingEditorText(editor, editorSelector, pageInfo, callbackResponse); },
            (editor) => { postProcessCatEditorTextOnHitEnter(editor, pageInfo); }
        );
    }
}

const postProcessTagEditor = (editor, editorSelector, pageInfo) => {
    // post processing editor after creation, 
    // runs only one time, after the editor is created

    // setting the observer to see when tags are added in the editor (when hit enter key)
    // and apply styles to the tags
    setElementCreateBySelectorObserver (`${editorSelector} p`, () => {
        $(`${editorSelector} p`).each( function() {
            if ($(this).children().length === 0) $(this).addClass('btn bg-success-subtle btn-sm text-dark  m-2');
            else $(this).addClass('addTagLine');
        });
        $(".addTagLine:not(:last)").hide();
    }); 
}

const postProcessCatEditor = (editor, editorSelector, pageInfo) => {
    // post processing editor after creation, 
    // runs only one time, after the editor is created

    // setting the observer to see when cats are added in the editor (when hit enter key)
    // and apply styles to the cats
    setElementCreateBySelectorObserver (`${editorSelector} p`, () => {
        $(`${editorSelector} p`).each( function() {
            if ($(this).children().length === 0) $(this).addClass('btn bg-success-subtle btn-sm text-dark  m-2');
            else $(this).addClass('addCatLine');
        });
        $(".addCatLine:not(:last)").hide();
    }); 
}

const postProcessingEditorText = (editor, editorSelector, pageInfo, callbackResponse) => {
    const editorText = editor.getData();
    const cleanEditorText = DOMPurify.sanitize(editorText.replace(/<[^>]*>/g, '').replace(/(\n|&nbsp;)/g, ''));    
    if ( cleanEditorText.trim() ==='' || cleanEditorText.trim() ===',') editor.setData(cleanEditorText);

    // setTimeout is necessary to avoid endless loop
    setTimeout(() => { callbackResponse(); }, 10); //job done here, is time to set back the change:data listener 
}

const postProcessEditorTextOnHitEnter = (editor, pageInfo) => {
    let editorText = editor.getData();
    const matches = editorText.match(/<p>&nbsp;<\/p>$/g);
    const count = matches ? matches.length : 0
    if (count > 0) {
        tags = transformEditorTextToArray(editorText);
        if (tags.length > 0 ) {
            editor.setData('');    
            REFRESH_PAGE_INFO_BEFORE__processNewTags(tags, pageInfo);
        }
    }
    else {
        editor.setData(editorText.replace(/^(<p>&nbsp;<\/p>)+/, '').replace(/<p>&nbsp;<\/p>$/g, ''));
        editor.model.change((writer) => { writer.setSelection(writer.createPositionAt(editor.model.document.getRoot(), 'end')); });
    }
};

const postProcessCatEditorTextOnHitEnter = (editor, pageInfo) => {
    let editorText = editor.getData();
    const matches = editorText.match(/<p>&nbsp;<\/p>$/g);
    const count = matches ? matches.length : 0
    if (count > 0) {
        cats = transformEditorTextToArray(editorText);
        if (cats.length > 0 ) {
            editor.setData('');    
            REFRESH_PAGE_INFO_BEFORE__processNewCats(cats, pageInfo);
        }
    }
    else {
        editor.setData(editorText.replace(/^(<p>&nbsp;<\/p>)+/, '').replace(/<p>&nbsp;<\/p>$/g, ''));
        editor.model.change((writer) => { writer.setSelection(writer.createPositionAt(editor.model.document.getRoot(), 'end')); });
    }
};

const processNewTags = (tags, pageInfo) => {
    tags.forEach ( tag => {
        const isPageTag = _.includes(_.map(getPageTags(pageInfo), _.toLower), _.toLower(tag));
        if (!isPageTag) REFRESH_PAGE_INFO_BEFORE__addTagToPage(tag, pageInfo);
    } );
}
const REFRESH_PAGE_INFO_BEFORE__processNewTags = REFRESH_PAGE_INFO_BEFORE(processNewTags);

const processNewCats = (cats, pageInfo) => {
    cats.forEach ( cat => {
        const isPageCat = _.includes(_.map(getPageCats(pageInfo), _.toLower), _.toLower(cat));
        if (!isPageCat) REFRESH_PAGE_INFO_BEFORE__addCatToPage(cat, pageInfo);
    } );
}
const REFRESH_PAGE_INFO_BEFORE__processNewCats = REFRESH_PAGE_INFO_BEFORE(processNewCats);

const addTagToPage = (tag, pageInfo) => {
    updateGlobalTagLists(tag);
    if (addTag(tag, pageInfo)) {
        pageInfo.savedInfo.customTags = getPageTags(pageInfo);
        REFRESH_PAGE_INFO_BEFORE__fillTagList(pageInfo);
    }
}
const REFRESH_PAGE_INFO_BEFORE__addTagToPage = REFRESH_PAGE_INFO_BEFORE(addTagToPage);

const addCatToPage = (cat, pageInfo) => {
    updateGlobalCatLists(cat);
    if (addCat(cat, pageInfo)) {
        pageInfo.savedInfo.customCategories = getPageTags(pageInfo);
        REFRESH_PAGE_INFO_BEFORE__fillCatList(pageInfo);
    }
}
const REFRESH_PAGE_INFO_BEFORE__addCatToPage = REFRESH_PAGE_INFO_BEFORE(addCatToPage);

const updateGlobalTagLists = (tag) => {
    const isCustomTag = _.includes(_.map(globCustomTags, _.toLower), _.toLower(tag));
    if ( !isCustomTag ) { 
        globCustomTags.push(tag);
        globCustomTags.sort();
        globAllTags.push(tag);
        globAllTags.sort();
    }
}

const updateGlobalCatLists = (cat) => {
    const isCustomCat = _.includes(_.map(globCustomCats, _.toLower), _.toLower(cat));
    if ( !isCustomCat ) { 
        globCustomCats.push(cat);
        globCustomCats.sort();
        globAllCats.push(cat);
        globAllCats.sort();
    }
}
