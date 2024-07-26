const savePageToSavedItems = (pageInfo) => {
    const pageToSave = {
        permalink: sanitizeURL(pageInfo.siteInfo.permalink),
        title: DOMPurify.sanitize(pageInfo.siteInfo.title),
        customTags: [],
        customCategories: [],
        customNotes:[]
    }
    const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];

    if (!findObjectInArray(pageToSave, savedItems)) {
        savedItems.push(pageToSave);
        localStorage.setItem('savedItems', JSON.stringify(savedItems));
    }
    createGlobalLists();
}

const removePageFromSavedItems = (pageInfo) => {
    const pageToRemove = {
        permalink: sanitizeURL(pageInfo.siteInfo.permalink),
        title:DOMPurify.sanitize(pageInfo.siteInfo.title)
    }
    const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];

    foundIndex = objectIndexInArray(pageToRemove, savedItems);
    if ( foundIndex !== -1) {
        const newData = _.without(savedItems, savedItems[foundIndex]);
        localStorage.setItem('savedItems', JSON.stringify(newData));
    }
    createGlobalLists();
}

const getPageSavedInfo = (permalink, title) => {
    const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    const page = {
        permalink: permalink,
        title: title
    }
    return getObjectFromArray(page, savedItems);
}

const getCustomTags = () => {
    let customTags = [];
    const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    if (savedItems.length === 0 ) return customTags;
    else {
        savedItems.forEach( (page) => {
            let pageCustomTags = page.customTags || [];
            customTags = Array.from(new Set([...customTags, ...pageCustomTags].slice().sort()));
        });
    return customTags;
    }
}

const getCustomCats = () => {
    let customCats = [];
    const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    if (savedItems.length === 0 ) return customCats;
    else {
        savedItems.forEach( (page) => {
            let pageCustomCats = page.customCategories || [];
            customCats = Array.from(new Set([...customCats, ...pageCustomCats].slice().sort()));
        });
    return customCats;
    }
}

const removeAllCustomNotes = (pageInfo) => {
    const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    if (savedItems.length === 0 ) return;
    const page = {
        permalink: pageInfo.siteInfo.permalink,
        title: pageInfo.siteInfo.title
    };

    const pageIndex = objectIndexInArray(page, savedItems);
    if ( pageIndex === -1 ) return;

    savedPage = getPageSavedInfo(pageInfo.siteInfo.permalink, pageInfo.siteInfo.title);
    savedPage.customNotes = [];
    savedItems[pageIndex] = savedPage;
    localStorage.setItem('savedItems', JSON.stringify(savedItems));
}

const addNote = (note, pageInfo) => {
    const page = {
        permalink: pageInfo.siteInfo.permalink,
        title: pageInfo.siteInfo.title
    };
    const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    if (savedItems.length === 0 ) {
        showToast(`Can\'t add note! There is nothing in saved items...`, 'bg-danger', 'text-light');
        return false;
    }

    const pageIndex = objectIndexInArray(page, savedItems);
    if ( pageIndex === -1 ) {
        showToast(`Can\'t add note! Page ${page.title} not found in saved items...`, 'bg-danger', 'text-light');
        return false;
    }

    if (note.trim() === '') {
        //showToast('Nothing to add, write something ...', 'bg-warning', 'text-dark');
        return false;
    }
    
    const savedPage = savedItems[pageIndex];
    const savedPageCustomNotes = savedPage.customNotes || [];
    const rawSavedPageCustomNotes = _.map(savedPageCustomNotes, obj => ({
        ...obj,
        note: _.trim(obj.note).toLowerCase()
    }));
    
    const noteIndex = objectIndexInArray({note: note.trim().toLowerCase()}, rawSavedPageCustomNotes);
    if (noteIndex !== -1) {
        showToast('Note already saved, no need to save it again!', 'bg-warning', 'text-dark');
        return false;
    }

    const noteObj = {
        date: getCurrentDateTime(),
        note: DOMPurify.sanitize(note.trim()).replace(/<[^>]*>/g, ''),
        id: uuid()
    }
    savedPageCustomNotes.push(noteObj);
    savedPage.customNotes = savedPageCustomNotes;
    savedItems[pageIndex] = savedPage;
    localStorage.setItem('savedItems', JSON.stringify(savedItems));
    return true;

}

const deleteNote = (noteId, pageInfo) => {
    const page = {
        permalink: pageInfo.siteInfo.permalink,
        title: pageInfo.siteInfo.title
    };

    const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    if (savedItems.length === 0 ) {
        showToast('Can\'t delete note! There is nothing in saved items...', 'bg-danger', 'text-light');
        return false;
    }

    const pageIndex = objectIndexInArray(page, savedItems);
    if ( pageIndex === -1 ) {
        showToast('Can\'t delete note! Page not found in saved items...', 'bg-danger', 'text-light');
        return false;
    }

    const savedPage = savedItems[pageIndex];
    const savedPageCustomNotes = savedPage.customNotes || [];

    const noteIndex = objectIndexInArray({id: noteId}, savedPageCustomNotes);
    if (noteIndex !== -1)  _.pullAt(savedPageCustomNotes, noteIndex);

    savedPage.customNotes = savedPageCustomNotes;
    savedItems[pageIndex] = savedPage;
    localStorage.setItem('savedItems', JSON.stringify(savedItems));
    return true;
}

const updateNote = (noteId, note, pageInfo) => {
    const page = {
        permalink: pageInfo.siteInfo.permalink,
        title: pageInfo.siteInfo.title
    };

    const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    if (savedItems.length === 0 ) {
        showToast('Can\'t update note! There is nothing in saved items...', 'bg-danger', 'text-light');
        return false;
    }

    const pageIndex = objectIndexInArray(page, savedItems);
    if ( pageIndex === -1 ) {
        showToast('Can\'t update note! Page not found in saved items...', 'bg-danger', 'text-light');
        return false;
    }

    const savedPage = savedItems[pageIndex];
    const savedPageCustomNotes = savedPage.customNotes || [];
    
    const noteIndex = objectIndexInArray({id: noteId}, savedPageCustomNotes);
    if (noteIndex === -1) {
        showToast('Can\'t update! Note not found', 'bg-danger', 'text-light');
        return false;
    }

    savedPageCustomNotes[noteIndex].note = note;
    savedPage.customNotes = savedPageCustomNotes;
    savedItems[pageIndex] = savedPage;
    localStorage.setItem('savedItems', JSON.stringify(savedItems));
    return true;
}

const getPageNotes = (pageInfo) => {
    const page = {
        permalink: pageInfo.siteInfo.permalink,
        title: pageInfo.siteInfo.title
    };

    const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    if (savedItems.length === 0 ) return [];

    const pageIndex = objectIndexInArray(page, savedItems);
    if ( pageIndex === -1 ) return [];

    const savedPage = savedItems[pageIndex];
    return savedPage.customNotes || [];
}

const getPageTags = (pageInfo) => {
    const page = {
        permalink: pageInfo.siteInfo.permalink,
        title: pageInfo.siteInfo.title
    };

    const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    if (savedItems.length === 0 ) return [];

    const pageIndex = objectIndexInArray(page, savedItems);
    if ( pageIndex === -1 ) return [];

    const savedPage = savedItems[pageIndex];
    const customTags = savedPage.customTags || [];
    customTags.sort();
    return customTags;
}

const getPageCats = (pageInfo) => {
    const page = {
        permalink: pageInfo.siteInfo.permalink,
        title: pageInfo.siteInfo.title
    };

    const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    if (savedItems.length === 0 ) return [];

    const pageIndex = objectIndexInArray(page, savedItems);
    if ( pageIndex === -1 ) return [];

    const savedPage = savedItems[pageIndex];
    const customCats = savedPage.customCategories || [];
    customCats.sort();
    return customCats;
}

const getTagPages = (tag) => {

    const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    if (savedItems.length === 0 ) return 0;

    let numPages = 0;
    savedItems.forEach(page => {
        let customTags= _.map(page.customTags || [], function(str) {
            return str.toLowerCase();
          });
        if ( customTags.includes(tag.toLowerCase()) ) numPages++;
    });

    return numPages;
}

const getCatPages = (cat) => {

    const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    if (savedItems.length === 0 ) return 0;

    let numPages = 0;
    savedItems.forEach(page => {
        let customCats= _.map(page.customCategories || [], function(str) {
            return str.toLowerCase();
          });
        if ( customCats.includes(cat.toLowerCase()) ) numPages++;
    });

    return numPages;
}

const getArrayOfTagSavedPages= (tag) => {

    const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    if (savedItems.length === 0 ) return [];

    let pagesArray = [];
    savedItems.forEach(page => {
        let customTags= _.map(page.customTags || [], function(str) {
            return str.toLowerCase();
          });
        if ( customTags.includes(tag.toLowerCase()) ) pagesArray.push(page);
    });

    return pagesArray;
}

const getArrayOfCatSavedPages= (cat) => {

    const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    if (savedItems.length === 0 ) return [];

    let pagesArray = [];
    savedItems.forEach(page => {
        let customCats= _.map(page.customCategories || [], function(str) {
            return str.toLowerCase();
          });
        if ( customCats.includes(cat.toLowerCase()) ) pagesArray.push(page);
    });

    return pagesArray;
}

const getPageStatusInSavedItems = (pageInfo) => {
    const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    return findObjectInArray({permalink: pageInfo.siteInfo.permalink, title:pageInfo.siteInfo.title}, savedItems);
}

const addTag = (tag, pageInfo) => {
    const page = {
        permalink: pageInfo.siteInfo.permalink,
        title: pageInfo.siteInfo.title
    };
    const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    if (savedItems.length === 0 ) {
        showToast(`Can\'t add tag! There is nothing in saved items...`, 'bg-danger', 'text-light');
        return false;
    }

    const pageIndex = objectIndexInArray(page, savedItems);
    if ( pageIndex === -1 ) {
        showToast(`Can\'t add tag! Page ${page.title} not found in saved items...`, 'bg-danger', 'text-light');
        return false;
    }

    if (tag.trim() === '') {
        //showToast('Nothing to add, write something ...', 'bg-warning', 'text-dark');
        return false;
    }
    
    const savedPage = savedItems[pageIndex];
    const savedPageCustomTags = savedPage.customTags || [];
    
    const tagIndex =  _.findIndex(savedPageCustomTags, item => item.toLowerCase() === tag.toLowerCase());
    const tagGlobIndex =  _.findIndex(tagList, item => item.toLowerCase() === tag.toLowerCase());
    if (tagGlobIndex !== -1) {
        showToast(`Can\'t add tag ${tag} because this tag is already a site tag!`, 'bg-warning', 'text-dark');
        return false;
    }
    if (tagIndex === -1 && tagGlobIndex === -1) savedPageCustomTags.push(tag);
    savedPage.customTags = savedPageCustomTags.sort();
    savedItems[pageIndex] = savedPage;
    localStorage.setItem('savedItems', JSON.stringify(savedItems));
    return true;

}

const addCat = (cat, pageInfo) => {
    const page = {
        permalink: pageInfo.siteInfo.permalink,
        title: pageInfo.siteInfo.title
    };
    const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    if (savedItems.length === 0 ) {
        showToast(`Can\'t add tag! There is nothing in saved items...`, 'bg-danger', 'text-light');
        return false;
    }

    const pageIndex = objectIndexInArray(page, savedItems);
    if ( pageIndex === -1 ) {
        showToast(`Can\'t add category! Page ${page.title} not found in saved items...`, 'bg-danger', 'text-light');
        return false;
    }

    if (cat.trim() === '') {
        //showToast('Nothing to add, write something ...', 'bg-warning', 'text-dark');
        return false;
    }
    
    const savedPage = savedItems[pageIndex];
    const savedPageCustomCats = savedPage.customCategories || [];
    
    const catIndex =  _.findIndex(savedPageCustomCats, item => item.toLowerCase() === cat.toLowerCase());
    const catGlobIndex =  _.findIndex(catList, item => item.toLowerCase() === cat.toLowerCase());
    if (catGlobIndex !== -1) {
        showToast(`Can\'t add category ${cat} because this category is already a site category!`, 'bg-warning', 'text-dark');
        return false;
    }
    if (catIndex === -1 && catGlobIndex === -1) savedPageCustomCats.push(cat);
    savedPage.customCategories = savedPageCustomCats.sort();
    savedItems[pageIndex] = savedPage;
    localStorage.setItem('savedItems', JSON.stringify(savedItems));
    return true;

}

const deleteTagFromPage = (tag, pageInfo) => {
    const page = {
        permalink: pageInfo.siteInfo.permalink,
        title: pageInfo.siteInfo.title
    };

    const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    if (savedItems.length === 0 ) {
        showToast('Can\'t delete tag! There is nothing in saved items...', 'bg-danger', 'text-light');
        return false;
    }

    const pageIndex = objectIndexInArray(page, savedItems);
    if ( pageIndex === -1 ) {
        showToast('Can\'t delete tag! Page not found in saved items...', 'bg-danger', 'text-light');
        return false;
    }

    const savedPage = savedItems[pageIndex];
    const savedPageCustomTags = savedPage.customTags || [];

    const tagIndex =  _.findIndex(savedPageCustomTags, item => item === tag);
    if (tagIndex !== -1)  _.pullAt(savedPageCustomTags, tagIndex);

    savedPage.customTags = savedPageCustomTags;
    savedItems[pageIndex] = savedPage;
    localStorage.setItem('savedItems', JSON.stringify(savedItems));
    return true;
}

const deleteCatFromPage = (cat, pageInfo) => {
    const page = {
        permalink: pageInfo.siteInfo.permalink,
        title: pageInfo.siteInfo.title
    };

    const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    if (savedItems.length === 0 ) {
        showToast('Can\'t delete category! There is nothing in saved items...', 'bg-danger', 'text-light');
        return false;
    }

    const pageIndex = objectIndexInArray(page, savedItems);
    if ( pageIndex === -1 ) {
        showToast('Can\'t delete category! Page not found in saved items...', 'bg-danger', 'text-light');
        return false;
    }

    const savedPage = savedItems[pageIndex];
    const savedPageCustomCats = savedPage.customCategories || [];

    const catIndex =  _.findIndex(savedPageCustomCats, item => item === cat);
    if (catIndex !== -1)  _.pullAt(savedPageCustomCats, catIndex);

    savedPage.customCategories = savedPageCustomCats;
    savedItems[pageIndex] = savedPage;
    localStorage.setItem('savedItems', JSON.stringify(savedItems));
    return true;
}

const deleteTagFromAllPages = (tag, pageInfo={}) => {

    const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    if (savedItems.length === 0 ) {
        showToast('Can\'t delete tag! There is nothing in saved items...', 'bg-danger', 'text-light');
        return false;
    }

    let pageIndex = 0;
    savedItems.forEach( page => {
        const savedPageCustomTags = page.customTags || [];
        const tagIndex =  _.findIndex(savedPageCustomTags, item => item.toLowerCase() === tag.toLowerCase());
        if (tagIndex !== -1)  _.pullAt(savedPageCustomTags, tagIndex);
        page.customTags = savedPageCustomTags;
        savedItems[pageIndex] = page;
        pageIndex += 1;
    });

    localStorage.setItem('savedItems', JSON.stringify(savedItems));
    return true;
}

const deleteCatFromAllPages = (cat, pageInfo={}) => {

    const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    if (savedItems.length === 0 ) {
        showToast('Can\'t delete catgory! There is nothing in saved items...', 'bg-danger', 'text-light');
        return false;
    }

    let pageIndex = 0;
    savedItems.forEach( page => {
        const savedPageCustomCats = page.customCategories || [];
        const catIndex =  _.findIndex(savedPageCustomCats, item => item.toLowerCase() === cat.toLowerCase());
        if (catIndex !== -1)  _.pullAt(savedPageCustomCats, catIndex);
        page.customCategories = savedPageCustomCats;
        savedItems[pageIndex] = page;
        pageIndex += 1;
    });

    localStorage.setItem('savedItems', JSON.stringify(savedItems));
    return true;
}

const updateTagForAllPages = (oldTag, newTag) => {

    const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    if (savedItems.length === 0 ) {
        showToast('Can\'t update tag! There is nothing in saved items...', 'bg-danger', 'text-light');
        return false;
    }

    const tagGlobIndex =  _.findIndex(tagList, item => item.toLowerCase() === newTag.toLowerCase());
    if (tagGlobIndex !== -1) {
        showToast(`Can\'t update tag ${oldTag} with ${newTag} because ${newTag} is already a site tag!`, 'bg-warning', 'text-dark');
        return false;
    }

    let pageIndex = 0;
    savedItems.forEach( page => {
        let savedPageCustomTags = page.customTags || [];
        const tagIndex =  _.findIndex(savedPageCustomTags, item => item.toLowerCase() === oldTag.toLowerCase());
        if (tagIndex !== -1) {
            savedPageCustomTags = _.uniq(_.map(savedPageCustomTags, item => item.toLowerCase() === oldTag.toLowerCase() ? newTag : item));
            page.customTags = savedPageCustomTags;
            savedItems[pageIndex] = page;
        } 
        pageIndex += 1;
    });

    localStorage.setItem('savedItems', JSON.stringify(savedItems));
    return true;
}

const updateCatForAllPages = (oldCat, newCat) => {

    const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    if (savedItems.length === 0 ) {
        showToast('Can\'t update category! There is nothing in saved items...', 'bg-danger', 'text-light');
        return false;
    }

    const catGlobIndex =  _.findIndex(catList, item => item.toLowerCase() === newCat.toLowerCase());
    if (catGlobIndex !== -1) {
        showToast(`Can\'t update category ${oldCat} with ${newCat} because ${newCat} is already a site category!`, 'bg-warning', 'text-dark');
        return false;
    }

    let pageIndex = 0;
    savedItems.forEach( page => {
        let savedPageCustomCats = page.customCategories || [];
        const catIndex =  _.findIndex(savedPageCustomCats, item => item.toLowerCase() === oldCat.toLowerCase());
        if (catIndex !== -1) {
            savedPageCustomCats = _.uniq(_.map(savedPageCustomCats, item => item.toLowerCase() === oldCat.toLowerCase() ? newCat : item));
            page.customCategories = savedPageCustomCats;
            savedItems[pageIndex] = page;
        } 
        pageIndex += 1;
    });

    localStorage.setItem('savedItems', JSON.stringify(savedItems));
    return true;
}

const updateTagForPage = (oldTag, newTag, pageInfo={}) => {

    const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    if (savedItems.length === 0 ) {
        showToast('Can\'t update tag! There is nothing in saved items...', 'bg-danger', 'text-light');
        return false;
    }

    const page = {
        permalink: pageInfo.siteInfo.permalink,
        title: pageInfo.siteInfo.title
    };

    const pageIndex = objectIndexInArray(page, savedItems);
    if ( pageIndex === -1 ) {
        showToast('Can\'t update tag! Page not found in saved items...', 'bg-danger', 'text-light');
        return false;
    }

    const savedPage = savedItems[pageIndex];
    let savedPageCustomTags = savedPage.customTags || [];
    const tagGlobIndex =  _.findIndex(tagList, item => item.toLowerCase() === newTag.toLowerCase());

    if (tagGlobIndex !== -1) {
        showToast(`Can\'t update tag ${oldTag} with ${newTag} because ${newTag} is already a site tag!`, 'bg-warning', 'text-dark');
        return false;
    }

    savedPageCustomTags = _.uniq(replaceAllOccurrencesCaseInsensitive(savedPageCustomTags, oldTag, newTag));
    savedPage.customTags = savedPageCustomTags;
    savedItems[pageIndex] = savedPage;
    localStorage.setItem('savedItems', JSON.stringify(savedItems));
    return true;
}

const updateCatForPage = (oldCat, newCat, pageInfo={}) => {

    const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    if (savedItems.length === 0 ) {
        showToast('Can\'t update category! There is nothing in saved items...', 'bg-danger', 'text-light');
        return false;
    }

    const page = {
        permalink: pageInfo.siteInfo.permalink,
        title: pageInfo.siteInfo.title
    };

    const pageIndex = objectIndexInArray(page, savedItems);
    if ( pageIndex === -1 ) {
        showToast('Can\'t update category! Page not found in saved items...', 'bg-danger', 'text-light');
        return false;
    }

    const savedPage = savedItems[pageIndex];
    let savedPageCustomCats = savedPage.customCategories || [];
    const catGlobIndex =  _.findIndex(catList, item => item.toLowerCase() === newCat.toLowerCase());

    if (catGlobIndex !== -1) {
        showToast(`Can\'t update category ${oldCat} with ${newCat} because ${newCat} is already a site category!`, 'bg-warning', 'text-dark');
        return false;
    }

    savedPageCustomCats = _.uniq(replaceAllOccurrencesCaseInsensitive(savedPageCustomCats, oldCat, newCat));
    savedPage.customCategories = savedPageCustomCats;
    savedItems[pageIndex] = savedPage;
    localStorage.setItem('savedItems', JSON.stringify(savedItems));
    return true;
}

const getAllSavedItems = () => {
    return JSON.parse(localStorage.getItem('savedItems')) || [];
}