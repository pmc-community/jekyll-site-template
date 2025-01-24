const savePageToSavedItems = (pageInfo) => {
    const pageToSave = {
        permalink: sanitizeURL(pageInfo.siteInfo.permalink),
        title: DOMPurify.sanitize(pageInfo.siteInfo.title),
        customTags: [],
        customCategories: [],
        customNotes:[],
        customComments:[]
    }
    const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];

    if (!findObjectInArray(pageToSave, savedItems)) {
        savedItems.push(pageToSave);
        localStorage.setItem('savedItems', JSON.stringify(savedItems));
    }
    else {
        const savedPage = getObjectFromArray({permalink: pageInfo.siteInfo.permalink, title: pageInfo.siteInfo.title}, savedItems);
        const modifiedSavedPage = _.defaults(savedPage, pageToSave);
        savedItems = replaceObjectInArray(savedItems, modifiedSavedPage, {permalink: pageInfo.siteInfo.permalink, title: pageInfo.siteInfo.title});
        localStorage.setItem('savedItems', JSON.stringify(savedItems));
    }
    createGlobalLists();
}

const checkSavedItemForValidValues = (obj, keysToExclude) => {
    return _.reduce(_.keys(obj), (sum, key) => {
        if (_.includes(keysToExclude, key)) {
            return sum;
        }

        const value = obj[key];
        if (_.isEmpty(value) && value !== 0) {
            return sum + 0;
        } else {
            return sum + 1;
        }
    }, 0);
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

window.addNote = (note, pageInfo) => {
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

// if we need to intercept this function with the global interceptor (see utilities.js)
// and we don't want to define it in the global scope like window.func = (...) => {}
// we cannot use arrow function syntax and we need to stick to the classical function definition
function deleteNote(noteId, pageInfo)  {
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

window.addTag = (tag, pageInfo) => {
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

    tag = tag.replace(/["'.,/#!$%^&*;:{}=\-_`~()]/g, ' ');
    tag = tag.replace(/[^a-zA-Z0-9]/g, ' ');
    tag = DOMPurify.sanitize(tag);
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

window.addCat = (cat, pageInfo) => {
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

    cat = cat.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ');
    cat = cat.replace(/[^a-zA-Z0-9]/g, ' ');
    cat = DOMPurify.sanitize(cat);
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
    newTag = newTag.replace(/["'.,/#!$%^&*;:{}=\-_`~()]/g, ' ');
    newTag = newTag.replace(/[^a-zA-Z0-9]/g, ' ');
    newTag = DOMPurify.sanitize(newTag);

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
    newCat = newCat.replace(/["'.,/#!$%^&*;:{}=\-_`~()]/g, ' ');
    newCat = newCat.replace(/[^a-zA-Z0-9]/g, ' ');
    newCat = DOMPurify.sanitize(newCat);

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
    newTag = newTag.replace(/["'.,/#!$%^&*;:{}=\-_`~()]/g, ' ');
    newTag = newTag.replace(/[^a-zA-Z0-9]/g, ' ');
    newTag = DOMPurify.sanitize(newTag);

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
    newCat = newCat.replace(/["'.,/#!$%^&*;:{}=\-_`~()]/g, ' ');
    newCat = newCat.replace(/[^a-zA-Z0-9]/g, ' ');
    newCat = DOMPurify.sanitize(newCat);

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

// Function to save a local storage key as a JSON file
window.saveLocalStorageKeyAsJsonFile = (key, filename) => {
    const data = localStorage.getItem(key);
    let jsonData;
    try {
        jsonData = JSON.parse(data);
    } catch (error) {
        showToast(`Can\'t save local storage key! Error parsing key ${key}`, 'bg-danger', 'text-light');
        return `error parsing local storage key ${key}`;
    }

    const jsonString = JSON.stringify(jsonData, null, 4); // 4 spaces indentation
    const blob = new Blob([jsonString], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Your saved data is now in downloads folder, ${filename}.json`, 'bg-success', 'text-light');
    return filename;
}

window.loadLocalStorageKeyFromJsonFile = (key, file, schema = null) => {
    if (file) {
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const json = sanitizeJson(JSON.parse(e.target.result));
                let validSchema = true;
                if (schema) validSchema = isValidArrayOfObjectsStructure(json, schema);
                if (validSchema) {
                    localStorage.setItem(key, JSON.stringify(json));
                    showToast(`Data from file ${file.name} has been loaded`, 'bg-success', 'text-light');
                    return file.name;
                }
                else {
                    showToast(`Can\'t load ${file.name} because it has invalid schema`, 'bg-danger', 'text-light');
                    return `${file.name} has invalid schema`;
                }

            } catch (error) {
                showToast(`The file ${file.name} is not a valid JSON file and cannot be parsed`, 'bg-danger', 'text-light');
                return `${file.name} is not a valid JSON file`
            }
        };

        reader.onerror = function() {
            console.error('Error reading file:', reader.error);
            showToast(`Error reading file ${file.name}`, 'bg-danger', 'text-light');
            return `Error reading file ${file.name}`;
        };

        reader.readAsText(file);
        return file.name;
    } else {
        showToast('No file selected', 'bg-warning', 'text-dark');
        return `no file selected`
    }
}

const getTopCustomCats = () => {
    const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    const customCats = _(savedItems)
        .flatMap('customCategories') // Get all customCats from each object
        .filter(Boolean) // Remove any undefined or null values
        .countBy() // Count the occurrences of each customCat
        .map((numPages, name) => ({ name, numPages })) // Convert to array of objects
        .value();

    return customCats;
}

const getTopCustomTags = () => {
    const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    const customTags = _(savedItems)
        .flatMap('customTags') // Get all customCats from each object
        .filter(Boolean) // Remove any undefined or null values
        .countBy() // Count the occurrences of each customCat
        .map((numPages, name) => ({ name, numPages })) // Convert to array of objects
        .value();

    return customTags;
}

const getSavedItemsSize = () => {
    const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    return savedItems.length;
}

// removes pages without any custom data because it makes no sense to keep them in saved items
const cleanSavedItems = () => {
    let savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    let customNotes =[];
    let customTags =[];
    let customCategories = [];
    let customComments = [];

    // first, normalize savedItems item stucture to not have issues when starting the app
    savedItems.forEach(page => {
        if (!page.customNotes || page.customNotes === undefined) page.customNotes = customNotes;
        if (!page.customTags || page.customTags === undefined) page.customTags = customTags;
        if (!page.customCategories || page.customCategories === undefined) page.customCategories = customCategories
        if (!page.customComments || page.customComments === undefined) page.customComments = customComments;

        const pageToSave = {
            permalink: sanitizeURL(page.permalink),
            title: DOMPurify.sanitize(page.title),
            customTags: customTags,
            customCategories: customCategories,
            customNotes: customNotes,
            customComments: customComments
        }

        const savedPage = getObjectFromArray({permalink: page.permalink, title: page.title}, savedItems);
        const modifiedSavedPage = _.defaults(savedPage, pageToSave);
        const tempSavedItems = replaceObjectInArray(savedItems, modifiedSavedPage, {permalink: page.permalink, title: page.title});
        localStorage.setItem('savedItems', JSON.stringify(tempSavedItems));
        
    });

    // second, remove empty items as it makes no sense to keep them in savedItems
    let savedItemIndex = 0;
    let toRemove = [];
    savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    savedItems.forEach(page => {
        if (page.customNotes.length + page.customTags.length + page.customCategories.length + page.customComments.length === 0)
            toRemove.push(savedItemIndex); 
        savedItemIndex += 1;
    });

    _.pullAt(savedItems, toRemove);
    localStorage.setItem('savedItems', JSON.stringify(savedItems));

    // third, remove all items for which permalink is not in the pages list
    // and replace title with the title from pages list
    savedItemIndex = 0;
    toRemove = [];
    savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    savedItems.forEach(page => {
        const sitePage = getObjectFromArray({permalink: page.permalink}, pageList);
        if (sitePage === 'none') toRemove.push(savedItemIndex);
        else page.title = sitePage.title;
        savedItemIndex += 1;
    });

    _.pullAt(savedItems, toRemove);
    localStorage.setItem('savedItems', JSON.stringify(savedItems));

    // ensure that the date field separator used in note.date prop is the one defined in siteConfig.multilang.dateFieldSeparator
    // in order to be sure that dates are shown consistently across the site and is also correctly translated
    const replaceSeparator = (dateString, newSeparator) => {
        const dateRegex = /^(\d{2})(.)(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(.)(\d{4})$/;
        return dateString.replace(dateRegex, (match, day, sep1, month, sep2, year) => {
          return `${day}${newSeparator}${month}${newSeparator}${year}`;
        });
    };

    savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    const dateFieldSeparator = settings.multilang.dateFieldSeparator;
    savedItems.forEach(page => {
        customNotes = page.customNotes;
        customNotes.forEach(note => {
            note.date =  replaceSeparator(note.date, dateFieldSeparator)
        });
    });
    localStorage.setItem('savedItems', JSON.stringify(savedItems));
}

const getItemsNoHavingCustomProp = (what) => {
    const savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
    let count;
    if (what === 'tags') count = _.filter(savedItems, obj => _.size(obj.customTags) > 0).length;
    if (what === 'cats') count = _.filter(savedItems, obj => _.size(obj.customCategories) > 0).length;
    if (what === 'notes') count = _.filter(savedItems, obj => _.size(obj.customNotes) > 0).length;
    if (what === 'comments') count = _.filter(savedItems, obj => _.size(obj.customComments) > 0).length;
    return count;
}
