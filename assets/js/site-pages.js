

// called from siteIncludes/partials/site-pages/pageSearch.html
const sitePages__pageSearch = () => {
    $(document).ready(function() {
        sitePagesFn.setPageSearchList();
    });

    // small delay to be sure that offcanvas is ready in the DOM, otherwise the observer will fail to set
    setTimeout(()=>{sitePagesFn.handleOffCanvasClose()}, 200); 

    sitePagesFn.setPageSearchButtonsFunctions();
}

// called from siteIncludes/partials/site-pages/pages.html
const sitePages__pages = () => {
    $(document).ready( function() { 
        sitePagesFn.setPagesTableButtonsFunctions();
        sitePagesFn.setPagesTablePageBadges();
        sitePagesFn.setPagesTags();
        sitePagesFn.setPagesCats();
        sitePagesFn.setPagesDataTable();   
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
            (filteredList) => {}
        );
    },

    setPageSearchButtonsFunctions: () => {

        // open page details section (pages table)
        $('#openSitePagesDetails').off('click').click( function() {
            $('#site_pages_details').removeClass('d-none');
            
            // redraw the pages table to avoid wrong table head sizing
            sitePagesFn.forceRedrawPagesTable();
            $('div[sitefunction="sitePagesDetails"]').fadeIn();
        });            
    },
    
    // page offcanvas
    showPageInfo: (page) => {
        pageInfo = {
            siteInfo: getObjectFromArray ({permalink: page.permalink, title: page.title}, pageList),
            savedInfo: getPageSavedInfo (page.permalink, page.title),
            page: page
        };
        showPageFullInfoCanvas(pageInfo);
    },

    updateInfoAfterOffCanvasClose: (page) => {
        sitePagesFn.setPagesTablePageBadges();
        sitePagesFn.setPagesTags();
        sitePagesFn.setPagesCats();
    },

    handleOffCanvasClose: () =>{
        // from utilities.js
        removeObservers('.offcanvas class=hiding getClass=true');
        setElementChangeClassObserver('.offcanvas', 'hiding', true, () => {
            sitePagesFn.updateInfoAfterOffCanvasClose(pageInfo.page);
            $(`table[siteFunction="sitePagesDetailsPageTable"] td`).removeClass('table-active'); // remove any previous selection
            sitePagesFn.rebuildPagesTableSearchPanes();
            sitePagesFn.setLastFilterInfo('Last filter');
        });
    },

    // pages details table
    setLastFilterInfo: (lastFilterLabel) => {
        const getFilterValue = (colIndex) => {

            return sitePagesFn.pageTableSearchPanesSelection.length === 0 ?
            '-' : 
            getObjectFromArray({column: colIndex}, sitePagesFn.pageTableSearchPanesSelection) === 'none' ?
                '-':
                getObjectFromArray({column: colIndex}, sitePagesFn.pageTableSearchPanesSelection).rows.join('; ')
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

        checkFilterItems();
        if ( sitePagesFn.pageTableSearchPanesSelection.length > 0 && _.sumBy(sitePagesFn.pageTableSearchPanesSelection, obj => _.get(obj, 'rows.length', 0)) > 0) {
            $('span[sitefunction="sitePagesDetailsLastFilterDetailsPageDetails"]').text(getFilterValue(2));
            $('span[sitefunction="sitePagesDetailsLastFilterDetailsPageRelatedPages"]').text(getFilterValue(3));
            $('span[sitefunction="sitePagesDetailsLastFilterDetailsPageSimilarPages"]').text(getFilterValue(4));
            $('span[sitefunction="sitePagesDetailsLastFilterDetailsPageTags"]').text(getFilterValue(7));
            $('span[sitefunction="sitePagesDetailsLastFilterDetailsPageCats"]').text(getFilterValue(8));
            $('span[sitefunction="sitePagesDetailsLastFilterLabel"]').text(lastFilterLabel);

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
                const defaultTop = $(window).height() - $('div[sitefunction="sitePagesDetailsLastFilter"]').height() - 60;

                // display on the right position
                $('div[sitefunction="sitePagesDetailsLastFilter"]').addClass('d-none');
                $('div[sitefunction="sitePagesDetailsLastFilter"]')
                    .css('top',`${defaultTop}px`)
                    .css('left', `${defaultLeft}px`);
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
        
    },

    setPagesTablePageBadges: () => {
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
                            title = "Page ${page.siteInfo.title} has site tags" 
                            class="m-1 px-3 py-2 fw-medium badge rounded-pill text-bg-primary"
                            pageTitleReference="${page.siteInfo.title}"
                            pagePermaLinkReference="${page.siteInfo.permalink}">
                            Tags
                        </span>
                    `;
                flags.push('Has Site Tags');
            }

            if (page.siteInfo.categories.length > 0 ) {
                siteInfoBadges += 
                    `
                        <span
                            cellFunction="siteBadge"
                            siteFunction="pageHasSiteCategoryBadge"
                            title = "Page ${page.siteInfo.title} has site categories" 
                            class="m-1 px-3 py-2 fw-medium badge rounded-pill text-bg-danger"
                            pageTitleReference="${page.siteInfo.title}"
                            pagePermaLinkReference="${page.siteInfo.permalink}">
                            Categories
                        </span>
                    `;
                flags.push('Has Site Categories');
            }

            if (page.siteInfo.autoSummary !== '' ) {
                siteInfoBadges += 
                    `
                        <span
                            cellFunction="siteBadge"
                            siteFunction="pageHasAutoSummaryBadge"
                            title = "Page ${page.siteInfo.title} has auto generated summary" 
                            class="m-1 px-3 py-2 fw-medium badge rounded-pill text-bg-dark"
                            pageTitleReference="${page.siteInfo.title}"
                            pagePermaLinkReference="${page.siteInfo.permalink}">
                            Summary
                        </span>
                    `;
                flags.push('Has Auto Summary');
            }

            if (page.siteInfo.excerpt !== '' ) {
                siteInfoBadges += 
                    `
                        <span
                            cellFunction="siteBadge"
                            siteFunction="pageHasExcerptBadge"
                            title = "Page ${page.siteInfo.title} has excerpt" 
                            class="m-1 px-3 py-2 fw-medium badge rounded-pill text-bg-secondary"
                            pageTitleReference="${page.siteInfo.title}"
                            pagePermaLinkReference="${page.siteInfo.permalink}">
                            Excerpt
                        </span>
                    `;
                flags.push('Has Excerpt');
            }
            
            return [siteInfoBadges, flags];
        }

        const pageSavedInfoBadges = (page) => {
            if (page.savedInfo === 'none') return ['',[]];
            let savedInfoBadges = '';
            let flags = [];
    
            if (page.savedInfo.customTags.length > 0 ) {
                savedInfoBadges += 
                    `
                        <span
                            cellFunction="siteBadge"
                            siteFunction="pageHasCustomTagsBadge"
                            title = "Page ${page.siteInfo.title} has custom tags" 
                            class="m-1 px-3 py-2 fw-medium badge rounded-pill text-bg-success"
                            pageTitleReference="${page.savedInfo.title}"
                            pagePermaLinkReference="${page.savedInfo.permalink}">
                            Tags
                        </span>
                    `;
                flags.push('Has Custom Tags');
            }
            
            if (page.savedInfo.customCategories.length > 0 ) {
                savedInfoBadges += 
                    `
                        <span
                            cellFunction="siteBadge"
                            siteFunction="pageHasCustomCategoriesBadge"
                            title = "Page ${page.siteInfo.title} has custom categories" 
                            class="m-1 px-3 py-2 fw-medium badge rounded-pill text-bg-success"
                            pageTitleReference="${page.savedInfo.title}"
                            pagePermaLinkReference="${page.savedInfo.permalink}">
                            Categories
                        </span>
                    `;
                flags.push('Has Custom Categories');
            }
            
            if (page.savedInfo.customNotes.length > 0 ) {
                savedInfoBadges += 
                    `
                        <span
                            cellFunction="siteBadge"
                            siteFunction="pageHasCustomNotesBadge"
                            title = "Page ${page.siteInfo.title} has custom notes" 
                            class="m-1 px-3 py-2 fw-medium badge rounded-pill text-bg-warning"
                            pageTitleReference="${page.savedInfo.title}"
                            pagePermaLinkReference="${page.savedInfo.permalink}">
                            Notes
                        </span>
                    `;
                flags.push('Has Custom Notes');
            }
            
            if (flags.length > 0) flags.unshift('Is Saved');
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
            $(this).attr('data-raw',JSON.stringify(_.union(siteInfo[1], savedInfo[1])));
            $(`span[cellFunction="siteBadge"][pageTitleReference="${pageSiteInfo.title}"][pagePermaLinkReference="${pageSiteInfo.permalink}"]`).each(function() {
                $(this).attr('data-raw',JSON.stringify(_.union(siteInfo[1], savedInfo[1])));
            })
        })
    },

    pageTableSearchPanesSelection: [], // object to keep the current pagesTable searchPanes current filter

    setPagesDataTable: () => {

        if( $.fn.DataTable.isDataTable(`table[siteFunction="sitePagesDetailsPageTable"]`) ) {
            $(`table[siteFunction="sitePagesDetailsPageTable"]`).DataTable().destroy();
            $(`table[siteFunction="sitePagesDetailsPageTable"]`).removeAttr('id').removeAttr('aria-describedby');
        }
        const colDefinition = [
            // page name
            {
                className: 'alwaysCursorPointer',
                title:'Title',
                type: 'html-string',
                searchable: true,
            }, 
    
            // last update
            {
                title:'Last Update',
                type: 'date-dd-mmm-yyyy', 
                className: 'dt-left', 
                exceptWhenRowSelect: true,
                searchable: true,
            }, 
    
            // details
            { 
                title:'Details',
                type: 'string',
                searchable: true, 
                orderable: false, 
                exceptWhenRowSelect: true,
                visible: false,
            }, 

            // related
            { 
                title:'Related Pages',
                type: 'string',
                searchable: true, 
                orderable: false, 
                exceptWhenRowSelect: true
            },

            // similar
            { 
                title:'Similar Pages',
                type: 'string',
                searchable: true, 
                orderable: false, 
                exceptWhenRowSelect: true
            },
            
            // excerpt
            {
                type: 'string',
                title:'Excerpt',
                exceptWhenRowSelect: true,
                orderable: false,
                searchable: true,
                visible: false
            },

            // auto summary
            {
                type: 'string',
                title:'Summary',
                exceptWhenRowSelect: true,
                searchable: true,
                orderable: false,
                visible: false
            },

            // tags
            {
                type: 'string',
                title:'Tags',
                exceptWhenRowSelect: true,
                searchable: true,
                orderable: false,
                visible: false
            },

             // cats
             {
                type: 'string',
                title:'Categories',
                exceptWhenRowSelect: true,
                searchable: true,
                orderable: false,
                visible: false
            }
        ];

        const commonAdditionalTableSettings = {
            scrollX:true,
            fixedColumns: {
                "left": 1
            },
            autoWidth: true,
            deferRender: true, // Defer rendering for speed up
            processing: true,

            initComplete: function(settings, json) {
                sitePagesFn.forceRedrawPagesTable();
            },

            // columnDefs object IS USED ONLY FOR SEARCH PANES
            // WITH THE PURPOSE OF A CLEANER CODE
            // SEARCH PANES CAN BE DEFINED IN THE SAME WAY IN colDefinition OBJECT
            // columns are defined in colDefinition object
            columnDefs: [
                // page details
                {
                    searchPanes: {
                        options:  getSearchPaneOptionsFromArray(
                            'table[siteFunction="sitePagesDetailsPageTable"]', 
                            2, 
                            ()=>{
                                return new Set([
                                    'Has Auto Summary',
                                    'Has Custom Categories',
                                    'Has Custom Notes',
                                    'Has Custom Tags',
                                    'Has Excerpt',
                                    'Has Site Categories',
                                    'Has Site Tags',
                                    'Is Saved'
                                ]);
                            }, 
                            (selectedRow, selectedSearchPaneValue)=>{
                                //console.log(selectedRow);
                                //console.log(selectedSearchPaneValue);
                            }
                        ),
                        show: true,
                        collapse: true,
                        viewCount: false,
                        initCollapsed: false,
                        dtOpts: {
                            select: {
                                style: 'multi'
                            }
                        },
                    },
                    targets: [2],
                    
                },

                // related pages
                {
                    searchPanes: {
                        options: getSearchPaneOptionsFromArray(
                            'table[siteFunction="sitePagesDetailsPageTable"]', 
                            3, 
                            () => {
                                return new Set (allPagesTitles(pageList, 'relatedPages'))
                            },
                            (selectedRow, selectedSearchPaneValue)=>{}
                        ),
                        show: true,
                        initCollapsed: false,
                        viewCount: false,
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
                            'table[siteFunction="sitePagesDetailsPageTable"]', 
                            4, 
                            () => {
                                return new Set (allPagesTitles(pageList, 'similarByContent'))
                            },
                            (selectedRow, selectedSearchPaneValue)=>{}
                        ),
                        show: true,
                        initCollapsed: false,
                        viewCount: false,
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
                            'table[siteFunction="sitePagesDetailsPageTable"]', 
                            7, 
                            () => {
                                return new Set(globAllTags);
                            }, 
                            (selectedRow, selectedSearchPaneValue)=>{}
                        ),
                        show: true,
                        initCollapsed: false,
                        viewCount: false,
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
                            'table[siteFunction="sitePagesDetailsPageTable"]', 
                            8, 
                            () => {
                                return new Set(globAllCats);
                            }, 
                            (selectedRow, selectedSearchPaneValue)=>{}
                        ),
                
                        show: true,
                        initCollapsed: false,
                        viewCount: false,
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
            `table[siteFunction="sitePagesDetailsPageTable"]`,
            `SitePages`,     
            colDefinition,
            (table) => {sitePagesFn.postProcessPagesTable(table)}, // will execute after the table is created
            (rowData) => {}, // will execute when click on row
            additionalTableSettings, // additional datatable settings for this table instance
            
            // searchPanes general settings
            // specific column searchPane settings are in columnDefs object, inside commonAdditionalTableSettings object 
            {
                enable: true,
                // page load may become very slow. better to use viewCount=false when cascade=false because viewCount doesn't update dynamicaly
                cascade: false,
                searchPanesOpenCallback: () => {
                    // the following line is applicable only to search panes having viewCount = true
                    $('.dtsp-nameCont > :nth-child(2)').removeClass('bg-secondary').addClass('bg-warning').addClass('text-dark');
                },
                searchPanesCloseCallback: (tableSearchPanesSelection) => {
                    sitePagesFn.pageTableSearchPanesSelection = tableSearchPanesSelection;
                    sitePagesFn.setLastFilterInfo('Active filter');
                },
                searchPanesSelectionChangeCallback: null,
                searchPanesCurrentSelection: sitePagesFn.pageTableSearchPanesSelection
            }
            
        );
    },

    postProcessPagesTable: (table) => {
        if(table) {
            sitePagesFn.addAdditionalPagesTableButtons(table);
        }   
    },

    addAdditionalPagesTableButtons: (table) => {
        // post processing table: adding 2 buttons in the bottom2 zone

        gotToTagBtn = {
           attr: {
               siteFunction: 'tableNavigateToTagsSP',
               title: 'Go to tags'
           },
           className: 'btn-warning btn-sm text-light mb-2',
           text: 'Tags info',
           action: () => {
               window.location.href = '/tag-info'
           }
       }
    
       gotToCatsBtn = {
           attr: {
               siteFunction: 'tableNavigateToCategoriesSP',
               title: 'Go to categories'
           },
           className: 'btn-success btn-sm text-light mb-2',
           text: 'Categories',
           action: () => {
               window.location.href = '/cat-info'
           }
       }
       const btnArray = [];
       btnArray.push(gotToTagBtn);
       btnArray.push(gotToCatsBtn);
       addAdditionalButtonsToTable(table, 'table[siteFunction="sitePagesDetailsPageTable"]', 'bottom2', btnArray);
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

    forceRedrawPagesTable: () => {
        setTimeout(()=>{
            const table = $(`table[siteFunction="sitePagesDetailsPageTable"]`).DataTable();
            table.order([0, 'asc']);
            table.columns.adjust().draw(); 
        },100);
    },

    setPagesTags: () => {

        const tagElement = (page, allTags, tag, isSiteTag) => {
            const tagBtnColor = isSiteTag ? 'btn-primary' : 'btn-success';
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
                        title = "Details for tag ${tag}"
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
            $(this).attr('data-raw', JSON.stringify(allTags));

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
            $(this).attr('data-raw', JSON.stringify(allCats));

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

    rebuildPagesTableSearchPanes: () => { 
        let table = $(`table[siteFunction="sitePagesDetailsPageTable"]`).DataTable();

        // SELECTION MUST BE CLEARED, OTHERWISE THE TABL WILL BEHAVE WEIRD
        // RETURNING FROM OFFCANVAS ON A FILTERED TABLE WILL LOSE ALL RECORDS EXCEPT THE FILTERED ONES
        // AND THESE CANNOT BE SHOWN EVEN IF CLEARING THE FILTER, ONLY RELOADING PAGE WILL RESTORE ALL RECORDS 
        table.searchPanes.clearSelections();

        // clean local storage, previous saved searchPanes datatables to not overload local storage
        getOrphanDataTables('').forEach( table => { localStorage.removeItem(table); });

        // re-build all to capture all page modifications in table and in searchPanes as well
        table.destroy();
        sitePagesFn.setPagesDataTable();
    },

    // saved items section
    setSavedItemsButtonsFunctions: () => {

        // open saved items section and scroll until the section is in view
        $('#openSitePagesSavedItems').off('click').click( function() {
            $('#site_pages_saved_items').removeClass('d-none');
            $('div[sitefunction="sitePagesSavedItems"]').fadeIn();
            $('html, body').animate({
                scrollTop: $("#site_pages_saved_items").offset().top
            }, 100);
        });
        
        // save the saved items to a local file
        $('#saveStorageToFile').off('click').click( function() {
            saveLocalStorageKeyAsJsonFile('savedItems', 'si.json')
        });
        
        // loads from local file and save to local storage
        $('#selectedLocalFile').off('change').on('change', function(event) {
            const file = event.target.files[0];
    
            if (file) {
                const reader = new FileReader();
    
                reader.onload = function(e) {
                    try {
                        const json = JSON.parse(e.target.result);
                        const key = 'myLocalStorageKey'; // Replace with your desired key
                        localStorage.setItem(key, JSON.stringify(json));
                        showToast(`JSON data from file ${file.name} has been loaded`, 'bg-success', 'text-light');

                    } catch (error) {
                        showToast(`The file ${file.name} is not a valid JSON file and cannot be parsed`, 'bg-danger', 'text-light');
                    }
                };
    
                reader.onerror = function() {
                    console.error('Error reading file:', reader.error);
                    showToast(`Error reading file ${file.name}`, 'bg-danger', 'text-light');
                };
    
                reader.readAsText(file);
            } else {
                showToast('No file selected', 'bg-warning', 'text-dark');
            }
        });
    },
}
