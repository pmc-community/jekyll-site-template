const getIP = async() => {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  }


// logLevel must be one of: debug | error | info | trace | warn
const nrLog = async (logMessage, logAction, logLevel = null, funcData) => {
    if (nrSettings.newRelicEnabled === 'true') {
        if (!logLevel) logLevel = 'info';
                
        logCustomAttributes = {
            source: settings.siteTitle,
            permalink: $('page-data-permalink').text() ? $('page-data-permalink').text() : '/',
            datetime: getFullCurrentDateTime(),
            action:logAction,
            function: funcData.functionName,
            args: funcData.args ? funcData.args : [],
            argsExtra: funcData.argsExtra ? funcData.argsExtra : [],
            result: funcData.result ? funcData.result : `func ${funcData.functionName} doesn\'t return anything`,
            user: Cookies.get(settings.user.userTokenCookie),
            userIP: await getIP(),
            envInfo: !preFlight ? {} : !preFlight.envInfo ? {} : preFlight.envInfo,
        }
        
        newrelic.log(logMessage, {level: logLevel, customAttributes: logCustomAttributes});
    }
}