const iframeWindow = window;
const iframeDocument = iframeWindow.document;
const mainJQuery = window.parent.mainJQuery;
iframeWindow.$ = mainJQuery;
iframeWindow.jQuery = mainJQuery;

const mainLodash = window.parent._;
iframeWindow._ = mainLodash;