algolia = {
    appId: algoliaSettings.algoliaAppID,
    apiKey: algoliaSettings.algoliaPublicApiKey,
    indexName: algoliaSettings.algoliaIndex,
    container: algoliaSettings.algoliaSearchBoxContainer,
    debug: algoliaSettings.algoliaDebug,
    maxResultsPerGroup: algoliaSettings.algoliaMaxResultsPerGroup,
    insights: algoliaSettings.algoliaSendInsights,
    raiseIssueLink: algoliaSettings.algoliaRaiseIssueLink,

    searchInSite: (query, searchResultsCallback) => {
        const client = algoliasearch(algolia.appId, algolia.apiKey);
        const index = client.initIndex(algolia.indexName);
        index.search(query)
            .then(function(searchResults) {
                searchResultsCallback(searchResults.hits);
            })
            .catch(function(error) {
                showToast('Something went wrong with this search!<br><br>You may try again later. If the problem persist, contact support.', 'bg-danger', 'text-light');
                console.error('Search error:', error);
            });
    },

    setDocSearchBox: () => {
        // hide JTD search box for the moment

        // set algolia DocSearch box
        $('.search').addClass('d-none');
        docsearch({
            appId: algolia.appId,
            apiKey: algolia.apiKey,
            indexName: algolia.indexName,
            container: algolia.container,
            debug: algolia.debug,
            maxResultsPerGroup: algolia.maxResultsPerGroup,
            insights: algolia.insights,
            raiseIssueLink: algolia.algoliaRaiseIssueLink,

            resultsFooterComponent({ state }) {
                const maxHits = algolia.maxResultsPerGroup;
                let children = [];
                if (state.context.nbHits > maxHits)
                children = [
                    `${state.context.nbHits} hits found!
                    Refine your query to get all hits (maximum ${algolia.maxResultsPerGroup}).
                    `
                    ];
                else
                children = [
                    `${state.context.nbHits} hit(s) found!
                    All of them are shown.
                    `
                ];
                return {
                type: 'div',
                ref: undefined,
                constructor: undefined,
                key: state.query,
                props: {
                    class: 'w-100 d-flex justify-content-center text-dark bg-warning-subtle rounded p-3 fw-medium',
                    children: children
                },
                __v: null,
                };
            },

            getMissingResultsUrl({ query }) {
                return `${algolia.raiseIssueLink}${query}`;
            },
        });
        
        // finally remove the JTD search box
        setTimeout(()=>$('.search').remove(), 5000);
    }
   
}
