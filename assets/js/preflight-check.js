// we should assume that no script is loaded
// so, no jQuery or something else

preFlight = {

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
    get skyClear() { return this.clearance.goodToGo }
}

// LET'S START
console.log(preFlight.deviceInfo);
console.log(`${preFlight.browser.browserName} ${preFlight.browser.fullVersion} `);

document.addEventListener('DOMContentLoaded', function() {
    if (!preFlight.clearance.goodToGo) {
        const errDiv = document.createElement('div');
        const errText = document.createElement('h2');
        errText.textContent = preFlight.clearance.errText;
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
    
        document.body.style.visibility = 'visible';
    }
    
});
