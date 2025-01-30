

// called from siteIncludes/partials/site-pages/pageSearch.html
const sitePages__pageSearch = () => {
    let table; // define table here, otherwise the getters below will not have access to it and will raise errors
    $(document).ready(function() {

        sitePagesFn.handleOffCanvasClose();
        sitePagesFn.setPageSearchButtonsFunctions();
        sitePagesFn.setPageSearchList();
        table = $(`table[siteFunction="sitePagesDetailsPageTable"]`).DataTable();

        const isOnlyShowPages = () => {
            let queryString = window.location.search;
            if (queryString.startsWith('?')) {
                queryString = queryString.slice(1);
            }       
            const params = new URLSearchParams(queryString);  
            return params.has('showPages') && params.get('showPages') === '1' && params.toString() === 'showPages=1';
        }

        showPages = readQueryString('showPages');
        showSaved = readQueryString('showSaved');
        showCustomCats = readQueryString('showCustomCats');
        showCustomTags = readQueryString('showCustomTags');

        if (showPages === '1') {
            $('#site_pages_details').removeClass('d-none');
            if (isOnlyShowPages()) {
                history.replaceState({}, document.title, window.location.pathname);
                return;
            }       
        }
        
        if (showSaved === '1')  {
            sitePagesFn.pageTableSearchPanesSelection = [
                {
                    column:2,
                    rows:['Is Saved'],
                    get name() { return sitePagesFn.getColName(table,this.column) }
                },
                {
                    column:3,
                    rows:[],
                    get name() { return sitePagesFn.getColName(table,this.column) }
                },
                {
                    column:4,
                    rows:[],
                    get name() { return sitePagesFn.getColName(table,this.column) }
                },
                {
                    column:7,
                    rows:[],
                    get name() { return sitePagesFn.getColName(table,this.column) }
                },
                {
                    column:8,
                    rows:[],
                   get name() { return sitePagesFn.getColName(table,this.column) }
                }
            ];
            sitePagesFn.setLastFilterInfo(i18next.t('dt_pages_active_filter_box_title_active_filter'));
            sitePagesFn.handleDropdownClassOverlap();
            history.replaceState({}, document.title, window.location.pathname);
            return;
        }

        if (showCustomCats === '1')  {
            sitePagesFn.pageTableSearchPanesSelection = [
                {
                    column:2,
                    rows:['Has Custom Categories'],
                    get name() { return sitePagesFn.getColName(table,this.column) }
                },
                {
                    column:3,
                    rows:[],
                    get name() { return sitePagesFn.getColName(table,this.column) }
                },
                {
                    column:4,
                    rows:[],
                    get name() { return sitePagesFn.getColName(table,this.column) }
                },
                {
                    column:7,
                    rows:[],
                    get name() { return sitePagesFn.getColName(table,this.column) }
                },
                {
                    column:8,
                    rows:[],
                    get name() { return sitePagesFn.getColName(table,this.column) }
                }
            ];
            sitePagesFn.setLastFilterInfo('Active filter');
            sitePagesFn.handleDropdownClassOverlap();
            history.replaceState({}, document.title, window.location.pathname);
            return;
        }

        if (showCustomTags === '1')  {
            sitePagesFn.pageTableSearchPanesSelection = [
                {
                    column:2,
                    rows:['Has Custom Tags'],
                    get name() { return sitePagesFn.getColName(table,this.column) }
                },
                {
                    column:3,
                    rows:[],
                    get name() { return sitePagesFn.getColName(table,this.column) }
                },
                {
                    column:4,
                    rows:[],
                    get name() { return sitePagesFn.getColName(table,this.column) }
                },
                {
                    column:7,
                    rows:[],
                    get name() { return sitePagesFn.getColName(table,this.column) }
                },
                {
                    column:8,
                    rows:[],
                    get name() { return sitePagesFn.getColName(table,this.column) }
                }
            ];
            sitePagesFn.setLastFilterInfo('Active filter');
            sitePagesFn.handleDropdownClassOverlap();
            history.replaceState({}, document.title, window.location.pathname);
            return;
        }

    });
}

// called from siteIncludes/partials/site-pages/pages.html
const sitePages__pages = () => {
    $(document).ready(function() {
        sitePagesFn.setPagesDataTable(); // always datatable init to be first to ensure rendering of all rows
        sitePagesFn.setPagesTableButtonsFunctions();
        sitePagesFn.setPagesSavedStatus();
        sitePagesFn.setPagesTags();
        sitePagesFn.setPagesCats();
        sitePagesFn.setPagesTablePageBadges();
       
    });
}

// called from siteIncludes/partials/site-pages/saved-items.html
const sitePages__savedItems = () => {
    $(document).ready( function() {
        sitePagesFn.setSavedItemsButtonsFunctions();
    });
};

// using a 'namespace' to avoid fn name duplicates
sitePagesFn = {

    // general
    handleDropdownClassOverlap: () => {
        // bootstrap class dropdown-menu overlaps with the search panes class which is also dropdown-menu 
        // when auto applying selections (see utilities/setDataTable()/createTable_ASYNC()) we need to hide
        // the search panes in order to auto apply selections.
        // this will make the More button from the main menu to not show its dropdown-menu anymore
        setTimeout(()=>$(`#${settings.catMenuMoreBtn}`).children().last().css('display', ''), 100);
    },

    getColName: (tbl,index) => {
        return $(tbl.column(index).header()).text().trim() 
    },

    // search page section
    setPageSearchList: () => {
        setSearchList(
            `#pageSearchInput`, 
            `#pageSearchResults`, 
            `li[siteFunction="searchPageListItem"]`, 
            `<li siteFunction="searchPageListItem">`,
            '</li>',
            false,
            (result) => { sitePagesFn.showPageInfo(transformStringFromPageSearchList(result)); },
            (filteredList) => {},
            preFlight.envInfo
        );
    },

    setPageSearchButtonsFunctions: () => {

        // open page details section (pages table)
        $('#openSitePagesDetails').off('click').click( function() {
            $('#site_pages_details').removeClass('d-none');
            sitePagesFn.forceRedrawPagesTable();
            $('div[sitefunction="sitePagesDetails"]').fadeIn();
        });         
    },
    
    // page offcanvas
    showPageInfo: (page) => {
        pageInfo = {
            siteInfo: getObjectFromArray ({permalink: page.permalink, title: page.title}, pageList),
            savedInfo: getPageSavedInfo (page.permalink, page.title),
        };
        showPageFullInfoCanvas(pageInfo);
    },

    updateInfoAfterOffCanvasClose: (page=null) => {
        sitePagesFn.setPagesTablePageBadges();
        sitePagesFn.setPagesSavedStatus();
        sitePagesFn.setPagesTags();
        sitePagesFn.setPagesCats();
    },

    handleOffCanvasClose: () =>{
        // from utilities.js
        removeObservers('.offcanvas class=hiding getClass=true');
        setElementChangeClassObserver('.offcanvas', 'hiding', true, () => {

            // NOT USED - ACTIVE FILTER LOGIC (see also other places in the code)
            // change the label of 'Clear' button of Active Filter box to 'Apply' after return from offcanvas
            // since the first click on it after return from offcanvas will re-apply the filter instead of clearing it
            /*
            if($('div[sitefunction="sitePagesDetailsLastFilter"]').hasClass('d-none'))
                $('button[sitefunction="sitePagesDetailsClearFilter"]').find('div').find('span').last().text('Clear');
            else
                $('button[sitefunction="sitePagesDetailsClearFilter"]').find('div').find('span').last().text('Apply');
            */

            if (preFlight.envInfo.device.deviceType === 'mobile') {
                // force a click to filter box to reset the show filter button and status
                // if current filter is shown before open offcanvas, when returning, the filter is hidden but the button is red
                // so we need to force a click to make it green and change the eye icon
                // the same is applied when closing searchPanes window on mobile, see onSearchPanesClose below
                if ($('button[siteFunction="sitePagesDetailsShowFilter"]').hasClass('show'))
                    $('button[siteFunction="sitePagesDetailsShowFilter"]').click();
            }

            sitePagesFn.bruteRebuildPagesTable();
        });
    },

    bruteRebuildPagesTable: () => {
        sitePagesFn.updateInfoAfterOffCanvasClose(pageInfo.page);
        $(`table[siteFunction="sitePagesDetailsPageTable"] td`).removeClass('table-active'); // remove any previous selection
        sitePagesFn.rebuildPagesTableSearchPanes();
        sitePagesFn.setLastFilterInfo(i18next.t('dt_pages_active_filter_box_title_last_filter'));
        sitePagesFn.handleDropdownClassOverlap();
        setTimeout(()=>{
            sitePagesFn.forceRedrawPagesTable(); 
        }, 100);
    },

    // pages details section
    setLastFilterInfo: (lastFilterLabel) => {
       
        const getFilterValue = (colIndex) => {
            
            const getKey = (object, value) => {
                
                return  _.findKey(object, val => val === value);
            }

            const getDefaultValues = (object, key) => {
                return object[key];
            }

            const value = sitePagesFn.pageTableSearchPanesSelection.length === 0 ?
                null : 
                getObjectFromArray({column: colIndex}, sitePagesFn.pageTableSearchPanesSelection) === 'none' ?
                    null:
                    getObjectFromArray({column: colIndex}, sitePagesFn.pageTableSearchPanesSelection).rows.join('; ');
            
            // values from other searcPanes columns except for colIndex=2 does not need to be further passed in default English translation
            if (colIndex !== 2) return value; 
            else {
                // values for colIndex = 2 needs to be further passed in default English translation
                // for each element in value array we get its translation key from common.active_filter keys group
                // we get the English translation by reading the key from common.active_filter keys group from engLanguage global
                // which is passed at build time end extracted in preflight.js, 
                // because i18next may not load en language at init so we may not be able to use it
                let siteLanguage;
                if (!settings.multilang.enabled) siteLanguage = 'en';
                else siteLanguage = settings.multilang.availableLang[settings.multilang.siteLanguage].lang;
                const langResource = i18next.services.resourceStore.data[siteLanguage]; // siteLanguage loaded by i18next at init
                const siteLang = langResource.translation.common.active_filter;
                const valueArray = value.split(';').map(item => item.trim());
                const valueKeys = valueArray.map(value => getKey(siteLang, value));
                const defaultLang = engLanguage.common.active_filter;
                const defaultValues = valueKeys.map(key => getDefaultValues(defaultLang, key));
                return defaultValues.join('; ');
            }
        }

        const checkFilterItems = () => {
            if ( sitePagesFn.pageTableSearchPanesSelection.length === 0 ||  _.sumBy(sitePagesFn.pageTableSearchPanesSelection, obj => _.get(obj, 'rows.length', 0)) === 0) return;
    
            filterTagsObj = getObjectFromArray({column:7}, sitePagesFn.pageTableSearchPanesSelection) === 'none' ? 
                {} : 
                getObjectFromArray({column:7}, sitePagesFn.pageTableSearchPanesSelection);
    
            filterCatsObj = getObjectFromArray({column:8}, sitePagesFn.pageTableSearchPanesSelection) === 'none' ? 
                {} : 
                getObjectFromArray({column:8}, sitePagesFn.pageTableSearchPanesSelection);
    
            if ( _.isEmpty(filterTagsObj) && _.isEmpty(filterCatsObj)) return;
            
            filterTags = filterTagsObj.rows || [];
            filterCats = filterCatsObj.rows || [];
    
            if ( filterTags.length === 0  && filterCats.lenght === 0) return;
    
            if( filterTags.length > 0 ) _.find(sitePagesFn.pageTableSearchPanesSelection, { column: 7 }).rows = _.intersection(filterTags, globAllTags);
            if( filterCats.length > 0 ) _.find(sitePagesFn.pageTableSearchPanesSelection, { column: 8 }).rows = _.intersection(filterCats, globAllCats);
    
        }

        const setFilterDisplayValue = (selector, selector_container, value, colIndex) => {
            const getTheKey = (text) => {
                return _.snakeCase(text);
            }

            const getTheValue = (key) => {
                return i18next.t(`common.active_filter.${key}`);
            }

            if (value) {
                // need to do some translations for colIndex === 2, the document details
                if (colIndex === 2) {
                    const valueArray = value.split(";").map(item => item.trim());
                    const keys = valueArray.map(getTheKey);
                    const values = keys.map(getTheValue);
                    $(selector).text(values.join('; '));      
                    $(selector_container).removeClass('d-none');
                }

                // no tranlsations needed for the other filter columns
                else {
                    $(selector).text(value);
                    $(selector_container).removeClass('d-none');
                }

            } else {
                $(selector).text('');
                $(selector_container).addClass('d-none');
            }
            
        }
        
        checkFilterItems();

        if ( 
            sitePagesFn.pageTableSearchPanesSelection.length > 0 && 
            _.sumBy(sitePagesFn.pageTableSearchPanesSelection, obj => _.get(obj, 'rows.length', 0)) > 0
            ) 
        {

            sitePagesFn.pageTableSearchPanesSelection.forEach(selectionPane => {
                if (selectionPane.name) {
                    setFilterDisplayValue (
                        `span[sitefunction="sitePagesDetailsLastFilterDetailsPage${selectionPane.name.replace(/\s+/g, '')}"]`,
                        `div[sitefunction="sitePagesDetailsLastFilterDetailsPage${selectionPane.name.replace(/\s+/g, '')}_container"]`,
                        getFilterValue(selectionPane.column),
                        selectionPane.column
                    );
                }
            });

            $('span[sitefunction="sitePagesDetailsLastFilterLabel"]').text(lastFilterLabel);

            if (preFlight.envInfo.device.deviceType === 'desktop') {
                $('div[sitefunction="sitePagesDetailsLastFilter"]').draggable({
                    containment: "window"
                });    
                const topPos = $('div[sitefunction="sitePagesDetailsLastFilter"]').css('top');
                const leftPos =  $('div[sitefunction="sitePagesDetailsLastFilter"]').css('left');
                
                // topPos === 'auto' && leftPos === 'auto' means showing the active/last filter details for the first time after page is loaded
                if (topPos === 'auto' || leftPos === 'auto') {
                    const defaultLeft = 20;
                    // first display outside viewport to calculate the height 
                    $('div[sitefunction="sitePagesDetailsLastFilter"]')
                        .css('top',`${$(window).height() + 200}px`)
                        .css('left', `${defaultLeft}px`);
                    $('div[sitefunction="sitePagesDetailsLastFilter"]').removeClass('d-none');
                    const defaultTop = 
                        $(window).height() - 
                        $('div[sitefunction="sitePagesDetailsLastFilter"]').height() - 
                        sitePagesFn.pageTableSearchPanesSelection.length*3*30; // 30px for each possible row of each filter possible selection

                    // display on the corect position
                    $('div[sitefunction="sitePagesDetailsLastFilter"]').addClass('d-none');
                    $('div[sitefunction="sitePagesDetailsLastFilter"]')
                        .css('top',`${defaultTop}px`)
                        .css('left', `${defaultLeft}px`);
                }
            } else  {
                $('div[sitefunction="sitePagesDetailsLastFilterDetails"]').hide();
                $('div[sitefunction="sitePagesDetailsLastFilterHeader"]').removeClass('pb-2 border-bottom border-secondary border-opacity-25');
                $('div[sitefunction="sitePagesDetailsLastFilter"]')
                    .css('left', '0').css('bottom', '-15px')
                    .css('width','100%')
                    .css('border-radius', '0');
            }

            $('div[sitefunction="sitePagesDetailsLastFilter"]').removeClass('d-none');
        }
        else
            $('div[sitefunction="sitePagesDetailsLastFilter"]').addClass('d-none');
    },

    setPagesTableButtonsFunctions: () => {

        // open page info offcanvas for page row from pages table
        $('span[siteFunction="sitePagesPageLinkToOffCanvas"]').off('click').click( function() {
            sitePagesFn.showPageInfo({permalink: $(this).attr('pagePermalinkReference'), title:$(this).attr('pageTitleReference')});
        });

        // open page info offcanvas when click on a related page of a page row from pages table
        $('span[siteFunction="pageRelatedPageLinkToOffCanvas"]').off('click').click( function() {
            sitePagesFn.showPageInfo({permalink: $(this).attr('pageRelatedPermalinkReference'), title:$(this).attr('pageRelatedTitleReference')});
        });

        // open page info offcanvas when click on a similar page of a page row from pages table
        $('span[siteFunction="pageSimilarPageLinkToOffCanvas"]').off('click').click( function() {
            sitePagesFn.showPageInfo({permalink: $(this).attr('pageSimilarPermalinkReference'), title:$(this).attr('pageSimilarTitleReference')});
        });

        // show filter details on mobile
        $('button[siteFunction="sitePagesDetailsShowFilter"]').off('click').click( function() {
            if (preFlight.envInfo.device.deviceType !== 'mobile') return;
            if ($(this).hasClass('noShow')) {
                $(this)
                    .removeClass('noShow').addClass('show')
                    .removeClass('btn-success').addClass('btn-danger');
                $(this).find('i').removeClass('bi-eye').addClass('bi-eye-slash');
                $('div[sitefunction="sitePagesDetailsLastFilterDetails"]').show();
                $('div[sitefunction="sitePagesDetailsLastFilterHeader"]').addClass('pb-2 border-bottom border-secondary border-opacity-25');
            } else {
                $(this)
                    .addClass('noShow').removeClass('show')
                    .addClass('btn-success').removeClass('btn-danger');
                $(this).find('i').addClass('bi-eye').removeClass('bi-eye-slash');
                $('div[sitefunction="sitePagesDetailsLastFilterDetails"]').hide();
                $('div[sitefunction="sitePagesDetailsLastFilterHeader"]').removeClass('pb-2 border-bottom border-secondary border-opacity-25');
            }

        });

        // remove page from saved items when click on the related icon in the page title column of the table
        $(document)
            .off('click', 'button[siteFunction="pagesRemovePageFromSavedItems"]')
            .on('click', 'button[siteFunction="pagesRemovePageFromSavedItems"]', function(event) {
                const closestButton = event.target.closest('button');
                const permalink = $(closestButton).attr('pagePermalinkReference');
                const title = $(closestButton).attr('pageTitleReference');
                const page = {
                    siteInfo: {
                        permalink: permalink,
                        title: title
                    }
                };
                removePageFromSavedItems(page);
                sitePagesFn.bruteRebuildPagesTable();            
            });

        // save page to saved items when click on the related icon in the page title column of the table
        $(document)
            .off('click', 'button[siteFunction="pagesSavePageToSavedItems"]')
            .on('click', 'button[siteFunction="pagesSavePageToSavedItems"]', function(event) {
                const closestButton = event.target.closest('button');
                const permalink = $(closestButton).attr('pagePermalinkReference');
                const title = $(closestButton).attr('pageTitleReference');
                const page = {
                    siteInfo: {
                        permalink: permalink,
                        title: title
                    }
                };
                savePageToSavedItems(page);
                // just to warn that will be removed from saved items if not adding some tags or cats or notes or comments
                showToast(`Document ${title} is now saved!<br><strong>HEADS UP!!!</strong><br>Document will be removed automatically if you don't add some custom info (tags, categories, notes, comments)`, 'bg-warning', 'text-dark');
                sitePagesFn.setPagesSavedStatus();
            });
        
        // NOT USED - ACTIVE FILTER LOGIC (see also other places in the code)        
        // change the label of 'Clear' button of Active Filter box if was set to 'Apply' after a return from offcanvas
        /*
        $('button[sitefunction="sitePagesDetailsClearFilter"]').off('click').click(function() {
            setTimeout(() => {
                if($('button[sitefunction="sitePagesDetailsClearFilter"]').find('div').find('span').last().text() === 'Apply')
                    $('button[sitefunction="sitePagesDetailsClearFilter"]').find('div').find('span').last().text('Clear');
            }, 200);
            
        });
        */

        // HEADS UP!!!
        // HANDLERS FOR OPEN AND CLOSE ACTIVE FILTER ARE DEFINED IN postProcessPagesTable
        // BECAUSE WE NEED tableUniqueID AS PARAMETER

    },

    setPagesTablePageBadges: async () => {
        await waitForI18Next(); // need to ensure that translation is available
        const pageSiteInfoBadges = (page) => {
            if (page.siteInfo === 'none') return ['',[]];
            let siteInfoBadges = '';
            let flags = [];
            
            if (page.siteInfo.tags.length > 0 ) {
                siteInfoBadges += 
                    `
                        <span
                            cellFunction="siteBadge"
                            siteFunction="pageHasSiteTagsBadge"
                            title = "dt_pages_col_details_site_tags_badge_title" 
                            class="btn-primary shadow-none m-1 px-3 py-2 fw-medium badge rounded-pill text-bg-primary"
                            pageTitleReference="${page.siteInfo.title}"
                            pagePermaLinkReference="${page.siteInfo.permalink}"
                            data-i18n="[title]dt_pages_col_details_site_tags_badge_title;dt_pages_col_details_site_tags_badge_text">
                            ${i18next.t('dt_pages_col_details_site_tags_badge_text')}
                        </span>
                    `;
                flags.push(i18next.t(`common.active_filter.${_.snakeCase('Has Site Tags')}`));
            }

            if (page.siteInfo.categories.length > 0 ) {
                siteInfoBadges += 
                    `
                        <span
                            cellFunction="siteBadge"
                            siteFunction="pageHasSiteCategoryBadge"
                            title = "dt_pages_col_details_site_cats_badge_title" 
                            class="m-1 px-3 py-2 fw-medium badge rounded-pill text-bg-danger"
                            pageTitleReference="${page.siteInfo.title}"
                            pagePermaLinkReference="${page.siteInfo.permalink}"
                            data-i18n="[title]dt_pages_col_details_site_cats_badge_title;dt_pages_col_details_site_cats_badge_text">
                            ${i18next.t('dt_pages_col_details_site_cats_badge_text')}
                        </span>
                    `;
                flags.push(i18next.t(`common.active_filter.${_.snakeCase('Has Site Categories')}`));
            }

            if (page.siteInfo.autoSummary !== '' ) {
                siteInfoBadges += 
                    `
                        <span
                            cellFunction="siteBadge"
                            siteFunction="pageHasAutoSummaryBadge"
                            title = "dt_pages_col_details_summary_badge_title" 
                            class="m-1 px-3 py-2 fw-medium badge rounded-pill text-bg-dark"
                            pageTitleReference="${page.siteInfo.title}"
                            pagePermaLinkReference="${page.siteInfo.permalink}"
                            data-i18n="[title]dt_pages_col_details_summary_badge_title;dt_pages_col_details_summary_badge_text">
                            ${i18next.t('dt_pages_col_details_summary_badge_text')}
                        </span>
                    `;
                flags.push(i18next.t(`common.active_filter.${_.snakeCase('Has Auto Summary')}`));
            }

            if (page.siteInfo.excerpt !== '' ) {
                siteInfoBadges += 
                    `
                        <span
                            cellFunction="siteBadge"
                            siteFunction="pageHasExcerptBadge"
                            title = "dt_pages_col_details_excerpt_badge_title" 
                            class="m-1 px-3 py-2 fw-medium badge rounded-pill text-bg-secondary"
                            pageTitleReference="${page.siteInfo.title}"
                            pagePermaLinkReference="${page.siteInfo.permalink}"
                            data-i18n="[title]dt_pages_col_details_excerpt_badge_title;dt_pages_col_details_excerpt_badge_text">
                            ${i18next.t('dt_pages_col_details_excerpt_badge_text')}
                        </span>
                    `;
                flags.push(i18next.t(`common.active_filter.${_.snakeCase('Has Excerpt')}`));
            }
            
            return [siteInfoBadges, flags];
        }

        const pageSavedInfoBadges = (page) => {
            if (page.savedInfo === 'none') return ['',[i18next.t(`common.active_filter.${_.snakeCase('Is Not Saved')}`)]];
            let savedInfoBadges = '';
            let flags = [];
    
            if (page.savedInfo.customTags.length > 0 ) {
                savedInfoBadges += 
                    `
                        <span
                            cellFunction="siteBadge"
                            siteFunction="pageHasCustomTagsBadge"
                            title = "dt_pages_col_details_custom_tags_badge_title" 
                            class="m-1 px-3 py-2 fw-medium badge rounded-pill text-bg-success"
                            pageTitleReference="${page.savedInfo.title}"
                            pagePermaLinkReference="${page.savedInfo.permalink}"
                            data-i18n="[title]dt_pages_col_details_custom_tags_badge_title;dt_pages_col_details_custom_tags_badge_text">
                            ${i18next.t('dt_pages_col_details_custom_tags_badge_text')}
                        </span>
                    `;
                flags.push(i18next.t(`common.active_filter.${_.snakeCase('Has Custom Tags')}`));
            }
            
            if (page.savedInfo.customCategories.length > 0 ) {
                savedInfoBadges += 
                    `
                        <span
                            cellFunction="siteBadge"
                            siteFunction="pageHasCustomCategoriesBadge"
                            title = "dt_pages_col_details_custom_cats_badge_title" 
                            class="m-1 px-3 py-2 fw-medium badge rounded-pill text-bg-success"
                            pageTitleReference="${page.savedInfo.title}"
                            pagePermaLinkReference="${page.savedInfo.permalink}"
                            data-i18n="[title]dt_pages_col_details_custom_cats_badge_title;dt_pages_col_details_custom_cats_badge_text">
                            ${i18next.t('dt_pages_col_details_custom_cats_badge_text')}
                        </span>
                    `;
                flags.push(i18next.t(`common.active_filter.${_.snakeCase('Has Custom Categories')}`));
            }
            
            if (page.savedInfo.customNotes.length > 0 ) {
                savedInfoBadges += 
                    `
                        <span
                            cellFunction="siteBadge"
                            siteFunction="pageHasCustomNotesBadge"
                            title = "dt_pages_col_details_notes_badge_title" 
                            class="m-1 px-3 py-2 fw-medium badge rounded-pill text-bg-warning"
                            pageTitleReference="${page.savedInfo.title}"
                            pagePermaLinkReference="${page.savedInfo.permalink}"
                            data-i18n="[title]dt_pages_col_details_notes_badge_title;dt_pages_col_details_notes_badge_text">
                            ${i18next.t('dt_pages_col_details_notes_badge_text')}
                        </span>
                    `;
                flags.push(i18next.t(`common.active_filter.${_.snakeCase('Has Custom Notes')}`));
            }
            
            if (flags.length > 0) flags.unshift(i18next.t(`common.active_filter.${_.snakeCase('Is Saved')}`));
            return [savedInfoBadges, flags];
    
        }
        
        $('td[colFunction="pageInfoBadges"]').each( function() {
            const pageSiteInfo = getObjectFromArray(
                {
                    permalink: $(this).attr('pagePermalinkReference'), 
                    title: $(this).attr('pageTitleReference')
                }, pageList);
            
            const pageSavedInfo = getPageSavedInfo($(this).attr('pagePermalinkReference'), $(this).attr('pageTitleReference'));
            
            siteInfo = pageSiteInfoBadges({ siteInfo: pageSiteInfo });
            savedInfo = pageSavedInfoBadges({ siteInfo: pageSiteInfo, savedInfo: pageSavedInfo });
            const badgesHtml = 
                `<span>` +
                    siteInfo[0] +
                    savedInfo[0] +
                '</span>';
            $(this).html(badgesHtml);
            
            $(`span[cellFunction="siteBadge"][pageTitleReference="${pageSiteInfo.title}"][pagePermaLinkReference="${pageSiteInfo.permalink}"]`).each(function() {
                $(this).attr('data-raw', JSON.stringify(_.union(siteInfo[1], savedInfo[1])));
            })
        });

    },

    pageTableSearchPanesSelection: [], // object to keep the current pagesTable searchPanes current filter

    setPagesDataTable: async () => {
        await waitForI18Next();
        const tableSelector = 'table[siteFunction="sitePagesDetailsPageTable"]';

        if( $.fn.DataTable.isDataTable(tableSelector) ) {
            $(tableSelector).DataTable().destroy();
            $(tableSelector).removeAttr('id').removeAttr('aria-describedby');
        }

        const colDefinition = [
            // page title
            {
                className: 'alwaysCursorPointer',
                title: i18next.t('dt_pages_col_title_text'),
                type: 'html-string',
                searchable: true,
                width: preFlight.envInfo.device.deviceType === 'desktop' ? '200px' : '100px',
                createdCell: function (td, cellData) {
                    $(td).addClass('border-bottom border-secondary border-opacity-25');
                },
                
            }, 
    
            // last update
            {
                title: i18next.t('dt_pages_col_last_update_text'),
                type: 'date-dd-mmm-yyyy', 
                className: 'dt-left', 
                exceptWhenRowSelect: true,
                searchable: true,
                width:'100px',
                createdCell: function (td, cellData) {
                    $(td).addClass('border-bottom border-secondary border-opacity-25');
                },
            }, 
    
            // details
            { 
                title: i18next.t('dt_pages_col_details_text'),
                type: 'string',
                searchable: true, 
                orderable: false, 
                exceptWhenRowSelect: true,
                visible: true,
                width: '400px',
                createdCell: function (td, cellData) {
                    $(td).find('span').addClass('d-flex');
                    $(td).addClass('border-bottom border-secondary border-opacity-25');
                },
            }, 

            // related
            { 
                title: i18next.t('dt_pages_col_related_text'),
                type: 'string',
                searchable: true, 
                orderable: false, 
                exceptWhenRowSelect: true,
                visible: false,
                width: '400px',
                createdCell: function (td, cellData) {
                    $(td).addClass('border-bottom border-secondary border-opacity-25');
                },
            },

            // similar
            { 
                title: i18next.t('dt_pages_col_similar_text'),
                type: 'string',
                searchable: true, 
                orderable: false, 
                exceptWhenRowSelect: true,
                visible: false,
                width: '400px',
                createdCell: function (td, cellData) {
                    $(td).addClass('border-bottom border-secondary border-opacity-25');
                },
            },
            
            // excerpt
            {
                type: 'string',
                title: i18next.t('dt_pages_col_excerpt_text'),
                exceptWhenRowSelect: true,
                orderable: false,
                searchable: true,
                visible: false,
                width: '400px',
                createdCell: function (td, cellData) {
                    $(td).addClass('border-bottom border-secondary border-opacity-25');
                }, 
            },

            // auto summary
            {
                type: 'string',
                title: i18next.t('dt_pages_col_summary_text'),
                exceptWhenRowSelect: true,
                searchable: true,
                orderable: false,
                visible: false,
                width: '400px',
                createdCell: function (td, cellData) {
                    $(td).addClass('border-bottom border-secondary border-opacity-25');
                }, 
            },

            // tags
            {
                type: 'string',
                title: i18next.t('dt_pages_col_tags_text'),
                exceptWhenRowSelect: true,
                searchable: true,
                orderable: false,
                visible: true,
                width: '400px',
                createdCell: function (td, cellData) {
                    $(td).find('span').addClass('d-flex');
                    $(td).addClass('border-bottom border-secondary border-opacity-25');
                },
            },

             // cats
             {
                type: 'string',
                title: i18next.t('dt_pages_col_cats_text'),
                exceptWhenRowSelect: true,
                searchable: true,
                orderable: false,
                visible: true,
                width: '400px',
                createdCell: function (td, cellData) {
                    $(td).find('span').addClass('d-flex');
                    $(td).addClass('border-bottom border-secondary border-opacity-25');
                },
            }
        ];

        const commonAdditionalTableSettings = {

            scrollX: true,

            fixedColumns: {
                leftColumns: 1
            },

            scrollCollapse: false, // stay at fixed scrollY height and avoid the bottom of table to bounce up and down
            scrollY: '30vh',   

            // columnDefs object IS USED ONLY FOR SEARCH PANES
            // WITH THE PURPOSE OF HAVING A CLEANER CODE
            // SEARCH PANES CAN BE DEFINED IN THE SAME WAY IN colDefinition OBJECT 
            // BUT WE LIKE TO HAVE THEM HERE
            // columns are defined in colDefinition object
            columnDefs: [
                // page details
                {
                    searchPanes: {
                        options:  getSearchPaneOptionsFromArray(
                            tableSelector, 
                            2, 
                            ()=>{
                                return new Set([
                                    i18next.t(`common.active_filter.${_.snakeCase('Has Auto Summary')}`),
                                    i18next.t(`common.active_filter.${_.snakeCase('Has Custom Categories')}`),
                                    i18next.t(`common.active_filter.${_.snakeCase('Has Custom Notes')}`),
                                    i18next.t(`common.active_filter.${_.snakeCase('Has Custom Tags')}`),
                                    i18next.t(`common.active_filter.${_.snakeCase('Has Excerpt')}`),
                                    i18next.t(`common.active_filter.${_.snakeCase('Has Site Categories')}`),
                                    i18next.t(`common.active_filter.${_.snakeCase('Has Site Tags')}`),
                                    i18next.t(`common.active_filter.${_.snakeCase('Is Saved')}`),
                                    i18next.t(`common.active_filter.${_.snakeCase('Is Not Saved')}`)
                                ]);
                            },
                            (row, value) => {
                                // for filtering based on search panes selection, the code is iterating each table row for each selection
                                // (see utilities.getSearchPaneOptionsFromArray)
                                // this is the current iteration
                                // can be useful to overwrite the behaviour of iteration based on some conditions
                                // row=current row; value=current selection in the search pane in which this callback is executed
                            }
                        ),
                        show: true,
                        collapse: true,
                        viewCount: false,
                        initCollapsed: preFlight.envInfo.device.deviceType === 'desktop' ? false : true,
                        preSelect: true,
                        dtOpts: {
                            select: {
                                style: 'multi'
                            },
                        },
                    },
                    targets: [2],
                    
                },

                // related pages
                {
                    searchPanes: {
                        options: getSearchPaneOptionsFromArray(
                            tableSelector, 
                            3, 
                            () => {
                                return new Set (allPagesTitles(pageList, 'relatedPages'))
                            },
                            (selectedRow, selectedSearchPaneValue)=>{}
                        ),
                        show: true,
                        initCollapsed: preFlight.envInfo.device.deviceType === 'desktop' ? false : true,
                        viewCount: false,
                        preSelect: true,
                        dtOpts: {
                            select: {
                                style: 'multi'
                            }
                        }
                        
                    },
                    targets: [3],
                    
                },

                // similar pages
                {
                    searchPanes: {
                        options: getSearchPaneOptionsFromArray(
                            tableSelector, 
                            4, 
                            () => {
                                return new Set (allPagesTitles(pageList, 'similarByContent'))
                            },
                            (row, value)=>{}
                        ),
                        show: true,
                        initCollapsed: preFlight.envInfo.device.deviceType === 'desktop' ? false : true,
                        viewCount: false,
                        preSelect: true,
                        dtOpts: {
                            select: {
                                style: 'multi'
                            }
                        }
                    },
                    targets: [4],       
                },

                // tags
                {
                    searchPanes: {
                        options: getSearchPaneOptionsFromArray(
                            tableSelector, 
                            7, 
                            () => {
                                return new Set(globAllTags);
                            }
                        ),
                        show: true,
                        initCollapsed: preFlight.envInfo.device.deviceType === 'desktop' ? false : true,
                        viewCount: false,
                        preSelect: true,
                        dtOpts: {
                            select: {
                                style: 'multi'
                            }
                        }
                    },
                    targets: [7],                  
                },

                // cats
                {
                    searchPanes: {
                        options: getSearchPaneOptionsFromArray(
                            tableSelector, 
                            8, 
                            () => {
                                return new Set(globAllCats);
                            }, 
                            (row, value)=>{}
                        ),
                
                        show: true,
                        initCollapsed: preFlight.envInfo.device.deviceType === 'desktop' ? false : true,
                        viewCount: false,
                        preSelect: true,
                        dtOpts: {
                            select: {
                                style: 'multi'
                            }
                        }
                    },
                    targets: [8],           
                },

                // cancel all other searchPanes
                {
                    searchPanes: {
                        show: false
                    },
                    targets: '_all'    
                },
                
            ],
        };

        const additionalTableSettings = commonAdditionalTableSettings;

        setDataTable(
            tableSelector,
            `SitePages`,     
            colDefinition,
            (table) => {sitePagesFn.postProcessPagesTable(table, `SitePages`)}, // post process table
            (rowData) => {}, // do nothing on row click
            additionalTableSettings,
            
            // searchPanes general settings
            // specific column searchPane settings are in columnDefs object, inside commonAdditionalTableSettings object 
            {
                enable: true,
                // page load may become very slow. better to use viewCount=false when cascade=false because viewCount doesn't update dynamicaly
                cascade: false,
                searchPanesOpenCallback: () => {
                    // the following line is applicable only to search panes having viewCount = true
                    $('.dtsp-nameCont > :nth-child(2)').removeClass('bg-secondary').addClass('bg-warning').addClass('text-dark');
                    $('span[siteFunction="sitePagesDetailsShowSearchPanes_loader"]').addClass('d-none');
                },
                searchPanesCloseCallback: (tableSearchPanesSelection) => {
                    sitePagesFn.onSearchPanesClose(tableSearchPanesSelection);
                },
                searchPanesSelectionChangeCallback: (tableSearchPanesSelection) => {
                    sitePagesFn.onSearchPanesSelectionChange(tableSearchPanesSelection);
                },
                searchPanesCurrentSelection: sitePagesFn.pageTableSearchPanesSelection || []
            },
            preFlight.envInfo,
            (settings) => {sitePagesFn.forceRedrawPagesTable()} // do something on initComplete; settings.api is the table object
        );
    },

    onSearchPanesClose: (tableSearchPanesSelection) => {
        sitePagesFn.refreshLastFilterInfo(tableSearchPanesSelection);

        if (preFlight.envInfo.device.deviceType === 'mobile') {
            // force a click to filter box to reset the show filter button and status
            // if current filter is shown before open offcanvas, when returning, the filter is hidden but the button is red
            // so we need to force a click to make it green and change the eye icon
            if ($('button[siteFunction="sitePagesDetailsShowFilter"]').hasClass('show'))
                $('button[siteFunction="sitePagesDetailsShowFilter"]').click();
        }
    },

    onSearchPanesSelectionChange: (tableSearchPanesSelection) => {
        sitePagesFn.refreshLastFilterInfo(tableSearchPanesSelection);
    },

    refreshLastFilterInfo: (tableSearchPanesSelection) => {
        sitePagesFn.pageTableSearchPanesSelection = tableSearchPanesSelection;
        sitePagesFn.setLastFilterInfo(i18next.t('dt_pages_active_filter_box_title_active_filter'));
    },

    postProcessPagesTable: (table, tableUniqueID) => {
        if(table) {
            // open filter btn from active filter warning box
            $(document)
                .off('click', 'button[siteFunction="sitePagesDetailsShowSearchPanes"]')
                .on('click', 'button[siteFunction="sitePagesDetailsShowSearchPanes"]', function() {
                    $('span[siteFunction="sitePagesDetailsShowSearchPanes_loader"]').removeClass('d-none');
                    setTimeout(()=>{
                        table.helpers.triggerApplyActiveFilter(tableUniqueID);
                    }, 100);
                });
            
            // clear filter btn from active filter warning box
            $(document)
                .off('click', 'button[siteFunction="sitePagesDetailsClearFilter"]')
                .on('click', 'button[siteFunction="sitePagesDetailsClearFilter"]', function() {
                    $('span[siteFunction="sitePagesDetailsClearFilter_loader"]').removeClass('d-none');  
                    setTimeout(()=>{
                        table.helpers.clearActiveFilter(tableUniqueID);
                        sitePagesFn.handleDropdownClassOverlap();
                        $('span[siteFunction="sitePagesDetailsClearFilter_loader"]').addClass('d-none');
                    }, 100);
                    sitePagesFn.pageTableSearchPanesSelection = [];     
                });
            
            sitePagesFn.addAdditionalPagesTableButtons(table);
        }   
    },

    addAdditionalPagesTableButtons: (table) => {

        // need to wait for i8next full init, otherwise data-i18n will not be translated when firs show the page
        waitForI18Next().then(() => {
            goToTagBtn = {
                attr: {
                    siteFunction: 'tableNavigateToTagsSP',
                    title: i18next.t('dt_custom_buttons_go_to_tags_btn_title'),
                    "data-i18n": '[title]dt_custom_buttons_go_to_tags_btn_title;dt_custom_buttons_go_to_tags_btn_text'
                },
                className: 'btn-warning btn-sm text-dark mb-2',
                text: i18next.t('dt_custom_buttons_go_to_tags_btn_text'),
                action: () => {
                    window.location.href = '/tag-info'
                }
             }
         
            goToCatsBtn = {
                 attr: {
                     siteFunction: 'tableNavigateToCategoriesSP',
                     title: i18next.t('dt_custom_buttons_go_to_cats_btn_title'),
                     "data-i18n": '[title]dt_custom_buttons_go_to_cats_btn_title;dt_custom_buttons_go_to_cats_btn_text'
                 },
                 className: 'btn-success btn-sm text-light mb-2',
                 text: i18next.t('dt_custom_buttons_go_to_cats_btn_text'),
                 action: () => {
                     window.location.href = '/cat-info'
                 }
             }
             
            // post processing table: adding 2 buttons in the bottom2 zone
            const btnArray = [];
            btnArray.push(goToTagBtn);
            btnArray.push(goToCatsBtn);
            addAdditionalButtonsToTable(table, 'table[siteFunction="sitePagesDetailsPageTable"]', 'bottom2', btnArray);

        });
    },

    redrawPagesTable: () => {

        const hide__ASYNC = () => { return new Promise ( (resolve, reject) => {
            $(`table[siteFunction="sitePagesDetailsPageTable"]`).hide();
            const table = $(`table[siteFunction="sitePagesDetailsPageTable"]`).DataTable();
            resolve(table);
         })};

        hide__ASYNC()
            .then((table) => table.columns.adjust().draw())
            .then(() => $(`table[siteFunction="sitePagesDetailsPageTable"]`).show());
        
    },

    // HEADS UP!!! THIS FUNCTION MUST STAY IN ALL PLACES WHERE IS INVOKED
    // OTHERWISE IT MAY BE POSSIBLE TO NOT HAVE THE TABLE DRAWN AS EXPECTED
    // e.g. HEADER NOT ALIGNED WITH CONTENT OR scrollX TO NOT BE SET CORRECTLY WHEN WE NEED overflowX TO BE ACTIVE
    forceRedrawPagesTable: () => {
        setTimeout(()=>{
            const table = $(`table[siteFunction="sitePagesDetailsPageTable"]`).DataTable();
            table.columns.adjust();
        },0);
    },

    setPagesTags: () => {

        const tagElement = (page, allTags, tag, isSiteTag) => {
            const tagBtnColor = isSiteTag ? 'btn-primary' : 'btn-success';
            const tagBtnTitle = i18next.t('dt_pages_col_tags_title', { postProcess: 'sprintf', sprintf: [tag] });
            return ( 
                `
                    <a 
                        siteFunction="tagButton" 
                        pagePermalinkReference="${page.permalink}"
                        pageTitleReference="${page.title}"
                        tagType="${isSiteTag ? 'siteTag' : 'customTag'}"
                        id="${tag}" 
                        type="button" 
                        class="focus-ring focus-ring-warning px-3 mr-5 my-2 btn btn-sm ${tagBtnColor} position-relative"
                        title="${tagBtnTitle}"
                        data-i18n="[title]dt_pages_col_tags_title_static"
                        href="tag-info?tag=${tag}"
                        data-raw="${JSON.stringify(allTags).replace(/"/g, '&quot;')}">
                        ${tag}
                    </a>
                `);


        }

        $('td[colFunction="pageInfoTags"]').each(function() {
            const permalink = $(this).attr('pagePermalinkReference');
            const title = $(this).attr('pageTitleReference');
            pageSiteInfo = getObjectFromArray({permalink: permalink, title: title}, pageList);
            const siteTags = pageSiteInfo === 'none' ? [] : pageSiteInfo['tags'] || [];
            const customTags = getPageTags({siteInfo:{permalink: permalink, title: title}}) || [];
            const allTags = _.union(siteTags, customTags);

            let tagsHtml = '';
            siteTags.forEach( tag => {
                tagsHtml += tagElement(pageSiteInfo, allTags, tag, true);
            });

            customTags.forEach( tag => {
                tagsHtml += tagElement(pageSiteInfo, allTags, tag, false);
            });

            tagsHtml = 
                `   <div>
                        <span
                            siteFunction="pageInfoTagsContainer"
                            pagePermalinkReference="${permalink}"
                            pageTitleReference="${title}">
                            ${tagsHtml}
                        </span>
                    </div>
                `;
            $tempElement = $(tagsHtml)
            $tempElement.attr('data-raw', JSON.stringify(allTags));
            $(this).html($tempElement.html());
        });
    },

    setPagesCats: () => {

        const catElement = (page, allCats, cat, isSiteCat) => {
            const catBtnColor = isSiteCat ? 'text-danger' : 'text-success';
            return ( 
                `
                    <a 
                        siteFunction="catButton" 
                        pagePermalinkReference="${page.permalink}"
                        pageTitleReference="${page.title}"
                        catType="${isSiteCat ? 'siteCat' : 'customCat'}"
                        id="${cat}" 
                        type="button" 
                        class="focus-ring focus-ring-warning px-3 mr-5 my-2 btn btn-sm ${catBtnColor} position-relative border-0 shadow-none"
                        title = "Details for category ${cat}"
                        data-i18n="[title]dt_pages_col_cats_title_static"
                        href="cat-info?cat=${cat}"
                        data-raw="${JSON.stringify(allCats).replace(/"/g, '&quot;')}">
                        ${cat}
                    </a>
                `);


        }

        $('td[colFunction="pageInfoCats"]').each(function() {
            const permalink = $(this).attr('pagePermalinkReference');
            const title = $(this).attr('pageTitleReference');
            pageSiteInfo = getObjectFromArray({permalink: permalink, title: title}, pageList);
            const siteCats = pageSiteInfo === 'none' ? [] : pageSiteInfo['categories'] || [];
            const customCats = getPageCats({siteInfo:{permalink: permalink, title: title}}) || [];
            const allCats = _.union(siteCats, customCats);

            let catsHtml = '';
            siteCats.forEach( cat => {
                catsHtml += catElement(pageSiteInfo, allCats, cat, true);
            });

            customCats.forEach( cat => {
                catsHtml += catElement(pageSiteInfo, allCats, cat, false);
            });

            catsHtml = 
                `   <div>
                        <span
                            siteFunction="pageInfoCatsContainer"
                            pagePermalinkReference="${permalink}"
                            pageTitleReference="${title}">
                            ${catsHtml}
                        </span>
                    </div>
                `;
            $tempElement = $(catsHtml)
            $tempElement.attr('data-raw', JSON.stringify(allCats));
            $(this).html($tempElement.html());
        });
    },

    setPagesSavedStatus: () => {

        const savedStatusBtn = (status, page) => {

            savedInfoItems = 0;
            if (status) {
                const savedInfo = getPageSavedInfo(page.permalink, page.title);
                savedInfoItems = checkSavedItemForValidValues(savedInfo, ['permalink', 'title']);     
            }
            
            btnSiteFunction = status ? 'pagesRemovePageFromSavedItems' : 'pagesSavePageToSavedItems';

            btnColor = status 
                ? savedInfoItems === 0 
                    ? 'text-warning' 
                    : btnSiteFunction === 'pagesRemovePageFromSavedItems'
                        ? 'text-danger'
                        : 'text-success'
                : 'text-success';
                
            btnIcon = status ? 'bi-bookmark-x' : 'bi-bookmark-plus';
            i18Attr = status 
                ? 'dt_pages_col_actions_remove_from_local_btn_title' 
                : 'dt_pages_col_actions_save_to_local_btn_title';
            btnTitle = status 
                ? i18next.t('dt_pages_col_actions_remove_from_local_btn_title') 
                : i18next.t('dt_pages_col_actions_save_to_local_btn_title');

            return (
                `
                    <button
                        siteFunction = "${btnSiteFunction}"
                        class = "btn btn-sm btn-outline border-0 shadow-none ${btnColor} p-0"
                        title = "${btnTitle}"
                        data-i18n = "[title]${i18Attr}"
                        pagePermalinkReference="${page.permalink}"
                        pageTitleReference="${page.title}">
                        <i class="bi ${btnIcon}" style="font-size:1.2rem"></i>
                    </button>
                `
            );
        }

        $('button[siteFunction="pagesRemovePageFromSavedItems"]').remove();
        $('button[siteFunction="pagesSavePageToSavedItems"]').remove();
        $('td[colFunction="pageTitle"]').each(function() {
            const permalink = $(this).attr('pagePermalinkReference');
            const title = $(this).attr('pageTitleReference');
            const page = {
                siteInfo: {
                    permalink: permalink, 
                    title: title
                }
            };
            const pageSavedStatus = getPageStatusInSavedItems(page);
            $(this).find('span[siteFunction="sitePagesPagesTableTitleColButtons"]').append($(savedStatusBtn(pageSavedStatus, page.siteInfo)));

        });
    },

    rebuildPagesTableSearchPanes: () => {

        getOrphanDataTables('').forEach( table => { localStorage.removeItem(table); });
        let table = $(`table[siteFunction="sitePagesDetailsPageTable"]`).DataTable();

        // SELECTION MUST BE CLEARED, OTHERWISE THE TABLE WILL BEHAVE WEIRD
        // RETURNING FROM OFFCANVAS ON A FILTERED TABLE WILL LOSE/REMOVE ALL RECORDS EXCEPT THE FILTERED ONES
        // AND THESE CANNOT BE SHOWN EVEN IF CLEARING THE FILTER, ONLY RELOADING PAGE WILL RESTORE ALL RECORDS 
        table.searchPanes.clearSelections();

        // re-build all to capture all page modifications in table and in searchPanes as well
        table.destroy();
        sitePagesFn.setPagesDataTable();

    },

    savedItemsSchema: {
        "permalink": "string",
        "title": "string",
        "customTags": ["string"],  // Array of strings
        "customCategories": ["string"],  // Array of strings
        "customNotes": [{  // Array of objects with a specific structure
          "date": "date",  // Custom date validation
          "note": "string",
          "id": "string"
        }],
        "customComments": "emptyArray"  // Empty array
    },

    loadSavedItemsFromJsonFileHandler: (files) => {
        const file = files[0];
        if (!file || file === undefined || file.name === '') return;
        if (file.name.split('.').pop() !== 'json') {
            showToast(`Sorry! Only *.json files allowed this time.`, 'bg-danger', 'text-light');
            return;
        }

        if (settings.savedItems.autoSaveBeforeLoad) {
            // saving first, just in case
            const fileName = `savedItems_autoSaved_${getCurrentDateTime()}_${shortUuid()}`
            saveLocalStorageKeyAsJsonFile('savedItems', fileName);
        }

        $('#selectedSavedItemsFileLoading').removeClass('d-none');
        const loadSavedItems__ASYNC = () => {
            return new Promise ( resolve => {
                loadLocalStorageKeyFromJsonFile ('savedItems', file, sitePagesFn.savedItemsSchema);
                cleanSavedItems();
                sitePagesFn.bruteRebuildPagesTable();    
                resolve();
            });
        }

        loadSavedItems__ASYNC().then(()=> {
            $('p[siteFunction="savedItemsFileDropZoneFileName"]').text(file.name).removeClass('d-none');
            setTimeout(()=>$('#selectedSavedItemsFileLoading').addClass('d-none'), 200);
        });
    },

    // saved items section
    setSavedItemsButtonsFunctions: () => {

        // open saved items section and scroll until the section is in view
        $('#openSitePagesSavedItems').off('click').click( function() {
            if (preFlight.envInfo.device.deviceType !== 'desktop') $('.savedDocsInfoTextDesktopOnly').hide();
            setSingleFileUploadDropArea('div[siteFunction="savedItemsFileDropZone"]', '#selectedSavedItemsFile', (files) => {
                sitePagesFn.loadSavedItemsFromJsonFileHandler(files);
            });

            $('#site_pages_saved_items').removeClass('d-none');
            $('div[sitefunction="sitePagesSavedItems"]').fadeIn();
            $('html, body').animate({
                scrollTop: $("#site_pages_saved_items").offset().top
            }, 100);
        });
        
        // show saved pages
        let table; // define table here, otherwise getters below will not have access to it and will raise errors
        $('#showSavedItems').off('click').click( function() {
            $('#site_pages_details').removeClass('d-none');
            $('div[sitefunction="sitePagesDetails"]').fadeIn();
            table = $(`table[siteFunction="sitePagesDetailsPageTable"]`).DataTable();
            sitePagesFn.pageTableSearchPanesSelection = [
                {
                    column:2,
                    rows:[i18next.t('common.active_filter.is_saved')],
                    get name() { return sitePagesFn.getColName(table,this.column) }
                    
                },
                {
                    column:3,
                    rows:[],
                    get name() { return sitePagesFn.getColName(table,this.column) }
                },
                {
                    column:4,
                    rows:[],
                    get name() { return sitePagesFn.getColName(table,this.column) }
                },
                {
                    column:7,
                    rows:[],
                    get name() { return sitePagesFn.getColName(table,this.column) }
                },
                {
                    column:8,
                    rows:[],
                    get name() { return sitePagesFn.getColName(table,this.column) }
                }
            ];
            sitePagesFn.rebuildPagesTableSearchPanes();
            sitePagesFn.setLastFilterInfo(i18next.t('dt_pages_active_filter_box_title_active_filter'));
            sitePagesFn.handleDropdownClassOverlap();

            $('html, body').animate({
                // bookmark is close to top of page, so better to be sure that will not go under header
                scrollTop: $('#site_pages_details').offset().top - 100 
            }, 100); 

            // NOT USED - ACTIVE FILTER LOGIC (see also other places in the code)   
            // force filter to be applied on table
            //$('button[sitefunction="sitePagesDetailsClearFilter"]').find('div').find('span').last().text('Wait');
            //$('button[sitefunction="sitePagesDetailsClearFilter"]').click();
            //setTimeout(()=>$('button[sitefunction="sitePagesDetailsClearFilter"]').find('div').find('span').last().text('Clear'), 200);
        });

        // show not saved pages
        $('#showNotSavedItems').off('click').click( function() {
            $('#site_pages_details').removeClass('d-none');
            $('div[sitefunction="sitePagesDetails"]').fadeIn();
            table = $(`table[siteFunction="sitePagesDetailsPageTable"]`).DataTable();
            sitePagesFn.pageTableSearchPanesSelection = [
                {
                    column:2,
                    rows:[i18next.t('common.active_filter.is_not_saved')],
                    get name() { return sitePagesFn.getColName(table,this.column) }
                    
                },
                {
                    column:3,
                    rows:[],
                    get name() { return sitePagesFn.getColName(table,this.column) }
                },
                {
                    column:4,
                    rows:[],
                    get name() { return sitePagesFn.getColName(table,this.column) }
                },
                {
                    column:7,
                    rows:[],
                    get name() { return sitePagesFn.getColName(table,this.column) }
                },
                {
                    column:8,
                    rows:[],
                    get name() { return sitePagesFn.getColName(table,this.column) }
                }
            ];
            sitePagesFn.rebuildPagesTableSearchPanes();
            sitePagesFn.setLastFilterInfo(i18next.t('dt_pages_active_filter_box_title_active_filter'));
            sitePagesFn.handleDropdownClassOverlap();

            $('html, body').animate({
                // bookmark is close to top of page, so better to be sure that will not go under header
                scrollTop: $('#site_pages_details').offset().top - 100 
            }, 100); 

            // NOT USED - ACTIVE FILTER LOGIC (see also other places in the code)   
            // force filter to be applied on table 
            //$('button[sitefunction="sitePagesDetailsClearFilter"]').find('div').find('span').last().text('Wait');
            //$('button[sitefunction="sitePagesDetailsClearFilter"]').click();
            //setTimeout(()=>$('button[sitefunction="sitePagesDetailsClearFilter"]').find('div').find('span').last().text('Clear'), 200);
        });

        // save the saved items to a local file
        $('#saveSavedItemsToFile').off('click').click( function() {
            const fileName = `savedItems_${getCurrentDateTime()}_${shortUuid()}`
            saveLocalStorageKeyAsJsonFile('savedItems', fileName);
        });
        
        // loads from local file and save to local storage
        $('#selectedSavedItemsFile').off('change').on('change', function(event) {
            sitePagesFn.loadSavedItemsFromJsonFileHandler(event.target.files);
        });
    },
}