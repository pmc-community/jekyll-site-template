const iframeWindow = window;
const iframeDocument = iframeWindow.document;

// make jQuery available in iFrame
const mainJQuery = window.parent.mainJQuery;
iframeWindow.$ = mainJQuery;

// make lodash available in iFrame
const mainLodash = window.parent._;
iframeWindow._ = mainLodash;
