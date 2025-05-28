// we should assume that no script is loaded
// so, no jQuery or something else until sky is clear

preFlight = {

    removeLangCodeFromPath: (path, langCode) => {
        if (langCode === '') return path;
        else {
            const segments = path.split('/').filter(Boolean);
            const lastSegment = segments.length > 0 ? `${segments[segments.length - 1]}` : '/';
            return lastSegment;
        }
    },

    formatPath: (path) => {
        const basePath = path.replace(/^\/|\/$/g, '');

        const noSlash = basePath;              // 'path'
        const leadingSlash = `/${basePath}`;   // '/path'
        const trailingSlash = `${basePath}/`;  // 'path/'
        const bothSlash = `/${basePath}/`;     // '/path/'

        const variants = [noSlash, leadingSlash, trailingSlash, bothSlash];

        const uniqueVariants = [...new Set(variants)]
            .filter(variant => variant !== '' && !variant.includes('//'));

        return uniqueVariants;
    },

    getPageSettings: (permalinkOptions, allPagesSettings) => {
        function intersectArrays(arr1, arr2) {
            const set2 = new Set(arr2);           
            return arr1.filter(item => set2.has(item));
        }

        const permalinks = Object.keys(allPagesSettings);
        const pagePermalink = intersectArrays(permalinkOptions, permalinks);
        if (pagePermalink.length !== 1) return false;
        else return allPagesSettings[pagePermalink[0]];

    },

    getDeviceTypeAndOrientation: () => {

        const getScreenOrientation = () => {
            return window.matchMedia("(orientation: portrait)").matches ? 'portrait' : 'landscape';
        };
        
        const userAgent = navigator.userAgent.toLowerCase();
    
        // Determine if the user agent indicates a mobile device
        const isMobile = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        
        // Determine if the user agent indicates a tablet
        const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/i.test(userAgent);
        
        // Exclude desktops with touch screens (e.g., some Surface devices)
        const isDesktopTouchScreen = /windows nt 10.0;.*touch/i.test(userAgent);
        
        if (isTablet && isDesktopTouchScreen) {
            return {
                deviceType: 'desktop',
                orientation: getScreenOrientation(),
            };
        }
    
        // Consider viewport width and match media queries for a more reliable detection
        const viewportWidth = window.innerWidth;
        const isMediaQueryMobileOrTablet = window.matchMedia("(max-width: 768px) and (orientation: portrait), (max-width: 992px) and (orientation: landscape)").matches;
        
        const deviceType = isMobile
            ? 'mobile'
            : isTablet || (isMediaQueryMobileOrTablet && viewportWidth <= 992)
            ? 'tablet'
            : 'desktop';

        return {
            deviceType: deviceType,
            orientation: getScreenOrientation(),
        };
    },

    getBrowserInfo: () => {
        const userAgent = navigator.userAgent;
        let browserName, fullVersion;

        if (userAgent.indexOf('Firefox') > -1) {
            browserName = 'Mozilla Firefox';
            fullVersion = userAgent.substring(userAgent.indexOf('Firefox/') + 8);
        } else if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) {
            browserName = 'Opera';
            fullVersion = userAgent.substring(userAgent.indexOf('OPR/') + 4);
        } else if (userAgent.indexOf('Edg') > -1) {
            browserName = 'Microsoft Edge';
            fullVersion = userAgent.substring(userAgent.indexOf('Edg/') + 4);
        } else if (userAgent.indexOf('Chrome') > -1) {
            browserName = 'Google Chrome';
            fullVersion = userAgent.substring(userAgent.indexOf('Chrome/') + 7);
        } else if (userAgent.indexOf('Safari') > -1) {
            browserName = 'Safari';
            fullVersion = userAgent.substring(userAgent.indexOf('Version/') + 8);
        } else if (userAgent.indexOf('MSIE') > -1 || !!document.documentMode == true) {
            browserName = 'Internet Explorer';
            fullVersion = userAgent.substring(userAgent.indexOf('MSIE') + 5);
        } else {
            browserName = 'Unknown';
            fullVersion = 'Unknown';
        }

        return {
            browserName: browserName,
            fullVersion: fullVersion.split(' ')[0]
        };
    },

    compareVersions: (minVersion, crtVersion) => {
        const minV = minVersion.split('.').map(Number);
        const crtV = crtVersion.split('.').map(Number);

        const len = Math.max(minV.length, crtV.length);

        for (let i = 0; i < len; i++) {
            const num1 = minV[i] || 0;
            const num2 = crtV[i] || 0;

            if (num1 > num2) {
                return 1;  // minVersion is greater
            } else if (num1 < num2) {
                return -1; // crtVersion is greater
            }
        }

        return 0; // versions are equal
    },

    maxNotSupportedBrowsers: [
        {
            name: 'Safari',
            version_desktop: '13.1.2',
            version_mobile: '',
            version_tablet: ''
        },
        {
            name: 'Google Chrome',
            version_desktop: '115.0.0.9999',
            version_mobile: '',
            version_tablet: ''
        },
        {
            name: 'Postman',
            version_desktop: '',
            version_mobile: '',
            version_tablet: ''
        }
    ],

    checkBrowser: (browser, deviceInfo) => {
        if (browser.browserName === 'Internet Explorer') return false;
        if (browser.browserName === 'Postman') return false;

        let result = true;
        let minVersion = '';

        preFlight.maxNotSupportedBrowsers.forEach(br => {
            if (br.name === browser.browserName) {
                switch (deviceInfo.deviceType) {
                    case 'desktop':
                        minVersion = br.version_desktop;
                        break;
                    case 'mobile':
                        minVersion = br.version_mobile;
                        break;
                    case 'tablet':
                        minVersion = br.version_tablet;
                        break;
                }
                if (minVersion !=='' && preFlight.compareVersions(minVersion, browser.fullVersion) !== -1) result = false;
            }
        });

        return result;
    },

    get deviceInfo() { return this.getDeviceTypeAndOrientation()},
    get browser() { return this.getBrowserInfo() },
    get envInfo() { 
        return { 
            device: preFlight.deviceInfo, 
            browser: preFlight.browser, 
        } 
    },

    clearForTakeOff: (browser, deviceInfo) => {
        const result = {
            goodToGo: true,
            errText: ''
        };

        if (!preFlight.checkBrowser(browser, deviceInfo)) {
            result.goodToGo = false;
            result.errText = `Sorry, this site doesn't work with ${browser.browserName} ${browser.fullVersion} on ${deviceInfo.deviceType}`;
        }

        return result;
    },

    get clearance() { return this.clearForTakeOff(this.browser, this.deviceInfo)},
    get skyClear() { return this.clearance.goodToGo },

    prettyError: (errMessage) => {
        const errDiv = document.createElement('div');
        const errText = document.createElement('h2');
        errText.textContent = errMessage;
        errText.style.width = '100vw';
        errText.style.height = '100vh';
        errText.style.justifyContent = 'center';
        errText.style.alignItems = 'center';
        errText.style.display = 'flex'
        errDiv.appendChild(errText);
        document.body.appendChild(errDiv);
    
        toRemove = document.querySelector('.main');
        toRemove.remove();
        toRemove = document.querySelector('.side-bar');
        toRemove.remove();
    
        document.body.style.visibility = 'visible'; //because body was made invisible in _includes/head_custom.html
    },

    handle404: () => {
        // here we may use jQuery since it should be loaded already if this point is reached
        $(document).ready(function() {
            $('#ihs_go_to_top_btn').remove();
            if (preFlight.envInfo.device.deviceType === 'mobile') $('.site-footer').remove();
            nrLog(
                '404 page not found', 
                'page not found', 
                'error', 
                {
                    functionName: 'handle404',
                }
            );
        });
        
    }

}

// LET'S START
console.log(preFlight.envInfo);

// init superglobals
const settings = allSettings.settings;
const algoliaSettings = allSettings.algoliaSettings;
const hsSettings = allSettings.hsSettings;
const pageList = allSettings.pageList;
const catList = allSettings.catList;
const catDetails = allSettings.catDetails;
const tagList = allSettings.tagList;
const tagDetails = allSettings.tagDetails;
const allPageSettings = allSettings.pageSettings;
const gData = allSettings.gData;
const nrSettings = allSettings.newRelicSettings;
const engLanguage = allSettings.engLanguage;
const dtSettings =  settings.dataTables;
const siteLanguageCode = settings.multilang.siteLanguage === 0 
    ? ''
    : settings.multilang.availableLang[settings.multilang.siteLanguage].lang;

// we use a function to get permalink options
// as permalink extraction from url returns always /permalink/
// and we don't know how permalink are defined in the page front matter
const path = preflight.removeLangCodeFromPath(window.location.pathname,siteLanguageCode);
const permalinkOptions = preFlight.formatPath(path);
const pageSettings = preFlight.getPageSettings(permalinkOptions, allPageSettings);

// init globals
let globCustomCats, globCustomTags;
let globAllCats, globAllTags;
let siteObservers = new Map();
let pageInfo = {}; // used for full page info canvas
let hsForms = [];
let docSearchHitPageToc = [];
window.mainJQuery = jQuery; // exposing jQuery to be able to use it in iFrames

document.addEventListener('DOMContentLoaded', function() {

    if (!preFlight.skyClear) {
        preFlight.prettyError(preFlight.clearance.errText);
    }
    else {
        if (typeof jQuery !== 'undefined' && typeof $ !== 'undefined') {
            const $loading = $(
                `
                    <div id="contentLoading" class="d-flex justify-content-center align-items-center d-none" style="position: fixed; top:0; left:0; width:100vw; height: 100vh">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                `
            );
            // HEADS UP!!!! BODY VISIBILITY IS HIDDEN HERE (from _includes/head_custom.html)
            $('html').append($loading);
            $('#contentLoading').removeClass('d-none');
            $('body').attr('data-instant-intensity', 'viewport').attr('data-instant-vary-accept');
        }
        else {
            console.log(jQuery)
            preFlight.prettyError('Sorry, can\'t move forward, jQuery is not loaded!');
        }
    
    }
});


