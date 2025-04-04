// just to be consistent with styles and have rounded (not circle) buttons
// adding 'rounded' class to Algolia docSearch button in site header
removeObservers('body (class=DocSearch DocSearch-Button)');
setElementCreatedByClassObserver('DocSearch DocSearch-Button', () => {
    $('button.DocSearch.DocSearch-Button').addClass('rounded');
});

// removing suggested queries in case of no reults because there are no relevant suggestions
removeObservers('body (class=DocSearch-NoResults)');
setElementCreatedByClassObserver('DocSearch-NoResults', () => {
    console.log('1')
    $('.DocSearch-NoResults-Prefill-List').remove();
});

// removing additional docSearch features when click on clear query button
// since is not wise to try to overwrite the clear query button handler, we use a DOM event to handle this
removeObservers('.DocSearch-Reset receive attribute=hidden');
setElementReceiveAttributeObserver('.DocSearch-Reset', 'hidden', () => {
   algolia.resetSearch();
   algolia.hideSearchHitDetailsContainer();
});

// setup the search hit details box
// we force results to be shown in the custom format defined in setDocSearchBox/refreshResults by force navigating to first page
// we also translate the placehoder of the query input box because is missed in the docSearch.translations object
// we create the search hit details container
removeObservers('body class=DocSearch--active getClass=true');
setElementChangeClassObserver ('body', 'DocSearch--active', true, () => {
    algolia.createSearchHitDetailsContainer();
    algolia.forceNavigationToPage(0);
    $('#docsearch-input').attr('placeholder', i18next.t('algolia_doc_search_modal_placeholder'));
}); 

// setting some events to modify the default behaviour of DocSearch
// search results must be shown in the custom format defined in setDocSearchBox/refreshResults
// and search box dropdown list should navigate to first page of results
// so we overwrite the default behaviour of showing results which is based on the built-in DocSearch autocomplete
$(document).off('input', '.DocSearch-Input').on('input', '.DocSearch-Input', function() {
    algolia.forceNavigationToPage(0);
});

$(document).off('focus', '.DocSearch-Input').on('focus', '.DocSearch-Input', function() {
    algolia.forceNavigationToPage(algolia.currentPage);
});

algolia = {
    appId: algoliaSettings.algoliaAppID,
    apiKey: algoliaSettings.algoliaPublicApiKey,
    indexName: algoliaSettings.algoliaIndex,
    container: algoliaSettings.algoliaSearchBoxContainer,
    debug: algoliaSettings.algoliaDebug,
    maxResultsPerGroup: algoliaSettings.algoliaMaxResultsPerGroup,
    insights: algoliaSettings.algoliaSendInsights,
    raiseIssueLink: algoliaSettings.algoliaRaiseIssueLink,
    hitsPerPage: algoliaSettings.algoliaHitsPerPage,
    currentPage: 0,
    highlightTextPrefixTag: algoliaSettings.algoliaTextHighlightPrefixTag,
    highlightTextPostfixTag: algoliaSettings.algoliaTextHighlightPostfixTag,
    hitItemDetailsBoxGutter: 5,

    resetSearch: () => {
        $('div[siteFunction="showMoreShowLessButtons"]').remove();
        $('.pagination-buttons').remove();
        $('div[siteFunction="docSearchListItemDetails"]').addClass('d-none');
    },

    createSearchHitDetailsContainer: () => {
        const styleListItemDetails = () => {
            const width = $('.DocSearch-Modal').outerWidth();
            const offset = $('.DocSearch-Modal').offset(); 
            const rightDocSearchPosition = offset.left + width - $(window).scrollLeft();
            const left = rightDocSearchPosition + algolia.hitItemDetailsBoxGutter;
            const height = $('.main-header').offset().top + $('.main-header').height();

            $('div[siteFunction="docSearchListItemDetails"]')
                .css(
                    'top', 
                    height + 'px'
                )
                .css(
                    'left', 
                    left + 'px'
                )
                .css(
                    'width', 
                    width + 'px'
                );

            $('div[siteFunction="docSearchListItemDetails"]').draggable({
                containment: "window"
            });
        }

        if($('div[siteFunction="docSearchListItemListAndDetails"]').length === 0 ) {
            const $details = $('<div siteFunction="docSearchListItemDetails" class="docSearchListItemDetails d-none text-dark">Search Hit Details</div>');
            $('.DocSearch-Modal').prepend($details);
            styleListItemDetails();
           
        }
    },

    showSearchHitDetailsContainer: () => {
        const width = $('.DocSearch-Modal').outerWidth();
        const fullwidth = 2 * width + algolia.hitItemDetailsBoxGutter;

        const marginLeft = ($(window).width() - fullwidth)/2;
        $('.DocSearch-Modal').css('margin-left', marginLeft + 'px');

        const offset = $('.DocSearch-Modal').offset(); 
        const rightDocSearchPosition = offset.left + width - $(window).scrollLeft();
        const left = rightDocSearchPosition + algolia.hitItemDetailsBoxGutter;

        const top = $('.main-header').height();

        $('div[siteFunction="docSearchListItemDetails"]')
            .css(
                'top', 
                top + 'px'
            )
            .css(
                'left', 
                left + 'px'
            );

        $('div[siteFunction="docSearchListItemDetails"]').removeClass('d-none');
        $('div[siteFunction="docSearchListItemDetails"]').fadeIn();

    },

    hideSearchHitDetailsContainer: () => {
        $('div[siteFunction="docSearchListItemDetails"]').fadeOut();
        $('div[siteFunction="docSearchListItemDetails"]').addClass('d-none');
        $('.DocSearch-Modal').css('margin-left', '');
    },

    forceNavigationToPage: (page) => {
        $('.DocSearch-Dropdown').css('visibility', 'hidden');
        setTimeout(()=>{       
            $(`button[siteFunction="docSearchPaginationPage_${page}"]`).click();
            $(document).off('keydown').off('keypress');
            $('.DocSearch-Dropdown').css('visibility', 'visible');        
        }, 200);
        
    },

    silentSearchInSite: (query, searchResultsCallback) => {
        const client = algoliasearch(algolia.appId, algolia.apiKey);
        const index = client.initIndex(algolia.indexName);
        index.search(query)
            .then(function(initialSearchResults) {
                const resultsPages = initialSearchResults.nbPages;
                let results = [];

                const logResults = () => {
                    //console.log(results);
                    searchResultsCallback(results);
                };

                const fetchPage = (i) => {
                    return index.search(query, { page: i })
                        .then(function(searchResults) {
                            // Correctly concatenate results, ensuring no overwriting
                            results = results.concat(searchResults.hits);
                        })
                        .catch(function(error) {
                            showToast('Something went wrong with this search!<br><br>You may try again later. If the problem persists, contact support.', 'bg-danger', 'text-light');
                            console.error('Search error:', error);
                        });
                };

                // Create an array of promises for each page
                const fetchPromises = [];
                for (let i = 0; i < resultsPages; i++) {
                    fetchPromises.push(fetchPage(i));
                }

                // Wait for all page fetching promises to complete
                Promise.all(fetchPromises)
                    .then(() => {
                        logResults();  // Ensure logging only after all promises resolve
                    })
                    .catch(function(error) {
                        showToast('Something went wrong with retrieving all search result pages!<br><br>You may try again later. If the problem persists, contact support.', 'bg-danger', 'text-light');
                        console.error('Error in fetching all pages:', error);
                    });
            })
            .catch(function(error) {
                showToast('Something went wrong with the initial search (number of pages)!<br><br>You may try again later. If the problem persists, contact support.', 'bg-danger', 'text-light');
                console.error('Initial search error:', error);
            });


    },

    findMarkedStrings: (obj, parentKey = '', openingTag = '', closingTag = '') => {
        const result = [];
  
        const markPattern = new RegExp(`${openingTag}(.*?)${closingTag}`, 'g'); // 'g' for global match

        const processKey = (key, value) => {
            const currentPath = parentKey ? `${parentKey}.${key}` : key;

            if (typeof value === 'string' && markPattern.test(value)) {
                result.push({ key: currentPath, value: value});
            } else if (typeof value === 'object' && value !== null) {
                result.push(...algolia.findMarkedStrings(value, currentPath, openingTag, closingTag));
            }
        }
        
        if (obj) {

            if (Array.isArray(obj)) {
                obj.forEach((item, index) => {
                    processKey(index, item);
                });
            } else {
                Object.keys(obj).forEach((key) => {
                    processKey(key, obj[key]);
                });
            }
        }

        return result;
    },

    getHitFullPath: (pageTitle, result) => {
        let row = [pageTitle];
        if (result.hierarchy.lvl1) row.push(result.hierarchy.lvl1);
        if (result.hierarchy.lvl2) row.push(result.hierarchy.lvl2);
        if (result.hierarchy.lvl3) row.push(result.hierarchy.lvl3);
        if (result.hierarchy.lvl4) row.push(result.hierarchy.lvl4);
        if (result.hierarchy.lvl5) row.push(result.hierarchy.lvl5);
        if (result.hierarchy.lvl6) row.push(result.hierarchy.lvl6);
        return row.join(' > ');
    },

    getResultItem: (result) => {
        let title;
        if (result.url_without_anchor) title = getPageTitleFromUrl(result.url_without_anchor);
        else if (result.url) title = getPageTitleFromUrl(result.url);

        const secondRow = () => {
            return algolia.getHitFullPath(title, result);
        }

        let marked;
        if (result.url_without_anchor)
            marked = algolia.findMarkedStrings(result._snippetResult, '', algolia.highlightTextPrefixTag, algolia.highlightTextPostfixTag);
        else
            marked = algolia.findMarkedStrings(result._snippetResult, '', algolia.highlightTextPrefixTag, algolia.highlightTextPostfixTag);

        const firstRow = () => {
            return marked.length > 0 ? marked[0].value : null;
        }
        
        return firstRow 
        ? (
            `
                <a href="${result.url}">
                    <div class="DocSearch-Hit-Container">
                        
                        <div class="DocSearch-Hit-icon">
                            <svg width="20" height="20" viewBox="0 0 20 20">
                                <path 
                                    d="M17 5H3h14zm0 5H3h14zm0 5H3h14z" 
                                    stroke="currentColor" 
                                    fill="none" 
                                    fill-rule="evenodd" 
                                    stroke-linejoin="round">
                                </path>
                            </svg>
                        </div>
                        
                        <div class="DocSearch-Hit-content-wrapper">
                            <span class="DocSearch-Hit-title">
                                ${firstRow()}
                            </span>
                            <span class="DocSearch-Hit-path">
                                ${secondRow()}
                            </span>
                        </div>

                        <div class="DocSearch-Hit-action">
                            <svg 
                                class="DocSearch-Hit-Select-Icon" 
                                width="20" height="20" 
                                viewBox="0 0 20 20">
                                <g 
                                    stroke="currentColor" 
                                    fill="none" 
                                    fill-rule="evenodd" 
                                    stroke-linecap="round" 
                                    stroke-linejoin="round">
                                    <path d="M18 3v4c0 2-2 4-4 4H2"></path>
                                    <path d="M8 17l-6-6 6-6"></path>
                                </g>
                            </svg>
                        </div>

                    </div>
                </a>
            `
        )
        : null;
    },

    // setting DocSearch with pagination
    setDocSearchBox: async () => {
        await waitForI18Next();
        // Hide JTD search box
        $('.search').addClass('d-none');
        
        // Set Algolia DocSearch box
        docsearch({
            appId: algolia.appId,
            apiKey: algolia.apiKey,
            indexName: algolia.indexName,
            container: algolia.container,
            debug: algolia.debug,
            maxResultsPerGroup: algolia.maxResultsPerGroup,
            insights: algolia.insights,

            // HEADS UP!!!
            // see the comments in _plugins/generators/algolia-integration-gen.rb about how to handle url's
            // that are not pointing to GitHub repo issues
            raiseIssueLink: algolia.algoliaRaiseIssueLink,
            translations: {
                button: {
                    buttonText: i18next.t('algolia_doc_search_btn_text'),
                    buttonArriaLabel: i18next.t('algolia_doc_search_btn_aria_label')
                },
                modal: {
                    searchBox: {
                        resetButtonTitle: i18next.t('algolia_doc_search_modal_reset_btn_title'),
                        cancelButtonText: i18next.t('algolia_doc_search_modal_cancel_btn_text'),
                    },
                    startScreen: {
                        recentSearchesTitle: i18next.t('algolia_doc_search_modal_recent_searches_title'),

                        // HEADS UP!!!
                        // algolia_doc_search_modal_no_recent_searches_text should be set to empty string
                        // if personalization is not available for the docSearch instance
                        // see Algolia dashboard/Search section/Index/Configuration/Personalization  
                        noRecentSearchesText: i18next.t('algolia_doc_search_modal_no_recent_searches_text'),

                        // the following are not relevant of personalization is not available (see previous comment)
                        saveRecentSearchButtonTitle: i18next.t('algolia_doc_search_modal_save_this_search_title'),
                        removeRecentSearchButtonTitle: i18next.t('algolia_doc_search_modal_remove_this_search_title'),
                        favoriteSearchesTitle: i18next.t('algolia_doc_search_modal_fav_search_title'),
                        removeFavoriteSearchButtonTitle: i18next.t('algolia_doc_search_modal_remove_from_fav_search_title')
                    },
                    noResultsScreen: {  
                        noResultsText: i18next.t('algolia_doc_search_modal_no_results_text'),
                        suggestedQueryText: i18next.t('algolia_doc_search_modal_try_another_query_text'),
                        reportMissingResultsText: i18next.t('algolia_doc_search_modal_believe_should_have_results_text'),
                        reportMissingResultsLinkText: i18next.t('algolia_doc_search_modal_raise_issue_text')
                       
                      },
                    footer: {
                        selectText: i18next.t('algolia_doc_search_modal_footer_select_text'),
                        navigateText: i18next.t('algolia_doc_search_modal_footer_navigate_text'),
                        closeText: i18next.t('algolia_doc_search_modal_footer_close_text'),
                        searchByText: i18next.t('algolia_doc_search_modal_footer_search_by_text')
                    },
                    errorScreen: {
                        titleText: i18next.t('algolia_doc_search_modal_error_no_results_text'),
                        helpText: i18next.t('algolia_doc_search_modal_error_no_net_text')
                    }
                }
            },

            // we use this DocSearch built-in callback to overwrite the default behaviour of the instant search
            // in order to display the search hits in the same format as defined in algolia/getResultItem function
            // otherwise the format will be different and the feature of search hit details box will not work if already open
            // also removing the hit source which is always set to "Documentation", thus is not relevant
            // cannot use the normal behaviour of hitComponent since cannot return a proper JSX.Element in a regular (nonReact) app
            hitComponent: ({ hit, children }) => {
                algolia.setEvents();
                resultItemContent = algolia.getResultItem(hit);
            
                // Create a new list item with the hit data
                const resultItem = $('<li>')
                    .addClass('DocSearch-Hit')
                    .attr('id', `docsearch-item`)
                    .attr('aria-selected', "false")
                    .attr('role', 'option')
                    .html(resultItemContent)
                    .data('result', hit);
            
                const targetItem = $('#docsearch-list li').filter(function() {
                    return _.isEqual($(this).data('result'), resultItem.data('result'));
                });
            
                if (targetItem.length) {
                    const originalHeight = targetItem.outerHeight();                
                    resultItem.css('height', originalHeight);
                    targetItem.css('height', originalHeight);
                    targetItem.replaceWith(resultItem);
                    resultItem.css('height', '');
                }

                $('#docsearch-list li').filter(function() {
                    return $.trim($(this).html()) === '';
                }).remove();

                $('.DocSearch-Hit-source').remove();
                
                // HEADS UP!!!
                // HERE WE SHOULD RETURN A VALID JSX.Element OBJECT WHICH WE CANNOT PROPERLY CREATE HERE
                // SO WE NOT RETURNING ANYTHING HERE
                // THE SEARCH HITS WERE ADDED BEFORE THROUGH DOM MANIPULATION
            },
      
            // Create pagination and handle results
            // we use this docSearch built-in callback to create other elements: pagination btns, show more/less btns
            resultsFooterComponent({ state }) {
                if (state.query && state.query.length > 1 ) {
                    const maxHitsPerPage = algolia.hitsPerPage;
                    const totalPages = Math.ceil(state.context.nbHits / maxHitsPerPage);
                    let footerMessage = '';
                    
                    if (totalPages > 1 ) {
                        footerMessage = `${state.context.nbHits} hits found across ${totalPages} pages of results. You may refine your query to get more specific results.`;
                    } else {
                        footerMessage = `${state.context.nbHits} hit(s) found. All results are displayed.`;
                    }

                    createShowMoreShowLess(state);
                    createPagination(totalPages, state.query);
                    
                    return {
                        type: 'div',
                        ref: undefined,
                        constructor: undefined,
                        key: state.query,
                        props: {
                            class: 'w-100 text-dark fw-medium',
                            children: footerMessage
                        },
                        __v: null,
                    };
                } else {
                    removePagination();
                    removeShowMoreShowLess();
                    $('div[siteFunction="docSearchListItemDetails"]').addClass('d-none');
                }
            },
    
            // Handle missing results
            // we use this docSearch build-in callback to remove some extra features
            // in case of no results
            getMissingResultsUrl({ query }) {
                removeShowMoreShowLess();
                removePagination();
                $('div[siteFunction="docSearchListItemDetails"]').addClass('d-none');
                return `${algolia.raiseIssueLink}${query}`;
            },

            searchParameters: {
                // HEADS UP!!! NEEDS TO BE INCLUDED IN index.search(....) TOO, SEE BELOW, FUNCTION refreshResults
                hitsPerPage: algolia.hitsPerPage, 
            },


        });

        // create Show More and Show Less btns
        const createShowMoreShowLess = (state=null) => {
            if (preFlight.envInfo.device.deviceType !== 'desktop') return;
            $('div[siteFunction="showMoreShowLessButtons"]').remove();
            
            const showMoreShowLessContainer = $('<div siteFunction="showMoreShowLessButtons">').addClass('showMoreShowLessButtons d-flex justify-content-center align-items-center');

            const buttonShowMore = $('<button>')
                .attr('siteFunction',`docSearchPaginationShowMore`)
                .addClass('btn btn-sm btn-success text-light mx-1 rounded-circle')
                .css('height', 'fit-content')
                .html('<i class="bi bi-chevron-bar-expand"></i>')
                .click(function() {
                    $(`button[siteFunction="docSearchPaginationPage_${algolia.currentPage}"]`).click();
                    algolia.showSearchHitDetailsContainer();
                });

            const buttonShowLess = $('<button>')
                .attr('siteFunction',`docSearchPaginationShowMore`)
                .addClass('btn btn-sm btn-danger text-light mx-1 rounded-circle')
                .css('height', 'fit-content')
                .html('<i class="bi bi-chevron-bar-contract"></i>')
                .click(function() {
                   algolia.hideSearchHitDetailsContainer();
                });

            showMoreShowLessContainer
                .append(buttonShowMore)
                .append(buttonShowLess);
            $('.DocSearch-SearchBar').addClass('d-flex').append(showMoreShowLessContainer);
                
        };

        // remove Show More and Show Less btns
        const removeShowMoreShowLess = () => {
            $('div[siteFunction="showMoreShowLessButtons"]').remove();
        };

        // Create pagination buttons
        // HERE WE SEAT ALSO THE FUNCTIONS OF THE PAGINATION BUTTONS
        const createPagination = (totalPages, query) => {
            removePagination(); // Clear existing pagination
            const paginationContainer = $('<div>').addClass('pagination-buttons d-flex justify-content-start mt-2 p-2');
            
            for (let i = 0; i < totalPages; i++) {
                const button = $('<button>')
                    .attr('siteFunction',`docSearchPaginationPage_${i}`)
                    .addClass('docSearchPaginationPage btn btn-sm btn-outline-secondary border border-secondary border-opacity-25 mx-1 text-dark')
                    .css('width', '2rem')
                    .text(i + 1)
                    .data('page', i)
                    .click(function() {
                        // when using custom pagination, default DocSearch key and mouse events must be re-created
                        algolia.setEvents();                             
                        const page = $(this).data('page');
                        refreshResults(query, page); // Use current query and selected page
                        algolia.currentPage = page;
                        $('.docSearchPaginationPage').addClass('bg-transparent').removeClass('bg-warning');
                        $(`button[siteFunction="docSearchPaginationPage_${i}"]`).removeClass('bg-transparent').addClass('bg-warning');

                    });

                paginationContainer.append(button);
            }

            //$('#docsearch-list').after(paginationContainer); // Insert pagination after results  
            $('.DocSearch-SearchBar').after(paginationContainer);
        };
    
        // Remove pagination buttons
        const removePagination = () => {
            $('.pagination-buttons').remove();
        };
        
        // HERE WE ACTUALLY DO THE SEARCH
        // Function to refresh the DocSearch results on pagination click
        const refreshResults = (query, page) => {
            
            const client = algoliasearch(algolia.appId, algolia.apiKey);

            const index = client.initIndex(algolia.indexName);
    
            index.search(query, { page: page,  hitsPerPage: algolia.hitsPerPage })
                .then(function(searchResults) {    
                    // Clear existing results and append new ones
                    $('#docsearch-list').empty();
                    
                    let resIndex = 0;

                    // HEADS UP!!!
                    // the li attribute used for active list item is aria-selected 
                    // (stands for Accessible Rich Internet Applications), not area-selected
                    searchResults.hits.forEach(result => {
                        resultItemContent = algolia.getResultItem(result, resIndex);

                        if (resultItemContent) {
                            const resultItem = $('<li>')
                                .addClass('DocSearch-Hit')
                                .attr('id', `docsearch-item-${resIndex}`)
                                .attr('aria-selected', "false")
                                .attr('role', 'option')
                                .html(resultItemContent)
                                .data('result', result);
                            $('#docsearch-list').append(resultItem);
                        }
                        resIndex += 1;
                    });

                    $newActiveItem = $('.DocSearch-Hit').first();
                    $newActiveItem.attr('aria-selected', 'true');
                    const $container = $('.DocSearch-Dropdown');
                    algolia.scrollToView($newActiveItem, $container);
                    algolia.updateHitMoreInfo($newActiveItem);

                    // now is the moment to set the height of the search hit details box
                    const h = $('.DocSearch-Modal').height();
                    $('div[siteFunction="docSearchListItemDetails"]').css('height', h + 'px');      
                })
                .catch(function(error) {
                    console.error('Error while fetching paginated results:', error);
                    showToast('Error while fetching paginated results! Please try again.', 'bg-danger', 'text-light');
                });
        };
    },

    setEvents: () => {
        algolia.setMouseHitEvents();
        algolia.setKeyboardHitEvents();
    },

    setKeyboardHitEvents: () => {
        $(document).off('keydown').on('keydown', algolia.keyboardEventsHandler);
    },

    unsetKeyboardHitEvents: () => {
        $(document).off('keydown');
    },

    updateHitMoreInfo: ($newActiveItem) => {     
        const nothingSelected = 
            `
                <div>
                    <kbd class="DocSearch-Commands-Key">
                        <svg width="15" height="15" aria-label="Arrow down" role="img">
                            <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.2">
                                <path d="M7.5 3.5v8M10.5 8.5l-3 3-3-3"></path>
                            </g>
                        </svg>
                    </kbd>
                    <kbd class="DocSearch-Commands-Key">
                        <svg width="15" height="15" aria-label="Arrow up" role="img">
                            <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.2">
                                <path d="M7.5 11.5v-8M10.5 6.5l-3-3-3 3"></path>
                            </g>
                        </svg>
                    </kbd>
                    <span class="DocSearch-Label">to navigate</span>
                </div>
                
            `;
        
        const getSearchHit = (hit) => {

            const backgroud = $('.DocSearch-Modal').css('background');

            const searchHitContainer = (searchHitArray) => {

                const searchHitItem = (hit) => {
                    return (
                        `   <tr>
                                <td class="docSearchFontStd border-0 align-self-center align-middle text-primary bg-light">${hit.key.replace(/\.value/g, "").trim()}</td>
                                <td class="docSearchFontStd border-0 align-self-center align-middle bg-light text-dark">${hit.value.replace(/^…/, '').replace(/…$/, '').trim()}</td>
                            </tr>
                        `
                    );
                }
    
                const searchHitItems = (searchHitArray) => {
                    let html = ''
                    searchHitArray.forEach(hit => {
                        html += searchHitItem(hit);
                    });
                    return html;
                }
    
                const container = 
                    `
                        <table class="table table-hover table-striped mb-0">
                            <thead>
                                <tr>
                                    <th data-i18n="algolia_doc_search_custom_panel_found_in_text" scope="col" class="docSearchFontStd border-bottom border-secondary border-opacity-25 text-light bg-secondary bg-gradient fw-normal">Found in</th>
                                    <th data-i18n="algolia_doc_search_custom_panel_hit_text" scope="col" class="docSearchFontStd border-bottom border-secondary border-opacity-25 text-light bg-secondary bg-gradient fw-normal">Hit</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${searchHitItems(searchHitArray)}
                            </tbody>
                        </table>
                    `
                return container;
            }

            let searchHit, $searchHit;
            searchHit = algolia.findMarkedStrings(
                hit._snippetResult, 
                '', 
                algolia.highlightTextPrefixTag, 
                algolia.highlightTextPostfixTag
            );
            
            if (searchHit.length === 0)
                searchHit = algolia.findMarkedStrings(
                    hit._highlightResult, 
                    '', 
                    algolia.highlightTextPrefixTag, 
                    algolia.highlightTextPostfixTag
                );
            
            //console.log(searchHit)
            
            if (searchHit.length > 0) $searchHit = searchHitContainer(searchHit);
            else $searchHit = nothingSelected;

            return $($searchHit);
        }

        const getPageTitle = (hit) => {
            const container = (hit) => {
                return (
                    `
                        <div class="fs-5 fw-medium">${hit.pageTitle}</div>
                    `
                );
            }

            return $(container(hit));
        }

        const getHitFullPath = (hit) => {
            const container = (hit) => {
                return (
                    `
                        <div class="docSearchFontSmall fw-normal text-secondary">${algolia.getHitFullPath(hit.pageTitle, hit)}</div>
                    `
                );
            }

            return $(container(hit));
        }

        const getHitPageInfoBtn = (hit) => {
            const container = (hit) => {
                let permalink = hit.pagePermalink;
                if (permalink.charAt(0) !== '/') permalink = '/' + permalink;
                return (
                    `
                        <a href="${permalink}"
                            target=_blank 
                            class="btn btn-sm btn-primary"
                            style="height: fit-content"
                            data-i18n="algolia_doc_search_custom_panel_header_read_btn_text">
                            Read 
                            <i class="ml-2 bi bi-box-arrow-up-right"></i>
                        </a>
                    `
                );
            }

            const $btnContainer = $(container(hit));
            return $btnContainer;
        }

        const getPageSummary = (hit, page) => {
            if (page.siteInfo === 'none') return;
            const autoSummary = page.siteInfo.autoSummary || '';
            if (autoSummary === '') return;

            return $(
                `
                    <div class="fw-semibold text-primary">
                        <button class="d-flex align-items-center btn btn-sm btn-outline-secondary border border-secondary border-opacity-25 shadow-none fw-medium mb-3" data-i18n="algolia_doc_search_custom_panel_summary_text">
                            Summary
                        </button>
                    </div>
                    <div class="text-dark fw-medium docSearchFontStd">${autoSummary}</div>
                `
            );
        }

        const getPageExcerpt = (hit, page) => {
            if (page.siteInfo === 'none') return;
            const excerpt = page.siteInfo.excerpt || '';
            if (excerpt === '') return;

            return $(
                `
                    <div class="fw-semibold text-primary">
                        <button class="d-flex align-items-center btn btn-sm btn-outline-secondary border border-secondary border-opacity-25 shadow-none fw-medium mb-3" data-i18n="algolia_doc_search_custom_panel_excerpt_text">
                            Excerpt
                        </button>
                    </div>
                    <div class="text-dark fw-medium docSearchFontStd">${excerpt}</div>
                `
            );
        }

        const getPageToc = async (hit) => {
            let url = hit.pagePermalink;
            let title = hit.pageTitle;
            if (url.charAt(0) !== '/') url = '/' + url;

            const getMargin = (tag) => {
                const level = parseInt(tag.match(/\d+/)[0]);
                return level >= 2 ? `style="margin-left: ${5 * (level - 1)}px"` : '';
            };

            const markOutput = (output) => {
                const hitAnchor = hit.anchor.toLowerCase();
                const $output = $(output);
            
                $output.find('li[siteFunction="docSearch_searchHitDetails_hitPage_Toc_Item_Text"]').each(function() {
                    if ($(this).attr('anchorRef') === hitAnchor) {
                        $(this).contents().filter(function() {
                            return this.nodeType === 3; // Only target text nodes
                        }).each(function() {
                            const text = $(this).text().trim();
                            if (text.length > 0) {
                                const markedText = $(`${algolia.highlightTextPrefixTag}${text}${algolia.highlightTextPostfixTag}`);
                                $(this).replaceWith(markedText);
                            }
                        });
                        return false; // Break the loop once the condition is met
                    }
                });
            
                return $output;
            };
            
            const dynamicContent = hit.pageHasDynamicContent
                ? `${title} \u2192 ${i18next.t('algolia_doc_search_custom_panel_heads_up_has_dynamic_content_text')}` 
                : `${title} \u2192 ${i18next.t('algolia_doc_search_custom_panel_heads_up_not_has_dynamic_content_text')}`;

            const popoverText = 
                `
                    ${i18next.t('algolia_doc_search_custom_panel_heads_up_warning_text')} ${dynamicContent}
                `

            const popoverTitle = 
                `
                    <span class='text-dark'>${i18next.t('algolia_doc_search_custom_panel_heads_up_text')}</span>
                `
            // we need to fetch the hit target page and extract headings
            // cannot use #toc_content of the hit target page because is dynamically generated
            // so the toc we generate here may be smaller than the actual toc of the hit target page
            //however, dynamic client-side content is not searchable either (not by JTD search or Algolia)
            const fetchToc = async (url) => {
                try {                    
                    const response = await $.get(url);
                    const html = $(response);
                    const content = html.find('main');
                    const headings = content.find('h1, h2, h3, h4, h5, h6');

                    const dynamicContentIndicator = hit.pageHasDynamicContent
                        ? '<span class="spinner-grow spinner-grow-sm ml-2 text-danger" aria-hidden="true"></span>'
                        : '';

                    let output = `
                        <div siteFunction="docSearch_searchHitDetails_hitPage_Toc">
                            <button
                                siteFunction="docSearch_HitDetails_pageToc_ContentsBtn" 
                                class="d-flex align-items-center btn btn-sm btn-outline-secondary border border-secondary border-opacity-25 shadow-none fw-medium mb-3" 
                                tabindex="0" 
                                data-bs-toggle="popover" 
                                data-bs-placement="right"
                                data-bs-custom-class="custom-popover"
                                data-bs-title="${popoverTitle}"
                                data-bs-trigger="hover focus"
                                data-bs-content="${popoverText}">
                                <span data-i18n="algolia_doc_search_custom_panel_contents_text">Contents</span> ${dynamicContentIndicator}
                            </button>
                            <ul 
                                class="pl-0 list-unstyled"
                                siteFunction="docSearch_searchHitDetails_hitPage_Toc_List"
                                style="width: fit-content">
                        `;

                    if (headings.length === 0) output = '';
                    else {
                        headings.each(function () {
                            output += 
                                `
                                    <a 
                                        href="${url}#${$(this).attr('id')}"
                                        target="_blank"
                                        anchorRef="${$(this).attr('id')}"
                                        siteFunction="docSearch_searchHitDetails_hitPage_Toc_Item">
                                        <li 
                                            siteFunction="docSearch_searchHitDetails_hitPage_Toc_Item_Text"
                                            class="docSearchFontStd text-dark fw-medium" ${getMargin($(this).prop("tagName"))}
                                            anchorRef="${$(this).attr('id')}">
                                            ${$(this).text()}
                                        </li>
                                    </a>
                                `;
                        });
                        output += '</div></ul>';
                    }

                    // Caching the hit target TOC to avoid redundant requests
                    docSearchHitPageToc.push({ permalink: url, toc: output });
        
                    return markOutput(output);
                } catch (error) {
                    throw console.error ('Error fetching the page', error);
                }
            };
        
            const outputObj = getObjectFromArray({ permalink: url }, docSearchHitPageToc);
            if (outputObj !== 'none') {
                return markOutput(outputObj.toc);
            } else {
                return await fetchToc(url);
            }
        };

        const getPageTags = (hit, page) => {

            const tagItem = (tag, type) => {
                tag = tag.replace(/["'.,/#!$%^&*;:{}=\-_`~()]/g, ' ');
                tag = tag.replace(/[^a-zA-Z0-9]/g, ' ');
                tag = DOMPurify.sanitize(tag);
                let tagItemColorClass = 'btn-primary';
                let numPages = 0;
                if (type !== 'siteTag') {
                    tagItemColorClass = 'btn-success';
                    numPages = getTagPages(tag);
                } else {
                    numPages = tagDetails[tag].numPages;
                }
                return (
                    `
                        <div siteFunction="docSearch_searchHitDetails_tags_tagBtn_container" class="d-inline-flex align-items-center">
                            <a 
                                href="/tag-info?tag=${tag}"
                                target=_blank
                                sitefunction="docSearch_searchHitDetails_tags_tagBtn" 
                                type="button" 
                                class="focus-ring focus-ring-warning mt-3 mr-1 btn btn-sm ${tagItemColorClass} position-relative">
                                ${tag}
                            </a> 
                            <span 
                                sitefunction="docSearch_searchHitDetails_tags_badge" 
                                class="position-relative translate-middle badge rounded-pill text-bg-warning"
                                style="left: -5px; top: 5px"> 
                                ${numPages} 
                                <span class="visually-hidden" >number of pages</span>
                            </span>
                        </div>
                    `
                );
            }

            if (page.siteInfo === 'none') return $('');
            //console.log(page)
            const siteTags = page.siteInfo.tags || [];

            let customTags = [];
            if (page.savedInfo !== 'none') customTags = page.savedInfo.customTags || [];

            let tagsHtml = ''
            siteTags.forEach(tag => {
                tagsHtml += tagItem(tag, 'siteTag');
            });

            customTags.forEach(tag => {
                tagsHtml += tagItem(tag, 'customTag');
            });

            return $(tagsHtml) ? $(tagsHtml) : '';
        }

        const getPageCats = (hit, page) => {

            const catItem = (cat, type) => {
                cat = cat.replace(/["'.,/#!$%^&*;:{}=\-_`~()]/g, ' ');
                cat = cat.replace(/[^a-zA-Z0-9]/g, ' ');
                cat = DOMPurify.sanitize(cat);
                let catItemColorClass = 'text-danger';
                let numPages = 0;
                if (type !== 'siteCat') {
                    catItemColorClass = 'text-success';
                    numPages = getCatPages(cat);
                } else {
                    numPages = catDetails[cat].numPages;
                }
                return (
                    `
                        <div siteFunction="docSearch_searchHitDetails_cats_catsBtn_container" class="mr-3 d-inline-flex align-items-center">
                            <a 
                                href="/cat-info?cat=${cat}"
                                target=_blank
                                sitefunction="docSearch_searchHitDetails_cats_catBtn" 
                                type="button" 
                                class="fw-medium btn btn-sm border-0 shadow-none px-0 my-1 mr-1 ${catItemColorClass}">
                                ${cat}
                            </a> 
                            <span 
                                sitefunction="docSearch_searchHitDetails_cats_badge" 
                                class="fw-normal border px-2 rounded bg-warning-subtle text-dark"> 
                                ${numPages} 
                                <span class="visually-hidden" >number of pages</span>
                            </span>
                        </div>
                    `
                );
            }

            if (page.siteInfo === 'none') return $('');
            //console.log(page)
            const siteCats = page.siteInfo.categories || [];

            let customCats = [];
            if (page.savedInfo !== 'none') customCats = page.savedInfo.customCategories || [];

            let catsHtml = ''
            siteCats.forEach(cat => {
                catsHtml += catItem(cat, 'siteCat');
            });

            customCats.forEach(cat => {
                catsHtml += catItem(cat, 'customCat');
            });

            return $(catsHtml);
        }
        
        const skeleton = (page) => {
            const pageDetailsClass = page.siteInfo === 'none' ? 'class="d-none"' : '';
            return $(
                `
                    <div 
                        siteFunction="docSearch_searchHitDetails_header_container"
                        class="card p-3 border-0 shadow-sm mb-2 rounded-0">
                        
                        <div 
                            siteFunction="docSearch_searchHitDetails_header"
                            class="d-flex align-items-top justify-content-between">
                            <div siteFunction="docSearch_searchHitDetails_header_title" class="col-8"></div>
                        </div>

                        <div 
                            siteFunction="docSearch_searchHitDetails_header_nav"
                            class="mt-2">
                        </div>

                        <div id="docSearch_searchHitDetails_preview"></div>

                    </div>

                    <div class="p-3">

                        <div siteFunction="docSearch_HitDetails_searchHit" class="mb-2 card p-3 border-0 shadow-sm"></div>

                        <div ${pageDetailsClass}>

                            <div siteFunction="docSearch_HitDetails_pageSummary" class="mb-2 card p-3 border-0 shadow-sm"></div>

                            <div siteFunction="docSearch_HitDetails_pageExcerpt" class="mb-2 card p-3 border-0 shadow-sm"></div>

                            <div siteFunction="docSearch_HitDetails_pageToc" class="d-none mb-2 card p-3 border-0 shadow-sm"></div>

                            <div siteFunction="docSearch_HitDetails_pageTags" class="d-none mb-2 card p-3 border-0 shadow-sm">
                                <div siteFunction="docSearch_HitDetails_pageTags_title" class="text-primary fw-medium">
                                    <button class="d-flex align-items-center btn btn-sm btn-outline-secondary border border-secondary border-opacity-25 shadow-none fw-medium" data-i18n="algolia_doc_search_custom_panel_tags_text">
                                        Tags
                                     </button>
                                </div>
                                <div siteFunction="docSearch_HitDetails_pageTags_tag_btns"></div>
                            </div>

                            <div siteFunction="docSearch_HitDetails_pageCats" class="d-none mb-2 card p-3 border-0 shadow-sm">
                                <div siteFunction="docSearch_HitDetails_pageCats_title" class="text-primary fw-medium">
                                    <button class="d-flex align-items-center btn btn-sm btn-outline-secondary border border-secondary border-opacity-25 shadow-none fw-medium" data-i18n="algolia_doc_search_custom_panel_cats_text">
                                        Categories
                                     </button>
                                </div>
                                <div siteFunction="docSearch_HitDetails_pageTags_cat_btns"></div>
                            </div>

                        </div>
                    </div>
                `
            );
        }

        const hit = $newActiveItem.data('result');

        if (hit) {

            hitPageInfo = {
                siteInfo: getObjectFromArray ({permalink: hit.pagePermalink, title: hit.pageTitle}, pageList),
                savedInfo: getPageSavedInfo (hit.pagePermalink, hit.pageTitle),
            };

            const $navBtn = (navTarget, btnText) => {

                $btn = $(
                    `
                        <button class="m-1 btn btn-sm btn-outline-secondary border border-secondary border-opacity-25 shadow-none">
                            ${btnText}
                        </button>
                    `
                )
                .off('click')
                .click(function() {
                    const scrollContainer = $('div[siteFunction="docSearchListItemDetails"]');
                    const headerContainer = $('div[siteFunction="docSearch_searchHitDetails_header_container"]');
                    const headerBottom = headerContainer.offset().top + headerContainer.outerHeight();
                    const targetScrollTop = $(navTarget).offset().top - headerBottom - 20;
            
                    scrollContainer.stop(true, true).animate({ scrollTop: targetScrollTop }, 100);
                });
            
                return $btn;
            };

            //console.log(hitPageInfo)

            //console.log(hit)
            $('div[siteFunction="docSearchListItemDetails"]').empty();
            $('div[siteFunction="docSearchListItemDetails"]').append(skeleton(hitPageInfo));

            $('div[siteFunction="docSearch_searchHitDetails_header_title"]').append(getPageTitle(hit));
            $('div[siteFunction="docSearch_searchHitDetails_header_title"]').append(getHitFullPath(hit));
            $('div[siteFunction="docSearch_searchHitDetails_header"]').append(getHitPageInfoBtn(hit));
            $('a[data-i18n="algolia_doc_search_custom_panel_header_read_btn_text"]')
                .text(`${i18next.t('algolia_doc_search_custom_panel_header_read_btn_text')}`)
                .append('<i class="ml-2 bi bi-box-arrow-up-right"></i>');

            // found in ... table
            $('div[siteFunction="docSearch_HitDetails_searchHit"]').append(getSearchHit(hit));
            $('div[siteFunction="docSearch_searchHitDetails_header_nav"]')
                .append($navBtn(
                    'div[siteFunction="docSearch_HitDetails_searchHit"]',
                    i18next.t('algolia_doc_search_custom_panel_found_in_text') 
                ));
            $('th[data-i18n="algolia_doc_search_custom_panel_found_in_text"]')
                .text(i18next.t('algolia_doc_search_custom_panel_found_in_text'));
            $('th[data-i18n="algolia_doc_search_custom_panel_hit_text"]')
                .text(i18next.t('algolia_doc_search_custom_panel_hit_text'));

            // hit target page summary and excerpt
            $('div[siteFunction="docSearch_HitDetails_pageSummary"]').append(getPageSummary(hit, hitPageInfo));
            if (hitPageInfo.siteInfo !== 'none')
                $('div[siteFunction="docSearch_searchHitDetails_header_nav"]')
                    .append($navBtn(
                        'div[siteFunction="docSearch_HitDetails_pageSummary"]', 
                        i18next.t('algolia_doc_search_custom_panel_summary_text')
                    ));
                $('button[data-i18n="algolia_doc_search_custom_panel_summary_text"]')
                    .text(i18next.t('algolia_doc_search_custom_panel_summary_text'));

            $('div[siteFunction="docSearch_HitDetails_pageExcerpt"]').append(getPageExcerpt(hit, hitPageInfo));
            if (hitPageInfo.siteInfo !== 'none')
                $('div[siteFunction="docSearch_searchHitDetails_header_nav"]')
                    .append($navBtn(
                        'div[siteFunction="docSearch_HitDetails_pageExcerpt"]', 
                        i18next.t('algolia_doc_search_custom_panel_excerpt_text')
                    ));
                $('button[data-i18n="algolia_doc_search_custom_panel_excerpt_text"]')
                    .text(i18next.t('algolia_doc_search_custom_panel_excerpt_text'));

            // hit target page toc
            getPageToc(hit).then(toc  => {
                $('div[siteFunction="docSearch_HitDetails_pageToc"]').empty();
                if (toc.html() === undefined) $('div[siteFunction="docSearch_HitDetails_pageToc"]').addClass('d-none');
                else {

                    $('div[siteFunction="docSearch_HitDetails_pageToc"]').removeClass('d-none');
                    $('div[siteFunction="docSearch_HitDetails_pageToc"]').append(toc);

                    $('div[siteFunction="docSearch_searchHitDetails_header_nav"]')
                        .append($navBtn(
                            'div[siteFunction="docSearch_HitDetails_pageToc"]', 
                            i18next.t('algolia_doc_search_custom_panel_contents_text')
                        ));
                    $('span[data-i18n="algolia_doc_search_custom_panel_contents_text"]')
                            .text(i18next.t('algolia_doc_search_custom_panel_contents_text'));

                    contentBtnPopover = new bootstrap.Popover('[data-bs-toggle="popover"]', {html:true, sanitize: true})

                    $(document)
                        .off('mouseenter', 'button[siteFunction="docSearch_HitDetails_pageToc_ContentsBtn"]')
                        .on('mouseenter', 'button[siteFunction="docSearch_HitDetails_pageToc_ContentsBtn"]', function() {
                            contentBtnPopover.show();
                        })
                        .off('mouseleave', 'button[siteFunction="docSearch_HitDetails_pageToc_ContentsBtn"]')
                        .on('mouseleave', 'button[siteFunction="docSearch_HitDetails_pageToc_ContentsBtn"]', function() {
                            contentBtnPopover.hide()
                        })
                }
            });

            // hit target page tags
            tags = getPageTags(hit, hitPageInfo);
            if (tags.html() === undefined) $('div[siteFunction="docSearch_HitDetails_pageTags"]').addClass('d-none');
            else {
                $('div[siteFunction="docSearch_HitDetails_pageTags"]').removeClass('d-none');
                $('div[siteFunction="docSearch_HitDetails_pageTags_tag_btns"]').append(tags);
                $('div[siteFunction="docSearch_searchHitDetails_header_nav"]')
                    .append($navBtn(
                        'div[siteFunction="docSearch_HitDetails_pageTags"]', 
                        i18next.t('algolia_doc_search_custom_panel_tags_text')
                    ));
                $('button[data-i18n="algolia_doc_search_custom_panel_tags_text"]')
                    .text(i18next.t('algolia_doc_search_custom_panel_tags_text'));
            }

            // hit target page cats
            cats = getPageCats(hit, hitPageInfo);
            if (cats.html() === undefined) $('div[siteFunction="docSearch_HitDetails_pageCats"]').addClass('d-none');
            else {
                $('div[siteFunction="docSearch_HitDetails_pageCats"]').removeClass('d-none');
                $('div[siteFunction="docSearch_HitDetails_pageTags_cat_btns"]').append(cats);
                $('div[siteFunction="docSearch_searchHitDetails_header_nav"]')
                    .append($navBtn(
                        'div[siteFunction="docSearch_HitDetails_pageCats"]', 
                        i18next.t('algolia_doc_search_custom_panel_cats_text')
                    ));
                $('button[data-i18n="algolia_doc_search_custom_panel_cats_text"]')
                    .text(i18next.t('algolia_doc_search_custom_panel_cats_text'));
            }
        }
        else $('div[siteFunction="docSearchListItemDetails"]').empty();
    },

    handleKey: (event) => {

        // just to be on the safe side, we remove the empty search hits items
        // when navigating in the initial search hits list generated by instant search,
        // sometimes an empty element is created because of the way we use hitComponent callback
        // which manipulates the DOM and do not return a JSX.Element (same as returning an empty one)
        $('#docsearch-list li').filter(function() {
            return $.trim($(this).html()) === '';
        }).remove();

        let $activeItem = $('.DocSearch-Hit[aria-selected="true"]');
        let $newActiveItem;
        const $container = $('.DocSearch-Dropdown');
    
        // Deselect all items before processing the key event
        $('.DocSearch-Hit').attr('aria-selected', 'false');
    
        if (event.key === 'ArrowDown') {
            // Move to the next item
            if ($activeItem.length) {
                $newActiveItem = $activeItem.next('.DocSearch-Hit');
                if ($newActiveItem.length) {
                    // Normal case: Move to the next item
                    $activeItem.attr('aria-selected', 'false');
                    $newActiveItem.attr('aria-selected', 'true');
                    algolia.scrollToView($newActiveItem, $container);

                    algolia.updateHitMoreInfo($newActiveItem);
    
                } else if ($activeItem.is(':last-child')) {
                    // If the current item is the last one, wrap around to the first item
                    $newActiveItem = $('.DocSearch-Hit').first();
                    $activeItem.attr('aria-selected', 'false');
                    $newActiveItem.attr('aria-selected', 'true');
                    algolia.scrollToView($newActiveItem, $container);

                    algolia.updateHitMoreInfo($newActiveItem);
    
                }
            } else {
                // No active item, activate the first one
                $newActiveItem = $('.DocSearch-Hit').first();
                $newActiveItem.attr('aria-selected', 'true');
                algolia.scrollToView($newActiveItem, $container);

                algolia.updateHitMoreInfo($newActiveItem);

            }
        } else if (event.key === 'ArrowUp') {
            // Move to the previous item
            if ($activeItem.length) {
                $newActiveItem = $activeItem.prev('.DocSearch-Hit');
                if ($newActiveItem.length) {
                    // Normal case: Move to the previous item
                    $activeItem.attr('aria-selected', 'false');
                    $newActiveItem.attr('aria-selected', 'true');
                    algolia.scrollToView($newActiveItem, $container);

                    algolia.updateHitMoreInfo($newActiveItem);
    
                } else if ($activeItem.is(':first-child')) {
                    // If the current item is the first one, wrap around to the last item
                    $newActiveItem = $('.DocSearch-Hit').last();
                    $activeItem.attr('aria-selected', 'false');
                    $newActiveItem.attr('aria-selected', 'true');
                    algolia.scrollToView($newActiveItem, $container);

                    algolia.updateHitMoreInfo($newActiveItem);
    
                }
            } else {
                // No active item, activate the last one in the list
                $newActiveItem = $('.DocSearch-Hit').last();
                $newActiveItem.attr('aria-selected', 'true');
                algolia.scrollToView($newActiveItem, $container);

                algolia.updateHitMoreInfo($newActiveItem);

            }
        } else if (event.key === 'Enter') {
            // Handle selection of the currently active item
            if ($activeItem.length) {
                //console.log('Selected item:', $activeItem.find('a').attr('href'));
                url = sanitizeUrl($activeItem.find('a').attr('href'));
                if (isValidUrl(url)) {
                    window.location.href = url;
                } else {
                    console.error('Invalid URL:', url);
                    showToast(`Something is wrong with the hit target (${url})! Cannot go there ... `, 'bg-danger', 'text-light');
                    console.error('Search error:', error);
                }
            }
        } 
    
        // Move the mouse outside the container

        const isMouseInside = ($container) => {
            // Get the container's position and size
            const offset = $container.offset();
            const width = $container.outerWidth();
            const height = $container.outerHeight();
        
            // Get the current mouse position
            const mouseX = event.pageX;
            const mouseY = event.pageY;
        
            // Check if mouse is within the container's boundaries
            return (
                mouseX >= offset.left &&
                mouseX <= offset.left + width &&
                mouseY >= offset.top &&
                mouseY <= offset.top + height
            );
        };

        //const isMouseInside = $container.is(':hover');
        if (isMouseInside($container)) {
            // Create a temporary element to move the mouse cursor out
            const $temp = $('<div>').css({
                position: 'absolute',
                top: '-100px',
                left: '-100px',
                width: '1px',
                height: '1px'
            }).appendTo('body');
    
            // Focus the new item to give a visual indication
            if ($newActiveItem) {
                $newActiveItem[0].focus();
            }
    
            // Remove the temporary element
            setTimeout(() => {
                $temp.remove();
            }, 0);
        }
    },

    scrollToView: ($item, $container) => {
        const containerTop = $container.offset().top;
        const containerScrollTop = $container.scrollTop();
        const containerHeight = $container.height();
        const itemTop = $item.length > 0 ? $item.offset().top : 0;
        const itemHeight = $item.outerHeight();
        const margin = $('.DocSearch-Hit-source').outerHeight() + 20 ; // Minimum margin from the top
    
        // Check if the item is above the visible container view
        if (itemTop - containerTop < margin) {
            $container.scrollTop(containerScrollTop + (itemTop - containerTop) - margin);
        }
        // Check if the item is below the visible container view
        else if (itemTop + itemHeight - containerTop > containerHeight) {
            $container.scrollTop(containerScrollTop + (itemTop + itemHeight - containerTop) - containerHeight);
        }
    },
    
    keyboardEventsHandler: (event) => {
        algolia.unsetMouseHitEvents();
        algolia.handleKey(event);
        setTimeout(()=>algolia.setMouseHitEvents(), 200); // a bit of delay to prevent mouse event to trigger
    },

    setMouseHitEvents: () => {
        $(document).off('mouseenter').on('mouseenter', '.DocSearch-Hit', algolia.mouseEventsHandlers.mouseEnter);
        $(document).off('mouseleave').on('mouseleave', '.DocSearch-Hit', algolia.mouseEventsHandlers.mouseLeave);
    },

    unsetMouseHitEvents: () => {
        $(document).off('mouseenter');
        $(document).off('mouseleave');
    },

    mouseEventsHandlers: {
        mouseEnter: (event) => {
            $('.DocSearch-Hit').attr('aria-selected', 'false');
            $closestElement = $(event.target).closest('.DocSearch-Hit');
            $closestElement.attr('aria-selected', 'true');
            algolia.updateHitMoreInfo($closestElement);
        },

        mouseLeave: (event) => {
            $closestElement = $(event.target).closest('.DocSearch-Hit');
            $closestElement.attr('aria-selected', 'false');
        }
    }

}