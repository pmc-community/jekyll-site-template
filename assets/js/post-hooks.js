// hooks can be any function that was not yet executed at the moment when this script is loaded
// it works both with functions already defined in the global scope (window.func = () => {...})
// or with functions that are not in the global scope, but defined in the classical way, not as arrow functions
// these are useful when needed to extend the functionality of functions that are executed based on user action (e.g. click on buttons)
// these can use any asset, function, object and accessible variable of the site

postHooksActions = {

    addNoteAction: (functionName, result, args, ...extraArgs) => {
        const userToken = Cookies.get(settings.user.userTokenCookie);
        gtmObject = {
            'userToken': userToken,
            'event': 'Add_Custom_Note' 
        };
        fireGTMTag(gtmObject);
    },

    addTagAction: (functionName, result, args, ...extraArgs) => {
        const userToken = Cookies.get(settings.user.userTokenCookie);
        gtmObject = {
            'userToken': userToken,
            'event': 'Add_Custom_Tag' 
        };
        fireGTMTag(gtmObject);
    },
    addCatAction: (functionName, result, args, ...extraArgs) => {
        const userToken = Cookies.get(settings.user.userTokenCookie);
        gtmObject = {
            'userToken': userToken,
            'event': 'Add_Custom_Cat' 
        };
        fireGTMTag(gtmObject);
    },
    savedItemsToJsonAction: (functionName, result, args) => {
        nrLog(
            'savedItems to JSON', 
            'savedItems saved to JSON', 
            'info', 
            {
                functionName: functionName,
                result: result,
                args: args
            }
        );
    },
    savedItemsFromJsonAction: (functionName, result, args, ...extraArgs) => {
        nrLog(
            'savedItems from JSON', 
            'savedItems loaded from JSON', 
            'info', 
            {
                functionName: functionName,
                result: result,
                args: args, 
                argsExtra: extraArgs, 
            }
        );
    }

}

hooks.addAction('addNote', globUtils.bindArgsAtEnd(postHooksActions.addNoteAction, []), 0, 'post'); // hook by function name
hooks.addAction('addTag', globUtils.bindArgsAtEnd(postHooksActions.addTagAction, []), 0, 'post');
hooks.addAction('addCat', globUtils.bindArgsAtEnd(postHooksActions.addCatAction, []), 0, 'post');
hooks.addAction('saveLocalStorageKeyAsJsonFile', postHooksActions.savedItemsToJsonAction, 0, 'post');
hooks.addAction('loadLocalStorageKeyFromJsonFile', globUtils.bindArgsAtEnd(postHooksActions.savedItemsFromJsonAction, [{ autoSaveBeforeLoad: settings.savedItems.autoSaveBeforeLoad }]), 0, 'post');

// the following hooks are tests, may be removed later
hooks.addActionEX(deleteNote, (functionName, result, args) => { 
    console.log(`sample post-hook by object after: ${functionName} on ${$('page-data-permalink').text()}`) 
}, 0, 'post'); // hook by function object

hooks.addAction('addCat', (functionName, result, args) => { 
    console.log(`sample post-hook after: ${functionName} on ${$('page-data-permalink').text()}`) 
},4, 'post');

hooks.addAction('addCat', (functionName, result, args) => { 
    console.log(`sample post-hook after: ${functionName} on ${$('page-data-permalink').text()} higher priority`) 
},3, 'post');

hooks.addAction('createAutoSummaryPageContainer', (functionName, result, args) => { 
    console.log(`sample post-hook after nested function: ${functionName} on ${$('page-data-permalink').text()}`);

    nrLog(
        'created createAutoSummaryPageContainer', 
        'created createAutoSummaryPageContainer', 
        'info', 
        {
            functionName: functionName,
            result: result,
            args: args
        }
    );
}, 0, 'post'); // nested function but not used as dynamic handler; hook by function object is not possible for nested functions
