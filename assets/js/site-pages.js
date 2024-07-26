

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
        sitePagesFn.setPagesDataTable();
        
    });
}

// using a 'namespace' to avoid fn name duplicates
sitePagesFn = {
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
    },

    handleOffCanvasClose: () =>{
        // from utilities.js
        removeObservers('.offcanvas class=hiding getClass=true');
        setElementChangeClassObserver('.offcanvas', 'hiding', true, () => {
            sitePagesFn.updateInfoAfterOffCanvasClose(pageInfo.page);
            $(`table[siteFunction="sitePagesDetailsPageTable"] td`).removeClass('table-active'); // remove any previous selection
        });
    },

    setPageSearchButtonsFunctions: () => {
        $('#openSitePagesDetails').off('click').click( function() {
            $('#site_pages_details').removeClass('d-none');
            // redraw the pages table to avoid worng table head sizing
            sitePagesFn.redrawPagesTable();
            $('div[sitefunction="sitePagesDetails"]').fadeIn();
        });            
    },

    setPagesTableButtonsFunctions: () => {
        $('span[siteFunction="sitePagesPageLinkToOffCanvas"]').off('click').click( function() {
            sitePagesFn.showPageInfo({permalink: $(this).attr('pagePermalinkReference'), title:$(this).attr('pageTitleReference')});
        });

        $('span[siteFunction="pageRelatedPageLinkToOffCanvas"]').off('click').click( function() {
            sitePagesFn.showPageInfo({permalink: $(this).attr('pageRelatedPermalinkReference'), title:$(this).attr('pageRelatedTitleReference')});
        });

        $('span[siteFunction="pageSimilarPageLinkToOffCanvas"]').off('click').click( function() {
            sitePagesFn.showPageInfo({permalink: $(this).attr('pageSimilarPermalinkReference'), title:$(this).attr('pageSimilarTitleReference')});
        });
    },

    pageSiteInfoBadges: (page) => {
        if (page.siteInfo === 'none') return '';
        let siteInfoBadges = '';
        
        if (page.siteInfo.tags.length > 0 ) 
            siteInfoBadges += 
                `
                    <span
                        siteFunction="pageHasSiteTagsBadge"
                        title = "Page ${page.siteInfo.title} has site tags" 
                        class="m-1 px-3 py-2 fw-medium badge rounded-pill text-bg-primary">
                        Tags
                    </span>
                `;
        
        if (page.siteInfo.autoSummary !== '' ) 
            siteInfoBadges += 
                `
                    <span
                        siteFunction="pageHasAutoSummaryBadge"
                        title = "Page ${page.siteInfo.title} has auto generated summary" 
                        class="m-1 px-3 py-2 fw-medium badge rounded-pill text-bg-dark">
                        Summary
                    </span>
                `;
        
        return siteInfoBadges;
    },

    pageSavedInfoBadges: (page) => {
        if (page.savedInfo === 'none') return '';
        let savedInfoBadges = '';

        if (page.savedInfo.customTags.length > 0 ) 
            savedInfoBadges += 
                `
                    <span
                        siteFunction="pageHasCustomTagsBadge"
                        title = "Page ${page.siteInfo.title} has custom tags" 
                        class="m-1 px-3 py-2 fw-medium badge rounded-pill text-bg-success">
                        Tags
                    </span>
                `;
        
        if (page.savedInfo.customCategories.length > 0 ) 
            savedInfoBadges += 
                `
                    <span
                        siteFunction="pageHasCustomCategoriesBadge"
                        title = "Page ${page.siteInfo.title} has custom categories" 
                        class="m-1 px-3 py-2 fw-medium badge rounded-pill text-bg-success">
                        Categories
                    </span>
                `;
        
        if (page.savedInfo.customNotes.length > 0 ) 
            savedInfoBadges += 
                `
                    <span
                        siteFunction="pageHasCustomNotesBadge"
                        title = "Page ${page.siteInfo.title} has custom notes" 
                        class="m-1 px-3 py-2 fw-medium badge rounded-pill text-bg-warning">
                        Notes
                    </span>
                `;

        return savedInfoBadges;

    },

    setPagesTablePageBadges: () => {
        $('td[colFunction="pageInfoBadges"]').each( function() {
            const pageSiteInfo = getObjectFromArray(
                {
                    permalink: $(this).attr('pagePermalinkReference'), 
                    title: $(this).attr('pageTitleReference')
                }, pageList);
            
            const pageSavedInfo = getPageSavedInfo($(this).attr('pagePermalinkReference'), $(this).attr('pageTitleReference'));

            const badgesHtml = 
                '<span>' +
                sitePagesFn.pageSiteInfoBadges({ siteInfo: pageSiteInfo }) +
                sitePagesFn.pageSavedInfoBadges({ siteInfo: pageSiteInfo, savedInfo: pageSavedInfo }) +
                '</span>';
            $(this).html(badgesHtml);     
        })
    },

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
                width:'15%'
            }, 
    
            // last update
            {
                title:'Last Update',
                type: 'date-dd-MMM-yyyy', 
                className: 'dt-left', 
                exceptWhenRowSelect: true,
                searchable: true
            }, 
    
            // details
            { 
                title:'Details',
                type: 'string',
                searchable: true, 
                orderable: false, 
                exceptWhenRowSelect: true,
                visible: false
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
            
            initComplete: function(settings, json) {
                    // Adjust columns after initialization to ensure proper alignment
                    const table = $(`table[siteFunction="sitePagesDetailsPageTable"]`).DataTable();
                    setTimeout(()=>{
                        table.order([0, 'asc']).draw();
                        table.columns.adjust().draw();
                    },100);
                    
            },

        };

        const additionalTableSettings = commonAdditionalTableSettings;

        setDataTable(
            `table[siteFunction="sitePagesDetailsPageTable"]`,
            `SitePages`,     
            colDefinition,
            (table) => {sitePagesFn.postProcessPagesTable(table)}, // will execute after the table is created
            (rowData) => {}, // will execute when click on row
            additionalTableSettings // additional datatable settings for this table instance
            
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
               siteFunction: 'tableNavigateToTags',
               title: 'Go to tags'
           },
           className: 'btn-warning btn-sm text-light focus-ring focus-ring-warning mb-2',
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
           className: 'btn-success btn-sm text-light focus-ring focus-ring-warning mb-2',
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
        const table = $(`table[siteFunction="sitePagesDetailsPageTable"]`).DataTable();
        setTimeout(()=>{ table.draw(); },100);
    }
}
