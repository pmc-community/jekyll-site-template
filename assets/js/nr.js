async function getIP(timeoutMs = 3000) {
  const controllers = [];
  const timeout = new Promise((_, reject) => {
    const controller = new AbortController();
    controllers.push(controller);
    setTimeout(() => {
      controller.abort();
      reject(new Error("Request timed out"));
    }, timeoutMs);
  });

  const fetchIP = async (url) => {
    const response = await fetch(url, { signal: controllers[0].signal });
    const data = await response.json();
    return data.ip;
  };

  const sources = [
    'https://api.ipify.org?format=json',
    'https://ipinfo.io/json',
    'https://ifconfig.me/all.json',
  ];

  for (const src of sources) {
    try {
      return await Promise.race([fetchIP(src), timeout]);
    } catch (err) {
      console.error(`Failed to fetch IP from ${src}: ${err.message}`);
    }
  }

  return '0.0.0.0'; // fallback if all fail
}
let userIP = '0.0.0.0';

// init userIP global
(async () => {
  userIP = await getIP();
})();

// logLevel must be one of: debug | error | info | trace | warn
const nrLog = (logMessage, logAction, logLevel = null, funcData) => {
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
            userIP: userIP,
            envInfo: !preFlight ? {} : !preFlight.envInfo ? {} : preFlight.envInfo,
        }
        
        newrelic.log(logMessage, {level: logLevel, customAttributes: logCustomAttributes});
    }
}