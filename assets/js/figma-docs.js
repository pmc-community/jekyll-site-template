/* SOME IMPORTANT STUFF THAT MUST BE OUTSIDE ANY FUNCTION */
// take care of fixed header when scrolling to target, if the case
// this has to be here, orherwise the hash will be removed before handling the fixed header
$(window).on('scroll', () => {

    // handle fixed header scroll
    const hash = window.location.hash;
    if (hash) {
        // if the header is not fixed, 
        // -$(settings.headerAboveContent.headerID).height() - settings.headerAboveContent.offsetWhenScroll 
        // can be removed
        $([document.documentElement, document.body]).animate({
            scrollTop: $(hash).offset().top - $(settings.headerAboveContent.headerID).height() - settings.headerAboveContent.offsetWhenScroll
        }, 0);
    }
})

/* LET'S DO SOME WORK */
const customiseTheme = () => {
    $('body').css('visibility','hidden'); // to avoid the fast display of unstyled page before styles are loaded and applied
    setTheTheme();
    addExtraPaddingToContentArea();
    addTopOfPage ();
    clearTheUrl();
    customiseFooter();
    addLogo();
    setGoToTopBtn();
    formatAuxLinksBtns();
    fullContentAreaOnHome();
    hidePageTOCOnHome();
    hidePageTOCOnPage()
    hideFeedbackFormOnHome();
    setFullPageToc();
    handleTocOnWindowsResize();
    handleTocDuplicates();  
    addSwitchThemeIcon();
    advRestoreCodeBlocksStyle();
    handleBtnClose(); //from utilities
    handleTocActiveElementsOnScroll();
    $(document).ready(() => {
        
        if ($(`#${settings.marker404}`).length > 0) $(settings.pageToc.tocContainer).remove();
        else {
            // last checks on page toc
            if($(`${settings.pageToc.toc} ul`).children('li').length >0)
                // for some reason, toc is multiplied in firefox, edge, opera and safari, so we remove duplicates
                removeChildrenExceptFirst (settings.pageToc.toc); 
            else 
                // no need to have page toc on screen if there is nothing to see there
                $(settings.pageToc.tocContainer).hide();

            // remove some elements
            removeUselessElements();
        }
         // necessary on mobile for datadatbles cells
        applyColorSchemaCorrectionsOnTD();

        // just to mask the flicker a little, but a preloader should be here
        setTimeout( () => {
            $('body').css('visibility','visible');
        }, settings.colSchemaCorrections.hideBodyUntilLoadTimeout);
                
    });
}

/* HERE ARE THE FUNCTIONS */
const removeUselessElements = () => {
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

const addExtraPaddingToContentArea = () => {
    $(settings.layouts.contentArea.contentContainer).addClass(settings.layouts.contentArea.desktop.padding);
}

const addSwitchThemeIcon = () => {
    $(window).on('load', () => {
        if (settings.themeSwitch.append) $(settings.themeSwitch.btnContainer).append(settings.themeSwitch.btnContent);
        else $(settings.themeSwitch.btnContainer).prepend(settings.themeSwitch.btnContent);

        $(settings.themeSwitch.btnId).on('click', () => {
            $('body').css('visibility','hidden');
            let themeCookie = Cookies.get(settings.themeSwitch.cookie);
            if (typeof themeCookie === 'undefined') Cookies.set(settings.themeSwitch.cookie,0, { expires:365 , secure: true, sameSite: 'strict' });
            themeCookie = Cookies.get(settings.themeSwitch.cookie);
            if (themeCookie === '0' ) Cookies.set(settings.themeSwitch.cookie,1, { expires:365 , secure: true, sameSite: 'strict' });
            else Cookies.set(settings.themeSwitch.cookie,0, { expires:365 , secure: true, sameSite: 'strict' });
            setTheTheme();
            themeCookie = Cookies.get(settings.themeSwitch.cookie);
            if (themeCookie === '0' ) applyColorSchemaCorrections('light');
            else applyColorSchemaCorrections('dark');;
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
    if (typeof themeCookie === 'undefined') Cookies.set(settings.themeSwitch.cookie,0, { expires:365 , secure: true, sameSite: 'strict' });
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
        )
        .css(
            'left', 
            $(settings.pageToc.desktop.referenceContainer).width() + $(settings.pageToc.desktop.leftSideBar).width() + settings.pageToc.desktop.offsetFromReferenceContainer + 'px'
        );
    $(`${settings.pageToc.toc} li a`).addClass('fw-normal text-black');
    document.dispatchEvent(new CustomEvent(settings.pageToc.tocLoadedEvent));
}

const hidePageTOCOnHome = () => {
    $(window).on('load', () => {
        const rootUrl = window.location.origin + '/';
        const crtPage = window.location.href;
        if (rootUrl === crtPage) $(settings.pageToc.tocContainer).hide();
    });
}

const hidePageTOCOn404 = () => {
    $(window).on('load', () => {
        $(settings.pageToc.tocContainer).remove();
        $(settings.layouts.contentArea.mainContainer).css('width','100%')
    })   
}

const hidePageTOCOnPage = () => {
    const urlIncludesItem = (url, items) => {
        for (let item of items) {
            if (url.includes(item)) {
                return true; 
            }
        }
        return false;
    }
    const page = window.location.href;
    if ( urlIncludesItem(page, settings.pageToc.pagesWithoutToc) ) {
        $(settings.pageToc.tocContainer).remove();
        $(settings.layouts.contentArea.mainContainer).css('width','100%')
    }
}

const hideFeedbackFormOnHome = () => {
   $(window).on('load', () => {
        const rootUrl = window.location.origin + '/';
        const crtPage = window.location.href;
        if (rootUrl !== crtPage) $('#docFeedbackForm').show();
    });
}

const fullContentAreaOnHome = () => {
    const rootUrl = window.location.origin + '/';
    const crtPage = window.location.href;
    if (rootUrl === crtPage) $(settings.layouts.contentArea.mainContainer).css('width', settings.layouts.contentArea.desktop.widthOnHome);
}

const formatAuxLinksBtns =() => {
    //  no need to use site vars here since the selectors cannot be changed, being set by JTD theme
    $('.aux-nav-list-item').removeClass('btn btn-danger btn-warning btn-sm m-2').addClass('align-items-center d-flex');
    $('.aux-nav-list-item a').removeClass('site-button');
    $('.aux-nav-list-item:first-child a').addClass('btn btn-danger m-2 text-light');
    $('.aux-nav-list-item:last-child a').addClass('btn btn-warning m-2 text-dark');
}

const setGoToTopBtn = () => {
    $(settings.goToTopBtn.btnContainer).append(settings.goToTopBtn.content);
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

    $(settings.goToTopBtn.btnId).click(() => {goToTarget();});
    $(window).on('scroll', () =>{hideWhenNotNeeded();});
}        

const addTopOfPage = () => {
    $(settings.goToTopBtn.topOfPageContainer).prepend(settings.goToTopBtn.topOfPageMarker);
}

const customiseFooter = () => {
    $(settings.siteFooter.container).html('');

    settings.siteFooter.rows.forEach(row => {
        $(settings.siteFooter.container).prepend(row.content); 
    });
}

const addLogo = () => {
    $(settings.headerAboveSideBar.container).prepend(settings.headerAboveSideBar.logo);
}

const clearTheUrl = () => {
    $(window).on('scroll', function() {
        if(window.location.hash) {
            // remove the hash and keep everything else
            history.replaceState({}, document.title, location.pathname + location.search);
        }
    });

    $(window).on('load', function() {
        if(window.location.hash) {
            // remove the hash and keep everything else
            history.replaceState({}, document.title, location.pathname + location.search);
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