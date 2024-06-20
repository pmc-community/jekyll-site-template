/* SOME UTILITIES ADDED TO JQUERY*/
// check if an element is on screen
$.fn.is_on_screen = function () {
    var win = $(window);
    var viewport = {
        top: win.scrollTop(),
        left: win.scrollLeft()
    };
    viewport.right = viewport.left + win.width();
    viewport.bottom = viewport.top + win.height();

    var bounds;
    bounds = this.offset();
    bounds.right = bounds.left + this.outerWidth();
    bounds.bottom = bounds.top + this.outerHeight();

    return (!(viewport.right < bounds.left || viewport.left > bounds.right || viewport.bottom < bounds.top || viewport.top > bounds.bottom));
};

// usage: $().sizeChanged(function(){})
$.fn.sizeChanged = function (handleFunction) {
    var element = this;
    var lastWidth = element.width();
    var lastHeight = element.height();

    setInterval(function () {
        if (lastWidth === element.width()&&lastHeight === element.height())
            return;
        if (typeof (handleFunction) == 'function') {
            handleFunction({ width: lastWidth, height: lastHeight },
                            { width: element.width(), height: element.height() });
            lastWidth = element.width();
            lastHeight = element.height();
        }
    }, 100);
    return element;
};

// init page toc
$(function () {
    var navSelector = settings.pageToc.toc;
    var $myNav = $(navSelector);
    if ($(`#${settings.marker404}`).length === 0) Toc.init($myNav);
    // check if there is something in the ToC, if empty, the scrollspy raise errors in console
    // page toc will be further removed from page when the page loads
    if ($(`${settings.pageToc.toc} ul`).children('li').length > 0 ) $(settings.pageToc.scrollSpyBase).scrollspy({target: navSelector,});
});

const removeChildrenExceptFirst = (nodeSelector) => {
    var $node = $(nodeSelector);
    var $children = $node.children();
    var $childrenToRemove = $children.not(':first-child');
    $childrenToRemove.remove();
}

// generate uuid
const uuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        // eslint-disable-next-line
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const hashFromString = (string) => {
    const regex = /#(.*)/;
    const match = string.match(regex);
    const hash = match ? match[1] : null;
    return hash;
}

const arrayDuplicates = (arr) => {
    const counts = _.countBy(arr);
    const duplicates = _.pickBy(counts, count => count > 1);
    const duplicateValues = _.keys(duplicates);
    return duplicateValues;
}

// read external contents between markers
const getExternalContent = async (file, position, startMarker , endMarker, header, whereID, whoCalled) => {
    $(window).on('load', () => {
        // prevent returning unwanted quantity of content
        if (typeof startMarker === 'undefined' ||  typeof endMarker === 'undefined' ) return;
        if (startMarker.trim() === '' && endMarker.trim() === '') return;
        
        // getting the content from external md
        // comments in the form of '<!- comment ... ->' are ignored when converting from md to html
        $.ajax({
            url: file,
            method: "GET",
            dataType: "text",
            success: async (data) => {
                const converter = new showdown.Converter();
                const content = await data;
                goodHeader = typeof header === 'undefined' ? '' : header;
                let contentSliced = goodHeader + '\n';
                const startIndex = startMarker === 'fullFile' ? 0 : content.indexOf(startMarker) + startMarker.length;
                const contentA = content.slice(startIndex);
                const endIndex = endMarker === 'fullFile' ? contentA.length+1 : contentA.indexOf(endMarker) ;
                const contentB = contentA.slice(0,endIndex);
                contentSliced += contentB + '\n';

                contentSliced = converter.makeHtml(contentSliced);

                let contentPlaceholder = '';

                const contentPlaceholderID = whereID ? whereID : uuid();
                if(!whereID) contentPlaceholder = `<div id=${contentPlaceholderID}><div>`;

                constContentPosition = typeof position === 'undefined' || position === '' ? 'after' : position;
                if (constContentPosition === 'before') $(settings.externalContent.containerToIncludeExternalContent).prepend(contentPlaceholder);
                if (constContentPosition === 'after') $(settings.externalContent.containerToIncludeExternalContent).append(contentPlaceholder);
                
                $(`#${contentPlaceholderID}`).html(contentSliced);

                // refresh the ToC
                initPageToc();
                
                // move the top of page where it should be
                if (position === 'before') {
                    $(settings.goToTopBtn.topOfPageId).remove();
                    addTopOfPage();
                }
            },
            error: async (xhr, status, error) => {
                toast = new bootstrap.Toast($('.toast'));
                $('.toast').addClass('bg-danger');
                $('.toast-body').html('Error loading external content. Details in console ...');
                toast.show();
                const placeholder = position === 'before' || position === 'after' ? 'N/A for this position' : whereID;
                console.error(`Error fetching file: ${file}\nStatus: ${status} / ${xhr.responseText}\nPosition: ${position}\nPlaceholder: ${placeholder}\nOrigin: ${whoCalled}`,error
                );
            }
        });
    })   
}

const findObjectInArray = (searchCriteria, objectArray) => {
    return _.some(objectArray, (obj) => {
        const matches = Object.entries(searchCriteria).every(([key, value]) => obj[key] === value);
        return matches;
      });
}

const getObjectFromArray = (searchCriteria, objectArray) => {
    if (objectArray.length === 0) return 'none';
    const found = _.find(objectArray, searchCriteria);
    return !found || found === 'undefined' ? 'none' : found;
}

const objectIndexInArray = (searchCriteria, objectArray) => {
    return _.findIndex(objectArray, (obj) => {
        return Object.entries(searchCriteria).every(([key, value]) => obj[key] === value);
      });
}

const readQueryString = (queryParameter) => {

    const replaceSpecialCharacters = (inputString) => {
        const encodedString = encodeURIComponent(inputString);
        const replacedString = decodeURIComponent(encodedString);
        return replacedString;        
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const value = urlParams.get(queryParameter);
    return value;
}

const filterArrayStartingWith = (arr, prefix, caseSensitive) => {
    return arr.filter(function(item) {
        return (
            typeof item !== 'string' ? 
                item : 
                !caseSensitive ? 
                    item.toLowerCase().startsWith(prefix.toLowerCase()) : 
                    item.startsWith(prefix) 
        );
    });
}

const setSearchList = (
    searchInputSelector, 
    searchResultsSelector, 
    searchResultsItemSelector, 
    searchResultsItemTag, 
    searchResultsItemClosingTag,
    caseSensitive = false,
    callback,
    callbackFilteredList = null
) => {  

    const handleSetTagSearcResults = (
        searchInputSelector, // css selector for the search text input field
        searchResultsSelector, // css selector for the search results list
        searchResultsItemSelector, // usually li[some_attribute = "some_value"]
        searchResultsItemTag, // usually <li with_some_attributes>
        searchResultsItemClosingTag, // usually </li>
        caseSensitive, // true if the search must be case sensitive
        callback, // do something with selected item
        callbackFilteredList // do something with the filtered list before showing it and before making any selection
    ) => {
            const $searchInput = $(searchInputSelector);
            const $searchResults = $(searchResultsSelector);

            $searchResults.css('left', $(searchInputSelector).position().left + 'px');
            $searchResults.css('top', $(searchInputSelector).position().top + $(searchInputSelector).outerHeight(true) + 'px');    

            let list = [];
            $(searchResultsItemSelector).each(function() { list.push($(this).text().trim()); });

            function showSearchResults() {
                //const searchTerm = $searchInput.val().trim().toLowerCase();
                const searchTerm = $searchInput.val().trim();
                let html = '';
                if (searchTerm === '') {
                    $searchResults.hide();
                    return;
                }
                const filteredList =  filterArrayStartingWith (list, searchTerm, caseSensitive);
                filteredList.forEach(function(item) { html += searchResultsItemTag + item + searchResultsItemClosingTag; });            
                $searchResults.html(html);
                if (callbackFilteredList) callbackFilteredList(filteredList); // do some addtional processing to the filtered list before showing it
                $searchResults.show();
            }
            
            $searchInput.off('input').on('input', function() { if ($searchInput.val().trim() !== '') showSearchResults(); });
        
            // Handle click outside search input or search results to hide the list
            $(document).on('click', function(event) {
                const $target = $(event.target);
                if (!$target.closest(`${searchInputSelector}, ${searchResultsSelector}`).length) { $searchResults.hide();} 
            });
        
            // Hide search results when pressing escape key
            $(document).off('keydown').on('keydown', function(event) {
                if (event.which === 27) { // Escape key
                    $searchResults.hide();
                    $searchInput.val('');
                    //_.remove(list); // first, clear the list since modification of the searchResultsItemSelector elements may occured meanwhile
                    //$(searchResultsItemSelector).each(function() { list.push($(this).text().trim()); }); // re-build the list
                }
            });
        
            // Handle keydown events on search input
            // HEADS UP!!! .off('keydown') is mandatory, otherwise multiple handlers will be set and errors can be raised
            // e.g., when having datatables on page and one of these must be updated on the event handler callback, the instances of dt may be mixed
            // and datatables.js may raise error of not being able to initialize a table since is already initialized
            $searchInput.off('keydown').on('keydown', function(event) {

                // Adjust scroll position to keep the selected element in sight
                const getElementInSight = (container, element) => {
                    const containerHeight = container.innerHeight();
                    const scrollTop = container.scrollTop();
                    const elementTop = element.position().top;

                    if (elementTop < 0) {
                    container.scrollTop(scrollTop + elementTop); // Scroll up
                    } else if (elementTop + element.outerHeight() > containerHeight) {
                        container.scrollTop(scrollTop + elementTop + element.outerHeight() - containerHeight); // Scroll down
                    }
                }

                const $selected = $searchResults.find('.selected');
                const $items = $searchResults.find(searchResultsItemSelector);
        
                // Handle up arrow key
                if (event.which === 38) { // Up arrow
                    if ($selected.length) {
                        let $prev = $selected.prev();
                        if ($prev.length) {
                            $selected.removeClass('selected');
                            $prev.addClass('selected');
                            if ($items.filter('.selected').length === 1) {
                                $searchInput.val($prev.text()); // Copy selected value to search input
                            }
                            // Adjust scroll position to keep the selected element in sight
                            getElementInSight($searchResults, $prev)
                        }
                    } else {
                        $items.last().addClass('selected');
                        $searchInput.val($items.last().text()); // Copy last value to search input
                    }
                    event.preventDefault(); // Prevent scrolling the page
                }
        
                // Handle down arrow key
                if (event.which === 40) { // Down arrow
                    if ($selected.length) {
                        let $next = $selected.next();
                        if ($next.length) {
                            $selected.removeClass('selected');
                            $next.addClass('selected');
                            if ($items.filter('.selected').length === 1) {
                                $searchInput.val($next.text()); // Copy selected value to search input
                            }
                            // Adjust scroll position to keep the selected element in sight
                            getElementInSight($searchResults, $next);                        }
                    } else {
                        $items.first().addClass('selected');
                        $searchInput.val($items.first().text()); // Copy first value to search input
                    }
                    event.preventDefault(); // Prevent scrolling the page
                }

                // Handle enter key
                if (event.which === 13) { // Enter key
                    if ($selected.length === 1) { // Only if there is a single selected item
                        const selectedValue = $selected.text();
                        $searchInput.val(selectedValue); // Set input value to selected item
                        $searchResults.hide(); // Hide search results
                        event.preventDefault(); // Prevent default behavior (form submission)
                        $searchInput.val('');
                        callback(selectedValue);
                    }
                }
            });

            // Handle click on search results item
            $searchResults.off('click', searchResultsItemSelector).on('click', searchResultsItemSelector, function() {
                const clickedValue = $(this).text();
                $searchInput.val(clickedValue); // Set input value to clicked item
                $searchResults.hide(); // Hide search results
                $searchInput.val('');
                callback(clickedValue);
            });
    }

    $(document).off('ready', handleSetTagSearcResults).ready(handleSetTagSearcResults.bind(
        null, 
        searchInputSelector, 
        searchResultsSelector, 
        searchResultsItemSelector, 
        searchResultsItemTag, 
        searchResultsItemClosingTag,
        caseSensitive,
        callback,
        callbackFilteredList
    ));
        
}

// columnsConfig is set in the caller, to be fit to the specific table
// callback and callbackClickRow are set in the caller to do specific processing after the table is initialized
const setDataTable = (tableSelector, tableUniqueID, columnsConfig, callback, callbackClickRow, additionalSettings = {}) => {
    const defaultSettings = {
        paging: true, 
        ordering: true,
        searching: true,
        colReorder: true,
        processing: true,
        fixedHeader: true,
        colReorder: false,
        layout: {
            topStart: {
                pageLength: {
                    menu: [1, 5, 10, 25, 50]
                }
            },
            bottom2: {
                buttons: [
                    {
                        extend: ['colvis'],
                        columns: ':gt(0)', // except first column which will be always visible
                        text: 'Columns',
                        attr: {
                            title: 'Show/Hide Columns',
                            siteFunction: 'tableColumnsVisibility'
                        },
                        className: 'btn-primary btn-sm text-light focus-ring focus-ring-warning mb-2'
                    }
                ]
            }
        },
        stateSave: true,
        stateSaveCallback: function (settings, data) {
            localStorage.setItem(`${window.location.pathname.replace(/^\/|\/$/g, '').replace(/\//g, '_')}_DataTables_` + tableUniqueID, JSON.stringify(data));
        },
        stateLoadCallback: function (settings) {
            return JSON.parse(localStorage.getItem(`${window.location.pathname.replace(/^\/|\/$/g, '').replace(/\//g, '_')}_DataTables_` + tableUniqueID));
        },
        columns: columnsConfig
    };
    const allSettings = {...defaultSettings, ...additionalSettings};

    $(document).ready(function() {
        $(`${tableSelector} tr`).removeClass('table-active'); // just to be sure that nothing is marked as selected
        table = $(tableSelector).DataTable(allSettings);

        // callback to be personalised for each table
        // for post processing the table (i.e. adding buttons based on context)
        callback(table);

        const composeRowClickColumnsSelector = (colDef) => {
            let notActiveWhenClick = [];
            colDef.forEach( column => {
                if (column && table.column(colDef.indexOf(column)).visible() && table.colReorder.order().indexOf(colDef.indexOf(column)) !== -1) {
                    if (column.exceptWhenRowSelect) {
                        notActiveWhenClick.push(colDef.indexOf(column));
                    }
                }
            });
            let rowClickSelector = 'tbody tr'

            if (notActiveWhenClick.length > 0) {
                rowClickSelector = 'tbody td'
                notActiveWhenClick.forEach( columnIndex => {
                    rowClickSelector += `:not(:nth-child(${columnIndex+1}))`
                });
            }
            return rowClickSelector
        }
        
        // HEADS UP!!!
        // ARROW FUNCTIONS NOT ALLOWED HERE, WILL RAISE ERROR WHEN EXECUTING CALLBACK
        const handleRowClick = function(event) {
            table = $(event.target).closest('table').DataTable(); // mandatory when many tables on page, otherwise will mix the tables and raise errors
            
            if (table.rows().count() > 0) {
                // using try-catch to avoid datatables behaviour when removing rows and clicking in table. 
                // table.rows().count() has still the value before the rows removal
                try { 
                    $(`${tableSelector} tr`).removeClass('table-active');
                    if (event.target.tagName.toLowerCase() === 'span') rowElement = $(event.target).parent().parent();
                    else rowElement = $(event.target).parent();
                    rowElement.addClass('table-active');

                    // callbackClickRow to be personalised for each table
                    // to process the selected row
                    callbackClickRow({
                            rowNumber: table.row(this).index(),
                            data: table.row(this).data()
                        }
                    );
                } catch {} 
            }
        }

        table.off('click').on('click', composeRowClickColumnsSelector(columnsConfig), handleRowClick);

        // since tables are created dynamically, some color corrections may be lost 
        // because the theme is already applied, so we need to do the corrections again
        // also needed when switching theme
        // if switch theme and increase no of rows/page, new rows will have the previous scheme background
        applyColorSchemaCorrections();
        // also on draw event to cover all potential cases
        table.on('draw', function () { applyColorSchemaCorrections(); });
    });
}

const addAdditionalButtonsToTable = (table, tableSelector, zone, btnArray) => {
    tableConfiguration = table.settings().init();
    tableConfigurationLayout = tableConfiguration.layout || {};
    tableConfigurationLayoutZone = tableConfigurationLayout[zone] || {};
    tableButtonsInZone = tableConfigurationLayoutZone.buttons || [];
    tableButtonsInZone = [...tableButtonsInZone, ...btnArray];
    tableConfiguration.layout[zone].buttons = tableButtonsInZone;
    table.destroy();
    $(tableSelector).DataTable(tableConfiguration);
    applyColorSchemaCorrections();
}

const handleBtnClose = () => {
    $(document).ready(function ()  {
        // delegate listener at higher level since some close buttons may be created dynamically
        $(document).on('click','.btn-close', function() {
            toCloseSelector = $(this).attr('whatToClose');
            if (toCloseSelector !== 'undefined' && $(`${toCloseSelector}`).length > 0 ) {
                $(`${toCloseSelector}`).fadeOut();
            }
        });
    });
}

const applyColorSchemaCorrections = (theme) => {
    
    // jtd forgets to change some colors when switching from light to dark and back
    if (!theme) {
        let themeCookie = Cookies.get(settings.themeSwitch.cookie);
        if (typeof themeCookie === 'undefined') Cookies.set(settings.themeSwitch.cookie,0, { expires:365 , secure: true, sameSite: 'strict' });
        themeCookie = Cookies.get(settings.themeSwitch.cookie);
        if (Cookies.get(settings.themeSwitch.cookie) === '0' ) theme = 'light';
        else  theme = 'dark';
    }

    if (theme === 'light' ) {
        $(settings.colSchemaCorrections.elementsWithBackgroundAffected).css('background',settings.colSchemaCorrections.backgroundColorOnElementsAffected.light);
        $(settings.colSchemaCorrections.elementsWithTextAffected).css('color', settings.colSchemaCorrections.textColorOnElementsAffected.light);
        $(settings.colSchemaCorrections.elementsWithBorderTopAffected).css('border-top', settings.colSchemaCorrections.borderTopOnElementsAffected.light);
        $('.btn-close').removeClass('btn-close-white');
    }
    else {
        $(settings.colSchemaCorrections.elementsWithBackgroundAffected).css('background',settings.colSchemaCorrections.backgroundColorOnElementsAffected.dark);
        $(settings.colSchemaCorrections.elementsWithTextAffected).css('color', settings.colSchemaCorrections.textColorOnElementsAffected.dark);
        $(settings.colSchemaCorrections.elementsWithBorderTopAffected).css('border-top', settings.colSchemaCorrections.borderTopOnElementsAffected.dark)
        $('.btn-close').addClass('btn-close-white');
    }
}

const sanitizeURL = (url) => {
    url = url.trim();

    if (!/^(?:\w+:)?\/\//.test(url) && url[0] !== '/') {
        url = url.split(/[?#]/)[0];
        return url;
    }
    url = decodeURI(url);
    url = url.split(/[?#]/)[0];
    url = encodeURI(url);

    return url;
}

const getElementInHotZone = (elements, zone, callback) => {
    $(document).ready(function() {
        $(window).scroll(function() {
            const viewportTop = $(window).scrollTop();
            const viewportBottom = viewportTop + $(window).height();
            let minTopPosition = Number.POSITIVE_INFINITY;
            let minTopElement = null;
            
            elements.forEach(function(element) {
        
                $(element).each(function() {
                    const crtElement = $(this);
                    let crtElementTop = crtElement.offset().top;
            
                    if (crtElementTop >= viewportTop + zone.top && crtElementTop <= viewportTop + zone.bottom) {
                        if (crtElementTop < minTopPosition) {
                            minTopPosition = crtElementTop;
                            minTopElement = crtElement;
                        }
                    }
                });
            });
        
            if (minTopElement) {
                callback(minTopElement);
            }
        });
    });
}

const applyColorSchemaCorrectionsOnTD = () => {
    const targetNode = document.querySelector(settings.layouts.contentArea.contentContainer);
    if (targetNode) {
        const config = { childList: true, subtree: true };
        const callback = function(mutationsList, observer) {
            mutationsList.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1 && $(node).is('tr.child')) {
                        applyColorSchemaCorrections();
                    }
                });
            });
        };
        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);
    } else {
        console.error('Target node not found when trying to set datatables cell background');
    }
}

const showToast = (message, type, textType) => {
    toast = new bootstrap.Toast($('.toast'));
    $('.toast').removeClass('bg-warning').removeClass('bg-danger').removeClass('bg-success').removeClass('bg-info');
    $('.toast').addClass(type);
    $('.toast .toast-body').removeClass('text-light').removeClass('text-dark');
    $('.toast .toast-body').addClass(textType);
    $('.toast-body').html(message);
    toast.show();
}

const getCurrentDateTime = () => {
    return formatDate(new Date());
}

const formatDate = (dateString) => {
    const today = new Date(dateString);
    const dd = String(today.getDate()).padStart(2, '0');
    const mmm = today.toLocaleString('default', { month: 'short' });
    const yyyy = today.getFullYear();
    
    //const hh = String(today.getHours()).padStart(2, '0');
    //const mm = String(today.getMinutes()).padStart(2, '0');
    
    const formattedDate = `${dd}-${mmm}-${yyyy}`;
    return formattedDate;
}

const keepTextInputLimits = (textInputSelector, maxWords, maxChars, wordCountSelector, charCountSelector) => {
    const MAX_WORDS = maxWords;
    const MAX_CHARS = maxChars;
    const $textarea = $(textInputSelector);
    const $wordCount= $(wordCountSelector) || null;
    const $charCount= $(charCountSelector) || null;

    $textarea.on('keyup keypress paste', function() {
        const text = $(this).val();
        const wordCount = _.words(text).length;
        const charCount = text.length;
        if ($wordCount) $wordCount.text(`W: ${wordCount}/${MAX_WORDS}`);
        if ($charCount) $charCount.text(`C: ${charCount}/${MAX_CHARS}`);
        if (wordCount > MAX_WORDS || charCount > MAX_CHARS) {
            $(this).val(_.truncate(text, { 'length': MAX_CHARS }));
        }
    });
}

// OBSERVERS
// observes when elementSelector receive class cls (getClass=true) or lose class cls (getClass=false)
// and executes callback function
const setElementChangeClassObserver = (elementSelector, cls, getClass, callback = () => {}) => {
    const targetElement = document.querySelector(elementSelector);
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.attributeName === 'class') {
                const classList = Array.from(mutation.target.classList);                
                if (!getClass) { if (!classList.includes(cls)) callback(); }
                else { if (classList.includes(cls)) callback(); }
            }
        });
    });
    const config = { attributes: true, attributeFilter: ['class'] };
    siteObservers.set(observer, `${elementSelector} class=${cls} getClass=${getClass}`);
    observer.observe(targetElement, config);
}

// observes when an element with class=element Class is created and executes callback function
const setElementCreatedByClassObserver = (elementClass, callback = () => {}) => {
    const mutationCallback = function(mutationsList) {
        for(const mutation of mutationsList) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node instanceof Element && node.classList.contains(elementClass)) {
                        callback();
                    }
                });
            }
        }
    };
    
    const observerOptions = {
        childList: true,  
        subtree: true  
    };
    
    const targetNode = document.body;
    const observer = new MutationObserver(mutationCallback); 
    siteObservers.set(observer, `body (class=${elementClass})`); 
    observer.observe(targetNode, observerOptions);
}

// observes when the element with selector=selector is created and executes callback function
const setElementCreateBySelectorObserver = (selector, callback = () => {}) => {
    function handleNewElements(mutationsList) {
        mutationsList.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1 && node.matches(selector)) {
                        callback();
                    }
                });
            }
        });
    }
    
    var targetNode = document.body;
    var config = { childList: true, subtree: true };    
    var observer = new MutationObserver(function(mutationsList, observer) {
        handleNewElements(mutationsList, observer);
        
    });
    siteObservers.set(observer, `body (selector=${selector})`); 
    observer.observe(targetNode, config);

}

// disconnect an observer having the id=observerID
// see each observer definition to understand what are the used observerIDs
const removeObservers = (observerID) => {
    for (const [observer, element] of siteObservers) {
        if (element === observerID) {
            observer.disconnect();
            siteObservers.delete(observer);
        }
    }
}

// build a CKEditor Decoupled Editor having a set of default options + context specific options, on a div with the id=placeholder
// sets the needed general observers to modify the styles of the dynamic created elements
// sets the listeners for context specific processing and the references to the context specific callbacks:
// - post-processing the editor object after creation (callbackEditor)
// - process editor data while typing (callbackEditorData)
// - process editor data when hit the enter key (callbackEnterKey)
const setEditor = (placeholder, options={}, callbackEditor = ()=>{}, callbackEditorData = ()=>{}, callbackEnterKey = ()=>{}) => {
    const createEditor = () => {
        const $parent = $(placeholder).parent();
        const defaultBuiltInOptions = {
            toolbar: [
                'undo', 'redo', '|', 'heading', '|', 'alignment', 'outdent', 'indent', '|',
                {
                    label: 'Fonts',
                    withText: true,
                    items: [ 'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor' ]
                },
                '|',
                {
                    label: 'Style',
                    withText: true,
                    items: [ 'bold', 'italic', 'strikethrough', 'superscript', 'subscript' ]
                },
                '|',
                {
                    label: 'Code Blocks',
                    withText: true,
                    items: [ 'blockQuote', 'codeBlock' ]
                },
                '|', 'link', 'blockQuote', '|',
                {
                    label: 'Lists',
                    withText: true,
                    items: [ 'bulletedList', 'numberedList', 'todoList']
                },   
            ]
        }

        const allBuiltInOptions = { ...defaultBuiltInOptions, ...options.builtInOptions }

        // EDITOR EVENT HANDLERS

        // on change:data
        const handleEditorDataChange = (editor, callbackEditorData) => {
            // we assume that there may be a setData() when processing the text, so we stop the listner to avoid endless loop
            editor.model.document.off('change:data');
            callbackEditorData(editor, ()=>{
                
                // more post setData() processing can be added here, before setting back the listener
                // this processing will be executed for all active CKEditors, so it should be something like logging
                // this is callbackResponse function, see setting the CKEditor in page-full-info.js 
                /* ... */
                editor.model.document.on('change:data', handleEditorDataChange.bind(null, editor, callbackEditorData));
            });
        } 

        // on hit enter
        const handleEnterKey = (editor, callbackEnterKey) => {
            callbackEnterKey(editor); 
        }

        const setListeners = (editor) => {

            // set a listener to process data while typing
            // using on change:data to filter events that don't change data but fire the event (i.e. mouse click)
            editor = $parent.find('.ck-editor__editable')[0].ckeditorInstance;
            editor.model.document.on('change:data', handleEditorDataChange.bind(null, editor, callbackEditorData));

            // set a listener to process data when hit enter key
            // but first remove any potential existing listeners on enter key
            editor.editing.view.document.off('enter');
            editor.editing.view.document.on('enter', handleEnterKey.bind(null, editor, callbackEnterKey));

        }

        // CREATE THE EDITOR OR RESET ITS DATA IF ALREADY EXISTS
        if ($parent.find('.ck').length === 0) {
            DecoupledEditor.create(document.querySelector(placeholder), allBuiltInOptions)
            .then(editor => {

                if (options.toolbar.show) {
                    const toolbarContainer = document.querySelector( options.toolbar.selector);
                    toolbarContainer.appendChild( editor.ui.view.toolbar.element );

                    if (options.menuBar.show) {
                        document.querySelector( options.menuBar.selector).appendChild( editor.ui.view.menuBarView.element );
                        $(options.toolbar.selector).css('margin-top','-1px');
                    }
                    
                    removeObservers(`${placeholder} class=documentEditor getClass=false`);
                    $(placeholder).addClass('documentEditor').addClass('border').removeClass('rounded');
                    setElementChangeClassObserver(placeholder,'documentEditor', false, ()=>{
                        $(placeholder).addClass('documentEditor').addClass('border').removeClass('rounded');
                    });
                }
                else {
                    removeObservers(`${placeholder} class=border getClass=false`);
                    $(placeholder).addClass('border');
                    setElementChangeClassObserver(placeholder,'border', false, ()=>{
                        $(placeholder).addClass('border');
                    });            
                }
                callbackEditor(editor);
                setListeners(editor);
        
            })
            .catch(error => {
                console.error(error);
            });
        }
        else {
            // stop the listener so editor to not fire on change for setData() and avoid endless loop on change
            editor = $parent.find('.ck-editor__editable')[0].ckeditorInstance;
            editor.model.document.off('change:data');
            editor.setData('');
            setListeners(editor);
        }
    }

    $(document).ready(createEditor);
}

const transformEditorTextToArray = (htmlString) => {
    const textWithoutTags = htmlString.replace(/<[^>]*>|&nbsp;/g, ' ');
    const trimmedText = textWithoutTags.trim().replace(/\s{2}/g, ', ');
    const rawArray = trimmedText.split(",");
    const notEmptyArray = _.compact(rawArray);
    var nonEmptyArray = _.filter(nonEmptyArray, function(value) { return value !== ''; });
    const cleanArray = notEmptyArray.map(function(value) { return value.trim(); });
    const uniqueArray = _.uniqBy(cleanArray, function(value) { return value.toLowerCase(); });
    
    return uniqueArray;
}

const createGlobalLists = () => {
    globCustomCats = _.uniq(getCustomCats());
    globCustomTags = _.uniq(getCustomTags());
    globAllCats = _.uniq(Array.from(new Set([...catList, ...globCustomCats].slice().sort())));
    globAllTags = _.uniq(Array.from(new Set([...tagList, ...globCustomTags].slice().sort()))); // here to check if a site tag is the same as a custom tag and to rename the custom tag with CT_

    // do some cleaning since datatables are, usually, created with saveState configuration
    // and modifications of tags may lead to orphan tables in slocal storage
    getOrphanDataTables('tag').forEach( table => { localStorage.removeItem(table); });
}

const getOrphanDataTables = (what) => {
    
    let substring = '';

    switch (what) {
        case 'tag':
            substring = '_DataTables_TagPages_';
            break;
    }
    
    if (!substring) return [];
    if (substring === 'undefined' || substring === '') return [];

    let matchingKeys = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.includes(substring)) {
            matchingKeys.push(key);
        }
    }

    const modifiedArray = _.map(matchingKeys, item => {
        return _.split(item, substring)[1];
      });

    const orphanTags = _.difference(_.uniq(modifiedArray.sort()), globAllTags);
    const regex = new RegExp(`${substring}(${orphanTags.join('|')})$`);
    matchingKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (regex.test(key)) {
          matchingKeys.push(key);
        }
    }

    return matchingKeys;
}

// elementTriggerCloseWhenScroll is the element which triggers the closure of the context menu when scrolled vertically. 
// usually is the window element but can be the parent of the element on which the context menu is applied 
// (to be used when the context menu is applied on an element which is on a modal or offcanvas that blocks the window scroll when active)
const setContextMenu = (
    elementSelector, //css selector for the element on which the context menu is applied
    elementTriggerCloseWhenScroll = null, //element which triggers the closure of the context menu when scrolled vertically
    menuContent, // the html content of the context menu = header(custom) + body(menu item list) + footer(custom)
    callbackItem, // executed when click on a menu item from the menuContent items list
    callbackAfterShow = null, //executed after the context menu is shown to do some post processing if needed
    additionalClass = [] // additional classes to be applied to the whole context menu container
) => {
    $(document).ready(function() {

        $(document).off('contextmenu', elementSelector).on('contextmenu', elementSelector, function(event) {
            event.preventDefault(); // Prevent default context menu  
            
            // we can use a hard-coded class for the context menu since there will never be more than one open
            // since any click outside a context menu will close it and remove the context menu from the DOM
            $('.context-menu').remove(); // remove the potential existing context menu
            const $clickedElement = $(this);

            const calculatePosition = ($element, dropdownMenu) => {
                // calculate the position of the context menu
                const elementHeight = $element.outerHeight();
                const elementScrollTop = $element.offset().top - $(window).scrollTop();
                const elementLeft = $element.offset().left;
                let topPosition;

                topPosition = elementScrollTop + elementHeight + 2
                
                let leftPosition = elementLeft; 
                
                position = {
                    x:leftPosition,
                    y:topPosition
                }

                return position;
            }

            $(window).sizeChanged(() => { 
                position = calculatePosition($clickedElement, dropdownMenu);
            });

            
            const dropdownMenu = $('<div class="context-menu rounded border bg-light-subtle show">');

            // context menu header
            if (menuContent.header.trim() !=='') {
                const dropdownMenuHeader = $('<div class="context-menu-header px-4 py-2">');
                dropdownMenuHeader.append($(menuContent.header));
                const dropdownMenuSeparator = $('<hr class="my-0 mx-2" siteFunction="contextMenuSeparator">');
                dropdownMenu.append(dropdownMenuHeader).append(dropdownMenuSeparator);
            }
        
            // context menu items
            const dropdownMenuList = $('<ul class="context-menu-list">'); 
            const dropdownMenuListContainer = $('<div class="context-menu-list-container px-4">');
            dropdownMenu.append(dropdownMenuListContainer);
            dropdownMenuListContainer.append(dropdownMenuList);

            menuContent.menu.forEach( item => {
                let $itemElement = $(item.html);
                $itemElement.addClass('context-menu-item py-2');
                dropdownMenuList.append($itemElement);
            });

            // context menu footer
            if (menuContent.footer.trim() !=='') {
                const dropdownMenuFooter = $('<div class="context-menu-footer px-4 py-2">');
                dropdownMenuFooter.append($(menuContent.footer));
                const dropdownMenuSeparator = $('<hr class="my-0, mx-2" siteFunction="contextMenuSeparator">');
                dropdownMenu.append(dropdownMenuSeparator).append(dropdownMenuFooter);
                
            }
            
            position = calculatePosition($(this), dropdownMenu);
            dropdownMenu.css({
                top: position.y + 'px',
                left: position.x + 'px',
            });

            $('body').append(dropdownMenu);
            additionalClass.forEach(cls => {
                dropdownMenu.addClass(cls);
            });
            
            if (callbackAfterShow) callbackAfterShow(event);
            
            // set auto closing events
            if (elementTriggerCloseWhenScroll) 
                $(elementTriggerCloseWhenScroll).on('scroll', function() {
                    $('.context-menu').remove();
                });
            
            $(window).on('scroll', function() {
                $('.context-menu').remove();
            });

            $(document).on('click', function(e) {
                if (!$(e.target).closest('.context-menu').length) {
                dropdownMenu.remove();
                }
            });
            
            // set callback action
            dropdownMenu.find('.context-menu-item').on('click', function(e) {
                e.preventDefault();
                callbackItem($(this), $clickedElement);
                dropdownMenu.remove();
            });
        });
    });
}

const getContextMenuItemHandler = (action, menuContent) => {
    let handler = null;
    menuContent.menu.forEach (menuItem => {
        if ( $(menuItem.html).text().trim() === action ) handler = menuItem.handler
    });
    return handler;
}

const isMobileOrTablet = () => {
    const userAgent = navigator.userAgent.toLowerCase();
  
    const isMobile = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/i.test(userAgent);
    
    // Exclude desktops with touch screens (e.g., some Surface devices)
    const isDesktopTouchScreen = /windows nt 10.0;.*touch/i.test(userAgent);
    if (isTablet && isDesktopTouchScreen) {
      return false; // Exclude desktops with touch masquerading as tablets
    }
  
    const isUserAgentMobileOrTablet = isMobile || isTablet;
    const isMediaQueryMobileOrTablet = window.matchMedia("(max-width: 768px) and (orientation: portrait), (max-width: 992px) and (orientation: landscape)").matches;
  
    // Consider viewport width for more reliable detection in emulation mode
    const viewportWidth = window.innerWidth;
    const isViewportMobileOrTablet = viewportWidth <= 992;
  
    return isUserAgentMobileOrTablet || isMediaQueryMobileOrTablet || isViewportMobileOrTablet;
}

const cleanText = (text) => {
    return DOMPurify.sanitize(text.replace(/<[^>]*>/g, '').replace(/(\n|&nbsp;)/g, ''));
}

const replaceAllOccurrencesCaseInsensitive = (array, target, replacement) => {
    // Create a case-insensitive, global regular expression
    const regex = new RegExp(_.escapeRegExp(target), 'gi');
    
    // Use _.map to iterate through the array and replace the target string
    return _.map(array, item => {
      if (typeof item === 'string') {
        return item.replace(regex, replacement);
      }
      return item;
    });
}