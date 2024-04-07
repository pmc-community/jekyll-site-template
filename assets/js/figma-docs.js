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

$(function () {
    var navSelector = "#toc";
    var $myNav = $(navSelector);
    Toc.init($myNav);
    $("body").scrollspy({
      target: navSelector,
    });
  });

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
}

/* HERE ARE THE FUNCTIONS */
const hashFromString = (string) => {
    const regex = /#(.*)/;
    const match = string.match(regex);
    const hash = match ? match[1] : null;
    return hash;
}

const handleTocDuplicates = () => {

    $(document).ready( () => {
        document.addEventListener('page_toc_loaded', tocLoaderHandler);
    });
    
    const tocLoaderHandler = () => {
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
    }
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
    })
}

const initPageToc = () => {
    $('#toc').empty();
    Toc.init({
        $nav: $("#toc"),
    });
    $('#nav[data-toggle=toc] .nav-link.active+ul').css('font-family','poppins');
    $('#toc_container').css('top', $('#main-header').height()+25 + 'px').css('left', $('.main-content').width() + $('.side-bar').width() +100 + 'px');
    $('#toc li a').addClass('fw-normal text-black');
    //$('#toc li').addClass('py-1');
    //$('#toc li a').addClass('active border-0');
    $('#toc_container').show();
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

  