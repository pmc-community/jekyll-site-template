/* SOME IMPORTANT STUFF THAT MUST BE OUTSIDE ANY FUNCTION */
// take care of fixed header when scrolling to target, if the case
$(window).on('scroll', () => {

    // handle fixed header scroll
    var hash = window.location.hash;
    if (hash) {
        // if the header is not fixed, - $('#main-header').height() - 20 can be removed
        $([document.documentElement, document.body]).animate({
            scrollTop: $(hash).offset().top - $('#main-header').height() - 20
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
    hidePageTOConHome();
    setFullPageToc();
    handleTocOnWindowsResize();
    handleTocDuplicates();  
    addSwitchThemeIcon();
    $(document).ready(() => {
        removeChildrenExceptFirst ('#toc'); // for some reason, toc is multiplied in firefox, edge, opera and safari, so we remove duplicates
        $('body').css('visibility','visible');
    });
}

/* HERE ARE THE FUNCTIONS */

const addExtraPaddingToContentArea = () => {
    $('.main-content main').addClass('px-5');
}

const addSwitchThemeIcon = () => {
    $(window).on('load', () => {
        $('.aux-nav-list').prepend('<img id="themeSwitcher" class="themeSwitcher mx-2" src="/assets/img/icon-dark-mode-100.png" />');

        $('#themeSwitcher').on('click', () => {
            console.log('here');
            let themeCookie = Cookies.get('JTDThemeCookie');
            if (typeof themeCookie === 'undefined') Cookies.set('JTDThemeCookie',0);
            themeCookie = Cookies.get('JTDThemeCookie');
            if (themeCookie === '0' ) Cookies.set('JTDThemeCookie',1);
            else Cookies.set('JTDThemeCookie',0);
            setTheTheme();
            themeCookie = Cookies.get('JTDThemeCookie');
            if (themeCookie === '0' ) applyColorSchemaCorrections('light');
            else applyColorSchemaCorrections('dark');;

        });

    });
    
}

const applyColorSchemaCorrections = (theme) => {

    // jtd forgets to change some colors when switching from light to dark and back
    // the following colors are valid only for the default dark and light schemas
    if (theme === 'light' ) {
        $('body').css('background','#fff');
        $('body, p, ul li, ol li, li a').css('color', '#000');
    }
    else {
        $('body').css('background','#27262b');
        $('body, p, ul li, ol li, li a').css('color', '#fff');
    }
}

const setTheTheme = () => {
    let themeCookie = Cookies.get('JTDThemeCookie');
    if (typeof themeCookie === 'undefined') Cookies.set('JTDThemeCookie',0);
    themeCookie = Cookies.get('JTDThemeCookie');
    if (Cookies.get('JTDThemeCookie') === '0' ) { 
        jtd.setTheme('light'); 
        applyColorSchemaCorrections('light'); 
    }
    else { 
        jtd.setTheme('dark'); 
        applyColorSchemaCorrections('dark'); 
    }

}

const hashFromString = (string) => {
    const regex = /#(.*)/;
    const match = string.match(regex);
    const hash = match ? match[1] : null;
    return hash;
}

const handleTocDuplicates = () => {
    
    const tocLoaderHandler = () => {
        Toc.init({$nav: $("#toc")});

        let tocKeys = [];
        let tocElements = [];
        let tocElementsDuplicates = [];
        let duplicates = [];
        $('#toc li a').each(function() {
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
        
        const themeCookie = Cookies.get('JTDThemeCookie');
        if (themeCookie === '0' ) applyColorSchemaCorrections('light');
        else applyColorSchemaCorrections('dark');
        
        $('#toc_container').show();
    }

    document.addEventListener('page_toc_loaded', tocLoaderHandler);
}

const arrayDuplicates = (arr) => {
    const counts = _.countBy(arr);
    const duplicates = _.pickBy(counts, count => count > 1);
    const duplicateValues = _.keys(duplicates);
    return duplicateValues;
}

const handleTocOnWindowsResize = () => {
    $(window).sizeChanged(() => {
        $('#toc_container').css('top', $('#main-header').height()+25 + 'px').css('left', $('.main-content').width() + $('.side-bar').width() +100 + 'px');
    });
}

const setFullPageToc = () => {
    $(window).on('load', () => {
        initPageToc();
    });
}

const initPageToc = () => {
    $('#toc').empty();
    //$('#toc').remove();
    //$('#toc_container').append('<nav id="toc" data-toggle="toc"><ul class="nav navbar-nav">');
    //Toc.init({$nav: $("#toc")});
    $('#nav[data-toggle=toc] .nav-link.active+ul').css('font-family','poppins');
    $('#toc_container').css('top', $('#main-header').height()+25 + 'px').css('left', $('.main-content').width() + $('.side-bar').width() +100 + 'px');
    $('#toc li a').addClass('fw-normal text-black');
    document.dispatchEvent(new CustomEvent('page_toc_loaded'));
}

const hidePageTOConHome = () => {
    $(window).on('load', () => {
        const rootUrl = window.location.origin + '/';
    const crtPage = window.location.href;
    if (rootUrl === crtPage) $('#page_toc').hide();
    });
}

const fullContentAreaOnHome = () => {
    const rootUrl = window.location.origin + '/';
    const crtPage = window.location.href;
    console.log(`o=${rootUrl} c=${crtPage}`)
    if (rootUrl === crtPage) $('.main-content-wrap').css('width','100%');
}

const formatAuxLinksBtns =() => {
    $('.aux-nav-list-item').addClass('btn btn-danger btn-sm m-2');
    $('.aux-nav-list-item:first-child a').addClass('text-light');
    $('.aux-nav-list-item:last-child').removeClass('btn-danger').addClass('btn-warning');
    $('.aux-nav-list-item:last-child a').addClass('text-dark');
}

const setGoToTopBtn = () => {
    $('.main').append('<div id="ihs_go_to_top_btn"><img src="/assets/img/goToTop.png" loading="lazy" alt="tick-circle"></div>');
    hideWhenNotNeeded();

    // should be declared as function, arrow function wont work
    function hideWhenNotNeeded() {
        if ( $('#ihs_top_of_page').is_on_screen() ) $('#ihs_go_to_top_btn').hide();
        else $('#ihs_go_to_top_btn').show();
    }
    
    // if the header is not fixed, - $('#main-header').height() - 20 can be removed
    function goToTarget() {
        $([document.documentElement, document.body]).animate({
            scrollTop: $("#ihs_top_of_page").offset().top - $('#main-header').height() - 20
        }, 100);
    }

    $('#ihs_go_to_top_btn').click(() => {goToTarget();});
    $(window).on('scroll', () =>{hideWhenNotNeeded();});
}        

const addTopOfPage = () => {
    $('.main-content-wrap').prepend('<div id ="ihs_top_of_page"></div>');
}
const customiseFooter = () => {
    $('.site-footer').prepend('<div class="footer_first_row"><a href="https://innohub.space/eng/terms-of-service/" target=_blank>Terms</a> | <a href="https://innohub.space/eng/privacy/" target=_blank>Privacy</a> | <a href="https://innohub.space/eng/cookie-policy/" target=_blank>Cookies</a></div>');
    $('.site-footer').prepend(`<div class="footer_first_row">Copyright ${new Date().getFullYear()}, <a href="https://pmc-expert.com" target=_blank>PMC</a></div>`);
}

const addLogo = () => {
    $('.site-header').prepend('<a href="/"><img class = "site_logo" src="/assets/img/logo.png" /></a>');
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

  