const setRemoveFromSavedItemsStatus = () => {
    $('button[siteFunction="tagPageItemRemoveFromSavedItems"]').each( function() {
        const pageToSave = {
            permalink: $(this).attr('pageRefPermalink'),
            title: $(this).attr('pageRefTitle')
        }
        const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];        
        if (!findObjectInArray(pageToSave, savedItems)) $(this).addClass('disabled');
        else $(this).removeClass('disabled')
    });
}

const setRemoveFromSavedItems = () => {
    $('button[siteFunction="tagPageItemRemoveFromSavedItems"]').click(function() {
        const pageToSave = {
            permalink: $(this).attr('pageRefPermalink'),
            title: $(this).attr('pageRefTitle')
        }
        const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];

        foundIndex = objectIndexInArray(pageToSave, savedItems);
        if ( foundIndex !== -1) {
            const newData = _.without(savedItems, savedItems[foundIndex]);
            localStorage.setItem('savedItems', JSON.stringify(newData));
            setSaveForLaterReadStatus();
            setRemoveFromSavedItemsStatus();
        }
    });
}

const setSaveForLaterReadStatus = () => {
    $('button[siteFunction="tagPageItemSaveForLaterRead"]').each( function() {
        const pageToSave = {
            permalink: $(this).attr('pageRefPermalink'),
            title: $(this).attr('pageRefTitle')
        }
        const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];

        if (findObjectInArray(pageToSave, savedItems)) $(this).addClass('disabled');
        else $(this).removeClass('disabled')
    });
}

const setSaveForLaterRead = () => {
    
    $('button[siteFunction="tagPageItemSaveForLaterRead"]').click(function() {
        const pageToSave = {
            permalink: sanitizeURL($(this).attr('pageRefPermalink')),
            title: DOMPurify.sanitize($(this).attr('pageRefTitle')),
            customTags: [],
            customCategories: [],
            customSummary:''
        }
        const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];

        if (!findObjectInArray(pageToSave, savedItems)) {
            savedItems.push(pageToSave);
            localStorage.setItem('savedItems', JSON.stringify(savedItems));
            setSaveForLaterReadStatus();
            setRemoveFromSavedItemsStatus();
        }
    });
}
