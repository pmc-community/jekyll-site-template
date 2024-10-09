/* LET'S DO SOME WORK */

window.customiseTheme = (pageObj = null) => {
    if (!preFlight.skyClear) return; // comes from preflight-check.js
       
    // first things, first
    cleanSavedItems(); //removes page without any custom data from saved items
    createGlobalLists();

    // clean local storage, remove orphan datatables such as site-pages searchPanes tables
    getOrphanDataTables('').forEach( table => { localStorage.removeItem(table); });
    
    setTheTheme();
    setGoToTopBtn();
    if (pagePermalink !== '/') setFullPageToc();
    if (pagePermalink !== '/') handleTocOnWindowsResize();
    if (pagePermalink !== '/') handleTocDuplicates();  
    setSwitchThemeFunction();
    advRestoreCodeBlocksStyle();
    handleBtnClose(); //from utilities
    if (pagePermalink !== '/') handleTocActiveElementsOnScroll();
    clearTheUrl();

    $(document).ready(() => {
        if (pagePermalink !== '/') {
            // last checks on page toc
            if($(`${settings.pageToc.toc} ul`).children('li').length >0)
                // for some reason, toc is multiplied in firefox, edge, opera and safari, so we remove duplicates
                removeChildrenExceptFirst (settings.pageToc.toc); 
            else 
                // no need to have page toc on screen if there is nothing to see there
                $(settings.pageToc.tocContainer).hide();
        }

        // remove some elements as set in siteConfig.toBeRemovedAfterLoad
        removeUselessElements();
        
        // set the reference to the page main info
        $(settings.layouts.contentArea.contentContainer)
            .attr('pagePermalinkRef', pageObj.permalink)
            .attr('pageTitleRef', pageObj.title);

        // set the global pageInfo object
        pageInfo = pageObj ?
            {
                siteInfo: getObjectFromArray ({permalink: pageObj.permalink, title: pageObj.title}, pageList),
                savedInfo: getPageSavedInfo (pageObj.permalink, pageObj.title),
            } : 
            null;

        // set some utilities for iframes
        window.utilities = iframe__utilities();

        setAnonymousUserToken();
        if (gData.gtm.enabled) pushInfoToGTM(pageInfo);

        setTimeout( () => {
            $('body').css('visibility','visible');
            $('#contentLoading').addClass('d-none');  
        }, settings.colSchemaCorrections.hideBodyUntilLoadTimeout);
    });

}

/* HERE ARE THE FUNCTIONS */

window.removeUselessElements = () => {
    const elements = settings.toBeRemovedAfterLoad;
    elements.forEach( element => {
       const selector  = Object.keys(element)[0];
       const attributes = element[selector];
       attributes.forEach(attribute => {
        $(`${selector}[siteAttr = ${attribute}]`).remove();
       });
    } );
     // refresh page ToC as some removed elements may be headings
    initPageToc();
}

const setSwitchThemeFunction = () => {
    $(window).on('load', () => {
        $(`#${settings.themeSwitch.btnId}`).off('click').on('click', () => {
            $('body').css('visibility','hidden');
            let themeCookie = Cookies.get(settings.themeSwitch.cookie);
            if (typeof themeCookie === 'undefined') 
                Cookies.set(settings.themeSwitch.cookie,0, { expires:365 , secure: true, sameSite: 'strict' });
            
            themeCookie = Cookies.get(settings.themeSwitch.cookie);
            if (themeCookie === '0' ) 
                Cookies.set(settings.themeSwitch.cookie,1, { expires:365 , secure: true, sameSite: 'strict' });
            else 
                Cookies.set(settings.themeSwitch.cookie,0, { expires:365 , secure: true, sameSite: 'strict' });
            
            setTheTheme();
            
            themeCookie = Cookies.get(settings.themeSwitch.cookie);
            if (themeCookie === '0' ) applyColorSchemaCorrections('light');
            else applyColorSchemaCorrections('dark');
            
            setTimeout( () => {$('body').css('visibility','visible');}, settings.colSchemaCorrections.hideBodyUntilLoadTimeout);
        });

    });
    
}

// for some reasons, JTD dark and light themes will override the code blocks style
// and the syntax will not be highlighted anymore
// so, we need to remove the styles applied by the theme on code blocks
const restoreCodeBlockStyle = () => {
    $(document).ready( () => {
        $('code span').each( function() {
            $(this).removeAttr('style')
        });
    });
}

const advRestoreCodeBlocksStyle = () => {
    const targetElement = $('code span')[0];

    if (targetElement) {
        const observer = new MutationObserver(function(mutationsList) {
            mutationsList.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    $('code span').each( function() {
                        $(this).removeAttr('style')
                    });
                }
            });
        });

        const config = { attributes: true, attributeFilter: ['style'] };
        observer.observe(targetElement, config);

        // observer must remain active
        //observer.disconnect();
    }
}

const setTheTheme = () => {
    let themeCookie = Cookies.get(settings.themeSwitch.cookie);
    if (typeof themeCookie === 'undefined') 
        Cookies.set(settings.themeSwitch.cookie,0, { expires:365 , secure: true, sameSite: 'strict' });
    
    themeCookie = Cookies.get(settings.themeSwitch.cookie);
    if (Cookies.get(settings.themeSwitch.cookie) === '0' ) { 
        jtd.setTheme('light'); 
        applyColorSchemaCorrections('light'); 
    }
    else { 
        jtd.setTheme('dark'); 
        applyColorSchemaCorrections('dark'); 
    }
    restoreCodeBlockStyle();
}

const handleTocDuplicates = () => {
    
    const tocLoaderHandler = () => {
        Toc.init({$nav: $(settings.pageToc.toc)});

        let tocKeys = [];
        let tocElements = [];
        let tocElementsDuplicates = [];
        let duplicates = [];
        $(`${settings.pageToc.toc} li a`).each(function() {
            tocKeys.push($(this).attr('href'));
            tocElements.push(this);
        })
        duplicates = arrayDuplicates(tocKeys);
        
        duplicates.forEach((duplicate)=>{
            tocElements.forEach((element) => {
                if ($(element).attr('href')===duplicate)
                    tocElementsDuplicates.push(element);
            })
        });
        
        if (tocElementsDuplicates.length === 0 ) {}
        else {
            let keyIndex = 1;

            tocElementsDuplicates.forEach(function(element) {
                let anchor = hashFromString($(element).attr('href'));

                // change the href of the toc item
                $(element).attr('href','#'+anchor+'_'+keyIndex);

                // change the id of the first anchor
                // first anchor = target for the toc item above
                $('#'+anchor).attr('id', anchor + '_' + keyIndex);
                keyIndex ++;

            });
    
        }
        
        // apply color schema corrections on updated page toc
        const themeCookie = Cookies.get(settings.themeSwitch.cookie);
        if (themeCookie === '0' ) applyColorSchemaCorrections('light');
        else applyColorSchemaCorrections('dark');
        
        if($(`${settings.pageToc.toc} ul`).children('li').length >0) $(settings.pageToc.tocContainer).show();
    }

    document.addEventListener(settings.pageToc.tocLoadedEvent , tocLoaderHandler);
}

const handleTocOnWindowsResize = () => {
    $(window).sizeChanged(() => {
        $(settings.pageToc.tocContainer)
            .css(
                'top', 
                $(settings.headerAboveContent.headerID).height() + settings.pageToc.desktop.offsetFromHeader + 'px'
            )
            .css(
                'left', 
                $(settings.pageToc.desktop.referenceContainer).width() + $(settings.pageToc.desktop.leftSideBar).width() + settings.pageToc.desktop.offsetFromReferenceContainer + 'px'
            );
    });
}

const setFullPageToc = () => {
    $(window).on('load', () => {
        initPageToc();
    });
}

const initPageToc = () => {
    $(settings.pageToc.toc).empty();
    $(`#nav[data-toggle=${settings.pageToc.toc.substring(1)}] .nav-link.active+ul`).css('font-family','poppins');
    $(settings.pageToc.tocContainer)
        .css(
            'top', 
            $(settings.headerAboveContent.headerID).height() + settings.pageToc.desktop.offsetFromHeader + 'px'
        );
    $(`${settings.pageToc.toc} li a`).addClass('fw-normal text-black');
    document.dispatchEvent(new CustomEvent(settings.pageToc.tocLoadedEvent));
}

const setGoToTopBtn = () => {
    hideWhenNotNeeded();

    // should be declared as function, arrow function wont work
    function hideWhenNotNeeded() {
        if ( $(settings.goToTopBtn.topOfPageId).is_on_screen() ) $(settings.goToTopBtn.btnId).hide();
        else $(settings.goToTopBtn.btnId).show();
    }
    
    // if the header is not fixed, - $(settings.headerAboveContent.headerID).height() - settings.headerAboveContent.offsetWhenScroll can be removed
    function goToTarget() {
        $([document.documentElement, document.body]).animate({
            scrollTop: $(settings.goToTopBtn.topOfPageId).offset().top - $(settings.headerAboveContent.headerID).height() - settings.headerAboveContent.offsetWhenScroll
        }, 100);
    }

    $(document).on('click', settings.goToTopBtn.btnId, function() {goToTarget();});
    $(window).on('scroll', () =>{hideWhenNotNeeded();});
}        

window.clearTheUrl = () => {
    $(window).on('scroll', function() {
        hash = window.location.hash;
        if(hash) {
            // remove the hash and keep everything else
            history.replaceState({}, document.title, location.pathname + location.search);
            setTimeout (() =>
                $([document.documentElement, document.body]).animate({
                    scrollTop: $(`${hash}`).offset().top - $(settings.headerAboveContent.headerID).height() - settings.headerAboveContent.offsetWhenScroll
                }, 100), 
            0);

        }
    });

    $(window).on('load', function() {
        hash = window.location.hash;
        if(hash) {
            history.replaceState({}, document.title, location.pathname + location.search);

            setTimeout (() =>
                $([document.documentElement, document.body]).animate({
                    scrollTop: $(`${hash}`).offset().top - $(settings.headerAboveContent.headerID).height() - settings.headerAboveContent.offsetWhenScroll
                }, 100), 
            0);
        }
    });
}

const handleTocActiveElementsOnScroll = () => {
    getElementInHotZone(
        ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],

        {
            top: $(settings.headerAboveContent.headerID).height() + settings.headerAboveContent.offsetWhenScroll, 
            bottom: $(window).scrollTop() + $(window).height()
        }, 

        function(result) {
            if (result) {
                $(settings.pageToc.tocItemLink).removeClass(settings.pageToc.tocItemLinkClass.light).removeClass(settings.pageToc.tocItemLinkClass.dark);
                $(settings.pageToc.tocItemLink).each( function() {
                    if ($(this).attr('href') === `#${result.attr('id')}`) {
                        theme = Cookies.get(settings.themeSwitch.cookie);
                        if (theme === 'undefined' || theme === '0' ) { 
                            $(this).addClass(settings.pageToc.tocItemLinkClass.light); 
                        }
                        else { 
                            $(this).addClass(settings.pageToc.tocItemLinkClass.dark);
                        }
                    }
                });
            }
        }
        
    );
}

// legacy, but needed
const addTopOfPage = () => {
    $('.main-content-wrap').prepend('<div id ="ihs_top_of_page"></div>');
}