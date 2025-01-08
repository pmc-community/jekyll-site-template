// hooks can be any function that is executed from document.ready event until the page is fully loaded
// functions must be defined in the global scope (window.func = (...) => {...})
// functions must be called inside a $(document).ready(function() {.....}) block
// functions must be not defined as props of some objects to be instantiated during loading
// because "hook by function object" is not available since the objects doesn't exist yet

// these are usefull to hook into the process of loading the page, after document.ready event and before page fully loaded
// these cannot use assets, functions, objects, only superglobals and globals are visible here
// these will not capture hooks triggered by <script> tags or triggered outside $(document).ready(function() {.....}) blocks

// HEADS UP!!!
// this version supports functions and nested functions defined inside functions
// this version does not support DOM events handlers and variable assigned functions

// HEADS UP!!!
// HOOK ACTIONS CAN BE PLACED IN ANY JS SCRIPT FILE, BUT SHOULD:
// 1. BE PLACED AT THE START OF THE FILE, BEFORE ANYTHING ELSE IS EXECUTED (OTHRWISE WILL EB REMOVED WHEN THE PAGE IS CHANGED)
// 2. TO BE SURE THAT THE HOOK FUNCTION WILL BE EXECUTED ADTER PLACING AN ACTION FOR IT
// 3. IT IS RECOMMENDED TO PLACE THE ACTIONS IN THEIR DEDICATED FILES,DEPENDING ON THEIR PURPOSE 
//  - pre-hooks.js: BEST FOR HOOKS TRIGGERED FROM document.ready EVENT UNTIL THE PAGE IS FULLY LOADED - SOME RESTRICTIONS FOR USING ASSETS
//  - post-hooks.js: BEST FOR HOOKS TRIGGERED BY USER ACTIONS (CLICK ON BUTTONS, ETC.) - NO RESTRICTIONS FOR USING ASSETS
//  -  _includes/siteIncludes/partials/init-hooks.html): BEST FOR HOOKS TRIGGRED BY <script> TAGS AND OUTSIDE document.ready BLOCKS: - CANNOT USE ANY ASSETS NOT EVEN INIT VARS INSERTED BY JEKYLL DURING THE BUILD PROCESS

// HEADS UP!!!
// IT DOESN'T MATTER WHERE A HOOK ACTION IS PLACED/REGISTERED, IT WILL BE EXECUTED AFTER ITS HOOK EXECUTION, IN THE ORDER OF IT'S
// DEFINED PRIORITY. IF PRIORITY IS NOT PROVIDED AR REGISTRATION TIME, WILL BE EQUAL TO 0 (HIGHEST).
// SAME PRIORITIES WILL BE EXECUTED IN THE ORDER OF REGISTRATION 


hooks.addAction('removeUselessElements', (functionName, result, args) => { 
    console.log(`sample pre-hook after: ${functionName} on ${$('page-data-permalink').text()}`) 
}, 5, 'pre');

hooks.addAction('removeUselessElements', (functionName, result, args) => { 
    console.log(`sample pre-hook after: ${functionName} on ${$('page-data-permalink').text()} higher priority`) 
}, 4, 'pre');

hooks.addAction('setPageButtonsFunctions', (functionName, result, args) => { 
    console.log(`sample pre-hook after: ${functionName} on ${$('page-data-permalink').text()}`) 
}, 1, 'pre');

hooks.addAction('addCat', (functionName, result, args) => { 
    console.log(`sample pre-hook after: ${functionName} on ${$('page-data-permalink').text()} lower priority`) 
},7, 'pre');
