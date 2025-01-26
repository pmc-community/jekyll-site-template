// FUNCTIONS FOR EACH PAGE
// called from _includes/siteIncludes/partials/page-common/page-auto-summary.html

const page__getAutoSummary = () => {

    // defined as window.func because we want to hook actions on it
    window.createAutoSummaryPageContainer = (page) => {
        const autoSummary = page.siteInfo.autoSummary || [];
        
        return (
            `   
                <div id="pageAutoSummary" class="mt-4">
                    <span class="fw-medium text-secondary">
                        ${autoSummary}
                    </span>
                </div>
            `
        );
    }

    $(document).ready(function() {
        const autoSummary = pageInfo.siteInfo.autoSummary || '';
        $('#pageAutoSummary').remove();
        if (autoSummary === '') return;
        $('#pageLastUpdateAndPageInfo').append(createAutoSummaryPageContainer(pageInfo)); 

    });

}

// called from _includes/siteIncludes/partials/page-common/page-related-pages.html
const page__getRelatedPages = () => {

    const relatedPageItem = (relatedPage) => {

        const relatedPageLinkWidth = preFlight.deviceInfo.deviceType !=='desktop' ? 'col-12' : 'col-4';

        return (
            `
                <a siteFunction="pageRelatedPageLink" href="${relatedPage.permalink.indexOf('/') === 0 ? relatedPage.permalink : '/'+relatedPage.permalink}" class="${relatedPageLinkWidth} p-2">
                    <div siteFunction="pageRelatedPage" class="border-0 border-top rounded-0 border-secondary border-opacity-25 my-2 card h-100 py-3 px-0 bg-body rounded bg-transparent shadow-none">
                        <div class="h-100 align-top mb-2">
                            <span siteFunction="pageRelatedPageLinkPageTitle" class="fw-medium text-primary">${relatedPage.title}</span>
                        </div>
                        <div class="h-100 align-top mb-2">
                            <span siteFunction="pageRelatedPageLinkPageExcerpt" class="text-secondary">${getObjectFromArray({permalink:relatedPage.permalink, title: relatedPage.title}, pageList).excerpt}</span>
                        </div>
                    </div>
                </a>
            
            `
        );
    }

    const relatedPagesHtml = (page) => {
        let html = '';
        const relatedPages = page.siteInfo.relatedPages || [];
        if (relatedPages.length === 0) return html;
        relatedPages.forEach(relatedPage => {
            html += relatedPageItem(relatedPage);
        });

        return html;
    }

    const createRelatedPageContainer = (page) => {
        const relatedPages = page.siteInfo.relatedPages || [];
        const relatedPageItemsAlign = relatedPages.length > 3 ? 'justify-content-between' : 'justify-content-start';
        
        // we apply small px-2 correction to pageRelatedPagesRow
        return (
            `   
                <div 
                    id="pageRelatedPages" 
                    siteFunction="pageRelatedPages">
                    <span class="fs-6 fw-medium">
                        <span data-i18n="page_related_section_title">${i18next.t('page_related_section_title')}</span>:
                    </span>
                    <div siteFunction="pageRelatedPagesContainer">
                        <div
                            siteFunction="pageRelatedPagesRow"
                            class="row ${relatedPageItemsAlign} d-block d-md-flex px-2"> 
                            ${relatedPagesHtml(page)}
                        </div>
                    </div>
                </div>
            `
        );
    }

    $(document).ready(function() {
        const relatedPages = pageInfo.siteInfo.relatedPages || [];
        if (relatedPages.length === 0) { $('#pageRelatedPages').remove(); return;}
        $('#pageRelatedPages').remove(); 
        $('footer[class!="site-footer"]').append(createRelatedPageContainer(pageInfo));
    });
}

// called from _includes/siteIncludes/partials/page-common/page-notes.html
const page__getPageNotes = () => {

    const customNoteItem = (note) => {
        return (
            `
                <div siteFunction="pageNote" class="col-12 col-md-4 my-2 card h-auto p-2 bg-transparent border-0 rounded-0 border-secondary border-opacity-25 shadow-none">
                    <div 
                        class="align-top mb-2 border-0 border-bottom rounded-0 border-secondary border-opacity-25" 
                        style="width: fit-content">
                        <span 
                            class="text-primary ${settings.multilang.dateFieldClass}"
                            data-i18n="[text]formatted_date"
                            data-original-date="${note.date}"
                            data-month-name="short">
                            ${note.date}
                        </span>
                    </div>
                    <div class="align-top">
                        <p class="text-secondary">
                            ${note.note}
                        </p>
                    </div>
                </div>
            `
        );
    }

    const createNotesContainer = (page) => {
        const customNotes = _.orderBy(page.savedInfo.customNotes || [],  [obj => new Date(obj.date)], ['desc']);
        let customNotesHtml = '';
        customNotes.forEach(note => {
            customNotesHtml += customNoteItem(note);
        });

        return (
            `   
                <div 
                    id="pageNotes" 
                    siteFunction="pageNotes" 
                    class="mb-4">
                    <span class="fs-6 fw-medium">
                        <span data-i18n="page_notes_section_title">${i18next.t('page_notes_section_title')}</span>:
                    </span>
                    <div siteFunction="pageNotesContainer">
                        <div
                            siteFunction="pageNotesRow"
                            class="d-block d-md-flex justify-content-start row">
                            ${customNotesHtml}
                        </div>
                    </div>
                </div>
            `
        );
    }

    $(document).ready(function() {
        const customNotes = _.orderBy(pageInfo.savedInfo.customNotes || [],  [obj => new Date(obj.date)], ['desc']) ;
        if (customNotes.length === 0) { $('#pageNotes').remove(); return;}
        $('#pageNotes').remove(); 
        $('footer[class!="site-footer"]').append(createNotesContainer(pageInfo));
    });
}

// called from _includes/siteIncludes/partials/page-common/page-fedback-and-support.html
const page__getPageFeedbackAndSupport = () => {
    $(document).ready(function() {
        const permalink = $('main').attr('pagePermalinkRef') || '';
        const title = $('main').attr('pageTitleRef') || '';
        const page = getObjectFromArray( {permalink: permalink, title: title}, pageList);
        if (page === 'none' && window.location.pathname !== '/' ) return;

        // modify some styles on home page
        if (window.location.pathname === '/') {
            $('div[siteFunction="pageFeedbackAndSupport_Support"]').removeClass('col-3').addClass('col-4');
            $('div[siteFunction="pageFeedbackAndSupport_Involve"]').removeClass('col-3').addClass('col-4');
            $('div[siteFunction="pageFeedbackAndSupport_Feedback"]').removeClass('col-6').addClass('col-4');
        }
        // append the section to the footer under the content
        $('div[siteFunction="pageFeedbackAndSupport"]').appendTo('footer[class!="site-footer"]');
        $('div[siteFunction="pageFeedbackAndSupport"]').removeClass('d-none');
    });
};

// called from _includes/siteIncludes/partials/page-common/page-fedback-form.html
const page__getPageFeedbackForm = () => {      
    $(document).ready(function() {
        if (settings.hsIntegration.enabled) {            
            const permalink = $('main').attr('pagePermalinkRef');
            const title = $('main').attr('pageTitleRef');
            if (!findObjectInArray({permalink:permalink, title:title}, pageList) && window.location.pathname !== '/') return;

            fedbackFormContainer__ASYNC('pageFeedbackForm')
                .then( (formContainerSelector) => {
                    createHSFeedbackForm(
                        `#${formContainerSelector}`,

                        // send page info to form iFrame
                        {
                            permalink: permalink, 
                            title: title
                        },

                        // text and class for submit button, and other settings
                        {
                            submitText: 'Send your rating!',
                            submitButtonClass: 'btn btn-sm btn-outline-secondary border border-secondary border-opacity-25',
                            css: ['hs/hs.css'],
                            // iframe-global.js makes jQuery, lodash and a bunch of globals and functions available inside iFrame
                            js: ['iframe-global.js','hs/hs-feedback-form.js']        
                        },

                        // onFormReady callback
                        // set the specific form appearance; the general appearance is set in hs-integrate
                        ($form) => {
                            feedbackFormCSSCorrection($form);
                        },
                        
                        // onBeforeFormSubmit callback
                        // can do specific data manipulation or field processing before submit
                        // general processing (as filling in email field with a default value) are made in hs-integrate
                        ($form, data) => {
                            const iframeDocument = $form[0].ownerDocument;
                            $(iframeDocument).find('button[siteFunction="hsFormChangeRating"]').hide();
                        },

                        // onFormSubmitted callback
                        // can do some processing after the form is submitted with success
                        ($form, data) => {
                            // translating the message shown after submission
                            const iframeDocument = $form[0].ownerDocument;
                            $(iframeDocument)
                                    .find('div.submitted-message')
                                    .find('p').first()
                                    .css('visibility', 'hidden');
                            setTimeout(()=>{
                                $(iframeDocument)
                                    .find('div.submitted-message')
                                    .find('p').first()
                                    .attr('data-i18n', 'hs_feedback_form_message_after_submission')
                                    .text(i18next.t('hs_feedback_form_message_after_submission'))
                                    .css('visibility', 'visible');
                            },0);

                        },

                        // onBeforeFormInit callback
                        // can do some processing before the form is built, based on the full form settings (ctx) retrieved from HubSpot
                        (ctx) => {
                            // ... do something before the form init, like maybe last changes in the form parameters
                            // all form properties are available in the context object
                        }
                        
                        )
                        .then( (formContainerSelector) => {
                            $(`${formContainerSelector}`).removeClass('d-none');
                        });
                });
        }
    });
}

const feedbackFormCSSCorrection = ($form) => {
    $form.find('input[type="submit"]').addClass('inputField');
    
    const $fields = $form.children().first();
    $fields.addClass('d-flex justify-content-between ');
    $fields.children().first().addClass('w-auto');
    $fields.children().last().css('width', '70%');

    $form.find('textarea').addClass('h-100');
    $form.find('.hs-form-required').addClass('d-none');

    // remove "for" attr from labels because, anyway, most of them are wrong and generates page errors
    $form.find('label').each(function() {
        $(this).removeAttr('for');
    });

}

// called from _includes/siteIncludes/partials/page-common/page-info.html

/*
 * IMPORTANT!!!
 * Both data-i18n attribute and i18next.t functions must be used inside page__getPageInfo function
 * - data-i18n attribute will tranlsate first displaty when page loads bay calling doTranslation() from utilities.js
 * - i18next.t will translate when closing ofcanvas and refreshing info
*/ 
const page__getPageInfo = () => {
    const pageSiteInfoBadges = (page) => {
        if (page.siteInfo === 'none') return '';
        let siteInfoBadges = '';
        
        if (page.siteInfo.tags.length > 0 ) 
            siteInfoBadges += 
                `
                    <span
                        siteFunction="pageHasSiteTagsBadge"
                        title = "${i18next.t('page_page_info_badge_has_site_tags_title')}" 
                        class="btn-primary shadow-none m-1 px-3 py-2 fw-medium badge rounded-pill text-bg-primary alwaysCursorPointer"
                        data-i18n="[title]page_page_info_badge_has_site_tags_title;page_page_info_tags"
                        data-i18n-options='{"title":"123"}'>
                        ${i18next.t('page_page_info_tags')}
                    </span>
                `;

        if (page.siteInfo.relatedPages.length > 0 ) 
            siteInfoBadges += 
                `
                    <span
                        siteFunction="pageHasRelatedPagesBadge"
                        title = "${i18next.t('page_page_info_badge_has_related_title')}" 
                        class="m-1 px-3 py-2 fw-medium badge rounded-pill text-bg-danger alwaysCursorPointer"
                        data-i18n="[title]page_page_info_badge_has_related_title;page_page_info_related">
                        ${i18next.t('page_page_info_related')}
                    </span>
                `;
        
        if (page.siteInfo.autoSummary !== '' )
            siteInfoBadges += 
                `
                    <span
                        siteFunction="pageHasAutoSummaryBadge"
                        title = "${i18next.t('page_page_info_badge_has_summary_title')}"
                        class="m-1 px-3 py-2 fw-medium badge rounded-pill text-bg-dark alwaysCursorPointer"
                        data-i18n="[title]page_page_info_badge_has_summary_title;page_page_info_summary">
                        ${i18next.t('page_page_info_summary')}
                    </span>
                `;
        
        return siteInfoBadges === '' ?
            '' :
            '<div>' + siteInfoBadges + '</div>';
    }
    
    const pageSavedInfoBadges = (page) => {
        if (page.savedInfo === 'none') return '';
        let savedInfoBadges = '';
        
        if (page.savedInfo.customTags.length > 0 )
            savedInfoBadges += 
                `
                    <span
                        siteFunction="pageHasCustomTagsBadge"
                        title = "${i18next.t('page_page_info_badge_has_custom_tags_title')}" 
                        class="m-1 px-3 py-2 fw-medium badge rounded-pill text-bg-success alwaysCursorPointer"
                        data-i18n="[title]page_page_info_badge_has_custom_tags_title;page_page_info_tags">
                        ${i18next.t('page_page_info_tags')}
                    </span>
                `;
        
        if (page.savedInfo.customCategories.length > 0 ) 
            savedInfoBadges += 
                `
                    <span
                        siteFunction="pageHasCustomCategoriesBadge"
                        title="${i18next.t('page_page_info_badge_has_custom_cats_title')}" 
                        class="m-1 px-3 py-2 fw-medium badge rounded-pill text-bg-success alwaysCursorPointer"
                        data-i18n="[title]page_page_info_badge_has_custom_cats_title;page_page_info_cats">
                        ${i18next.t('page_page_info_cats')}
                    </span>
                `;
        
        if (page.savedInfo.customNotes.length > 0 ) 
            savedInfoBadges += 
                `
                    <span
                        siteFunction="pageHasCustomNotesBadge"
                        title="${i18next.t('page_page_info_badge_has_custom_notes_title')}"
                        class="m-1 px-3 py-2 fw-medium badge rounded-pill text-bg-warning alwaysCursorPointer"
                        data-i18n="[title]page_page_info_badge_has_custom_notes_title;page_page_info_notes">
                        ${i18next.t('page_page_info_notes')}
                    </span>
                `;
    
        return savedInfoBadges === '' ?
            '' :
            '<div>' + savedInfoBadges + '</div>';
    
    }

    const pageCategories = (page) => {

        const pageCatItem = (cat, isLast) => {

            const isNotLast = '<span class="fw-normal">  </span>';

            const catColor = _.findIndex(globCustomCats, item => item.toLowerCase() === cat.trim().toLowerCase()) === -1 ?
                'text-danger' :
                'text-success';

            const numPages = _.findIndex(globCustomCats, item => item.toLowerCase() === cat.trim().toLowerCase()) === -1 ?
                catDetails[cat].numPages:
                getCatPages(cat);
            
            return (
                `
                    <div >
                        <a
                            href="/cat-info?cat=${cat}"
                            class="${catColor} fw-medium btn btn-sm border-0 shadow-none px-0 my-1 mr-3"
                            title="Click for details for category ${cat}\nPages in category: ${numPages}">
                            ${cat}
                            <span 
                                sitefunction="catBadgeOnPage" 
                                class="fw-normal border px-2 rounded bg-warning-subtle text-dark"> 
                                ${numPages} 
                        </span>
                        </a>
                    </div>
                    ${!isLast ? isNotLast : '' } 
                `
            );
        }

        const allPageCategories = [...page.siteInfo.categories || [], ...page.savedInfo.customCategories || []];
        let pageCatsHtml = '';

        allPageCategories.forEach( (cat, index) => {
            if (index === allPageCategories.length - 1) pageCatsHtml += pageCatItem(cat, true);
            else pageCatsHtml += pageCatItem(cat, false);
        });

        return pageCatsHtml;
    }

    const pageSimilarByContent = (page) => {
        pageSimilarPages = page.siteInfo.similarByContent.slice(0, settings.similarByContent.maxPages) || [];

        const similarPagesHtml = (similarPages) => {
            let html = ''
            similarPages.forEach(page => {
                const similarPageExcerpt = getObjectFromArray(
                    {
                        permalink: page.permalink, 
                        title: page.title
                    }, 
                    pageList
                ).excerpt || '';
                
                html = html + 
                    `
                        <a 
                            title="${similarPageExcerpt}" 
                            class="fw-medium text-primary badge py-2 px-3 m-1 bg-body-secondary rounded-pill" 
                            href="${page.permalink.indexOf('/') === 0 ? page.permalink : '/'+page.permalink}">
                            ${page.title}
                        </a>
                    `
            });
            return html;
        }

        return pageSimilarPages.length === 0 ?
            '' :
            (
                `
                    <div 
                        sitefunction="pageFullInfoPageGeneralSimilarPages" 
                        class="mt-2 mb-4 d-md-flex">
                        <span 
                            data-i18n="[title]page_info_similar_pages_title;page_info_similar_pages_text"
                            class="fw-medium align-self-center mr-md-2"" 
                            title="${i18next.t('page_info_similar_pages_title')}"> 
                            <span data-i18n="page_info_similar_pages_text">${i18next.t('page_info_similar_pages_text', { fallbackLng: true })}</span>: 
                        </span>
                        <span 
                            sitefunction="pageFullInfoPageGeneralSimilarPagesText"
                            class="d-flex">
                            <span class "d-md-flex">
                                ${similarPagesHtml(pageSimilarPages)}
                            </span>           
                        </span>
                    </div>
                `
            );
    }

    const pageInfoContainer = (page) => {
        const siteCats = getObjectFromArray({permalink: page.siteInfo.permalink, title: page.siteInfo.title}, pageList).categories.length || 0;
        const customCats = getPageCats(page).length || 0;

        const catsHtml = siteCats + customCats === 0 ?
            '' :
            `
                <div class="d-flex align-items-center">
                    ${pageCategories(page)}
                </div>
            `;

        const pageSimilarPages = page.siteInfo.similarByContent.slice(0, settings.similarByContent.maxPages) || []
        return (
            `
                <div id="pageLastUpdateAndPageInfo" class="my-4 p-0 container-xl">
                    ${catsHtml}
                    <div class="d-md-flex align-items-center justify-content-between mb-2 mb-md-0">
                        <div class="fw-medium fs-2 mb-2 mt-2">${page.siteInfo.title}</div>
                        <div class="badge fs-6 fw-light text-secondary border border-secondary border-opacity-25 shadow-none">
                            ${page.siteInfo.readingTime} 
                            <span 
                                class="fw-light text-secondary"
                                data-i18n="page_page_info_read_time_text">
                                ${i18next.t('page_page_info_read_time_text')}
                            </span>    
                        </div>
                    </div>
                    <div class="mb-4">${page.siteInfo.excerpt}</div>
                    <div class="d-md-flex justify-content-between align-items-center">
                        <div>
                            <div class="d-md-flex align-items-center">
                                <div class="badge rounded-pill text-bg-secondary px-3 py-2 fw-medium mb-2 mb-md-0">
                                    <span
                                        class="text-bg-secondary fw-medium"
                                        data-i18n="page_page_info_last_update_badge_text">
                                        ${i18next.t('page_page_info_last_update_badge_text')}
                                    </span>: 
                                    <span
                                        class="${settings.multilang.dateFieldClass}"
                                        data-i18n="[text]formatted_date"
                                        data-original-date="${formatDate(page.siteInfo.lastUpdate)}"
                                        data-month-name="short">
                                        ${formatDate(page.siteInfo.lastUpdate)}
                                    </span>
                                </div>
                                <div class="d-md-flex">
                                    ${pageSavedInfoBadges(page)}
                                    ${pageSiteInfoBadges(page)}
                                </div>
                            </div>
                            
                        </div>
                        <div class="my-4 d-md-flex align-content-center">
                            <button 
                                sitefunction="pageShowPageFullInfo" 
                                type="button" 
                                class="btn btn-sm btn-primary position-relative m-1" 
                                title="${i18next.t('page_page_info_doc_info_btn_title')}"
                                data-i18n="[title]page_page_info_doc_info_btn_title;page_page_info_doc_info_btn">
                                ${i18next.t('page_page_info_doc_info_btn')}
                            </button>
                            <button 
                                sitefunction="pageNavigateToFeedbackAndSupport" 
                                type="button" 
                                class="btn btn-sm btn-success position-relative m-1" 
                                title="${i18next.t('page_page_info_support_btn_title')}"
                                data-i18n="[title]page_page_info_support_btn_title;page_page_info_support_btn">
                                ${i18next.t('page_page_info_support_btn')}
                            </button>
                        </div>
                    </div>

                    ${pageSimilarPages.length === 0 ? '' : pageSimilarByContent(page)}                    
                </div>
            `
        );
    }

    $(document).ready(function() {
        
        if (pageInfo.siteInfo === 'none') return;

        // adding pageInfo section 
        // and preventing document to scroll when #pageLastUpdateAndPageInfo is removed and replaced 
        prependFirstSectionWithNoScroll(
            '#pageLastUpdateAndPageInfo', 
            settings.layouts.contentArea.contentWrapper, 
            $(pageInfoContainer(pageInfo))
        );
        
        $(document)
            .off('click', 'button[sitefunction="pageShowPageFullInfo"]')
            .on('click', 'button[sitefunction="pageShowPageFullInfo"]', function() {
                showPageFullInfoCanvas(pageInfo);
            });
        setPageButtonsFunctions();
        // since this function is the first one executed on page
        // we take the opportunity to set some observers
        setTriggerReorderSectionsInFooter();
        refreshPageAfterOffCanvasClose();
    })
}

const page__setSelectedTextContextMenu = () =>{

    $(document).ready(function() {
        if (!settings.selectedTextContextMenu.enabled) return;
        if (pageInfo.siteInfo === 'none') return;
        const permalink = $('main').attr('pagePermalinkRef') || '';
        const title = $('main').attr('pageTitleRef') || '';
        const page = getObjectFromArray( {permalink: permalink, title: title}, pageList);
        if (page === 'none') return;
        
        // define context menu items handlers
        // HANDLERS MUST RECEIVE AT LEAST THE SELECTED TEXT AS PARAMETER BUT MUST HAVE ALL 4 PARAMETERS DEFINED
        // OTHERWISE handler.bind(null, ... ) WILL NOT BE SET PROPERLY
        /* 
            parameters:
            1. current page
            2. menu item clicked
            3. selected text
            4. the rectangle on the screen where the selected text is located
        */
        const addCommentToSelectedText = (page = null, itemText = null, selectedText, selectedTextHtml, rectangle=null) => {
            $('div[sitefunction="pageAddCommentToSelectedText_text"]').text(selectedText);
            $('div[siteFunction="pageAddCommentToSelectedText_container"]').removeClass('d-none');
            $('textarea[sitefunction="pageAddCommentToSelectedText_comment"]')[0].setSelectionRange(0, 0);
            $('textarea[sitefunction="pageAddCommentToSelectedText_comment"]').focus();
        }

        const searchInSite = (page = null, itemText = null, selectedText, selectedTextHtml, rectangle=null) => {
            if (!algoliaSettings.algoliaEnabled) return;
            if ( algoliaSettings.algoliaDocSearchEnabled || !algoliaSettings.algoliaCustomEnabled) $('.DocSearch').click();
            
            $('#selected-text-context-menu').hide();
            $('body').css('overflow', '');
        }

        const tagDocWithSelectedText = (page = null, itemText = null, selectedText, selectedTextHtml, rectangle=null) => {
            if (
                _.words(selectedText).length > settings.selectedTextContextMenu.tags.maxWords || 
                selectedText.length > settings.selectedTextContextMenu.tags.maxChars) {
                    showToast(
                        `Tags are limited to ${settings.selectedTextContextMenu.tags.maxWords} words and ${settings.selectedTextContextMenu.tags.maxChars} characters`, 
                        'bg-danger', 
                        'text-light'
                    );
                    return;
                }
            const tag = DOMPurify.sanitize(selectedText);
            const pageParam = {
                siteInfo: {
                    permalink: page.siteInfo.permalink,
                    title: page.siteInfo.title
                }
            };

            if (addTag(tag, pageParam)) {
                updateGlobalTagLists(tag);
                pageInfo = {
                    siteInfo: getObjectFromArray ({permalink: pageInfo.siteInfo.permalink, title: pageInfo.siteInfo.title}, pageList),
                    savedInfo: getPageSavedInfo (pageInfo.siteInfo.permalink, pageInfo.siteInfo.title)
                }
                $('div[siteFunction="pageCustomTagButton"]').remove();
                refreshPageDynamicInfo();
                showToast(
                    `Tag <span class="badge mx-1 text-bg-primary fw-normal">${tag}</span> was applied to the document!`, 
                    'bg-success', 
                    'text-light'
                );
            }

            $('#selected-text-context-menu').hide();
            $('body').css('overflow', '');
            $('div[siteFunction="pageCustomTagButton"]').remove();
        }

        const tagAllDocsWithSelectedText = (page = null, itemText = null, selectedText, selectedTextHtml, rectangle=null) => {
            if (!algoliaSettings.algoliaEnabled) return;
            if (
                _.words(selectedText).length > settings.selectedTextContextMenu.tags.maxWords || 
                selectedText.length > settings.selectedTextContextMenu.tags.maxChars) {
                    showToast(
                        `Tags are limited to ${settings.selectedTextContextMenu.tags.maxWords} words and ${settings.selectedTextContextMenu.tags.maxChars} characters`, 
                        'bg-danger', 
                        'text-light'
                    );
                    return;
                }
            const crtPage = page;
            algolia.silentSearchInSite(selectedText, (results) => {
                const pageURLs = _.uniq(_.map(results, 'url_without_anchor'));
                const permalinkOptions = [];

                const permalinks = getPermalinksFromURLArray(pageURLs);
                
                permalinks.forEach( permalink => {
                    // we use a function defined in preflight-check.js to get permalink options
                    // as permalink extraction from url returns always /permalink/
                    // and we don't know how permalink are defined in the page front matter
                    permalinkOptions.push(preFlight.formatPath(permalink)); 
                })
                let matchingPages = [];
                permalinkOptions.forEach(permalinkArray => {
                    matchingPages.push(_.filter(pageList, (obj) => _.includes(permalinkArray, obj.permalink)));
                });

                const flatMatchingPages = _.flatten(matchingPages);
                const uniqueMatchingPages = _.uniqWith(flatMatchingPages, _.isEqual);
                const cleanMatchingPages = _.filter(uniqueMatchingPages, obj => !_.isEmpty(obj));

                const tag = DOMPurify.sanitize(selectedText);
                let numPages = 0;
                if (cleanMatchingPages.length < pageList.length) {
                    cleanMatchingPages.forEach(page => {
                        const pageParam = {
                            siteInfo: {
                                permalink: page.permalink,
                                title: page.title
                            }
                        }
                        // tag page if is in saved items, otherwise skip
                        notSavedPages = [];
                        if ( getPageSavedInfo(page.permalink, page.title) !=='none' ) {
                            if (addTag(tag, pageParam)) numPages += 1;
                            else notSavedPages.push(page.title);
                        }
                    });
                    updateGlobalTagLists(tag);
                    pageInfo = {
                        siteInfo: getObjectFromArray ({permalink: pageInfo.siteInfo.permalink, title: pageInfo.siteInfo.title}, pageList),
                        savedInfo: getPageSavedInfo (pageInfo.siteInfo.permalink, pageInfo.siteInfo.title)
                    }
                    $('div[siteFunction="pageCustomTagButton"]').remove();
                    refreshPageDynamicInfo();

                    const crtPageInfo = getPageSavedInfo(crtPage.siteInfo.permalink, crtPage.siteInfo.title) ==='none' ?
                        'This document was not found in saved items, so the tag was not applied to it.' :
                        '';

                    if (numPages > 0) {

                        const numPagesDiff = numPages === cleanMatchingPages.length ? 
                        '' : 
                        `(out of ${cleanMatchingPages.length})`;

                        const toastEnd = numPages === cleanMatchingPages.length ? 
                        '' : 
                        `${cleanMatchingPages.length - numPages} document(s) not found in saved items. `;

                        showToast(
                            `
                                Tag 
                                <span class="badge mx-1 text-bg-primary fw-normal">
                                ${tag}
                                </span> 
                                was applied to 
                                ${numPages} ${numPagesDiff} 
                                document(s)!
                                ${toastEnd}
                                ${crtPageInfo}
                            `, 
                            'bg-success',
                            'text-light'
                        );
                    }
                }
                else
                    showToast(
                        `All documents should be tagged with tag <span class="badge mx-1 text-bg-primary fw-normal">${tag}</span> and this doesn't make sense! We skip ... You can manually apply the tag on the docs you want.`, 
                        'bg-warning', 
                        'text-dark'
                    );
            });
            
            $('#selected-text-context-menu').hide();
            $('body').css('overflow', '');
        }

        // return the context menu item handler
        const getItemHandler = (item) => {
            let handler = null;
            contextMenuContent.menu.forEach(itemObj => {
                if (itemObj.label === item) handler = itemObj.handler;
            });
            return handler;
        }

        // define context menu content
        const contextMenuContent = 
        {
            menu:[
                {
                    label: '<div class="text-danger pb-2 border-bottom border-secondary border-opacity-25">See selected</div>',
                    // no handler here, is just for moving the focus to selected text because it may be lost when activating the textarea
                    handler: '' 
                },
                {
                    label: settings.selectedTextContextMenu.comments.enabled ? 'Add comment' : '',
                    handler: addCommentToSelectedText
                },
                {
                    label: algoliaSettings.algoliaEnabled ? 'Search in site' : '',
                    handler: searchInSite, // works only with algolia
                },
                {
                    label: 'Tag document',
                    handler: tagDocWithSelectedText,
                },
                {
                    label: algoliaSettings.algoliaEnabled ? 'Tag all documents' : '',
                    handler: tagAllDocsWithSelectedText,
                }
            ],
            ops: 
                `
                    <div 
                        class="px-2 text-dark d-none" 
                        siteFunction="pageAddCommentToSelectedText_container">

                        <div 
                            sitefunction="pageAddCommentToSelectedText_text"
                            class="pageExcerptInListItems text-primary mb-2 pt-2 border-top border-secondary border-opacity-25">
                            selected text
                        </div>

                        <textarea 
                            class="form-control" 
                            sitefunction="pageAddCommentToSelectedText_comment" 
                            id="pageAddCommentToSelectedText_comment" 
                            rows="2">
                        </textarea>
            
                        <div class="mb-2 d-flex justify-content-between">
                            <button 
                                sitefunction="pageAddCommentToSelectedText_btn" 
                                id="pageAddCommentToSelectedText_btn" 
                                type="button" 
                                class="focus-ring focus-ring-warning btn btn-sm btn-success mt-2 position-relative pageExcerptInListItems">
                                Add comment     
                            </button>
                            <div class="d-flex justify-content-end align-items-center mt-2"> 
                                <span 
                                    sitefunction="addCommentSelectedTextContextMenuWords" 
                                    class="align-middle mr-2 pageExcerptInListItems text-dark">W: 0
                                </span> 
                                <span 
                                    sitefunction="addCommentSelectedTextContextMenuChars" 
                                    class="align-middle pageExcerptInListItems text-dark">C: 0
                                </span>
                            </div>
                        </div>
                    </div>
                `
        };

        // context menu callbacks
        const initAddCommentContainer = () => {
            $('div[siteFunction="pageAddCommentToSelectedText_container"]').addClass('d-none');
            $('textarea[sitefunction="pageAddCommentToSelectedText_comment"]').val('');
            $('div[sitefunction="pageAddCommentToSelectedText_text"]').text('');
        }

        const onOpenCallback = (selectedText=null, selectedTextHtml=null, rect=null) => {
            initAddCommentContainer();
        }
        
        const onCloseCallback = (selectedText=null, selectedTextHtml=null, rect=null) => {
            initAddCommentContainer();
        }

        // HEADS UP!!!
        // HERE WE SET THE HANDLERS FOR BUTTONS OR ACTIVE ELEMENTS WE HAVE ON OPS CONTAINER
        const onBeforeInitCallback = (selectedText, selectedTextHtml, rectangle) => {
            keepTextInputLimits(
                'textarea[sitefunction="pageAddCommentToSelectedText_comment"]',
                5,
                50,
                'span[sitefunction="addCommentSelectedTextContextMenuWords"]',
                'span[sitefunction="addCommentSelectedTextContextMenuChars"]'
            );
            $(document)
                .off('click', 'button[sitefunction="pageAddCommentToSelectedText_btn"]')
                .on('click', 'button[sitefunction="pageAddCommentToSelectedText_btn"]', handleAddCommentToSelectedText.bind(null, page, selectedText, selectedTextHtml, rectangle));
        }

        // HANDLERS
        const handleAddCommentToSelectedText = (page, selectedText, selectedTextHtml, rectangle) => {
            console.log(page);
            console.log(selectedText);
            console.log(rectangle);
            highlightTextInRectangle (selectedText, rectangle);

            initAddCommentContainer();
            $('#selected-text-context-menu').hide();
            $('body').css('overflow', '');    
        }

        // set the menu
        setSelectedTextContextMenu(
            'main',
            contextMenuContent,
            (event, selectedText, selectedTextHtml, rectangle) => {
                const handler = getItemHandler($(event.target).closest('.selected-text-context-menu-item').text());
                if (handler) handler.bind(null, pageInfo, $(event.target).closest('.selected-text-context-menu-item').text(), selectedText, selectedTextHtml, rectangle)();
            },
            () => onCloseCallback(),
            () => onOpenCallback(),
            (selectedText, selectedTextHtml, rectangle) => onBeforeInitCallback(selectedText, selectedTextHtml, rectangle)
        );

    });

};

// called from _includes/siteIncludes/partials/page-common/page-tags.html
const page__showPageCustomTags = () => {

    const createPageTagsContainer = () => {
        return (
            `
                <div 
                    id="pageTags"
                    siteFunction="pageTags" 
                    class="mb-4">
                    <span 
                        siteFunction="pageTagsContainer" 
                        class="mr-5 fs-6 fw-medium">
                        <span data-i18n="page_tags_section_title">Tags</span>:
                    </span>
                </div>
            `
        );
    }

    const tagElement = (tag, numPages) => {
        return (
            `
                <div siteFunction="pageCustomTagButton" class="d-inline-flex align-items-center">
                    <a 
                        href="/tag-info?tag=${tag}" 
                        sitefunction="pageTagButton" 
                        type="button" 
                        class="focus-ring focus-ring-warning px-3 my-2 mr-md-5 btn btn-sm btn-success position-relative">
                        ${tag}
                    </a> 
                    <span 
                        sitefunction="tagBadgeOnPage" 
                        class="position-relative translate-middle badge rounded-pill text-bg-warning"> 
                        ${numPages} 
                        <span class="visually-hidden" >number of pages</span>
                    </span>
                </div>
            `
        );
    }

    $(document).ready(function() {
        const siteTags = pageInfo.siteInfo.tags || [];
        let customTags = pageInfo.savedInfo.customTags || [];
        if (siteTags.length + customTags.length === 0 ) {
            $('#pageTags').remove();
            return;
        }

        // if the page doesn't have siteTags but has customTags
        // we need to re-create the pageTags container
        // because _/includes/siteIncludes/partials/page-common/page-tags.html template will not create it in full
        // and will create only the div with the id=pageTags
        if ( pageInfo.siteInfo.tags.length === 0) {
            $('#pageTags').remove();
            // JTD has 2 footers
            // $('footer[class="site-footer "]') is the one on the bottom of the left sidebar
            // so we need to avoid that one
            $('footer[class!="site-footer"]').append(createPageTagsContainer()); 
        }
        customTags.forEach( tag => {
            const numPages = getTagPages(tag);
            $('#pageTags').append($(tagElement(tag, numPages)));
        });
        window.postMessage({ type: 'contentChanged' }, '*');
    
    });
};

// INTERNAL FUNCTIONS, NOT CALLED FROM HTML TEMPLATES
const refreshPageDynamicInfo = () => {
    keepScrollFixed(() => {
        page__showPageCustomTags();
        page__getPageInfo();
        page__getPageNotes();
        page__getRelatedPages();
        page__getAutoSummary();
        
        setTimeout(()=>{
            doTranslateDateFields();
            $('div[siteFunction="pageFeedbackAndSupport"]').addClass('order');
        }, 0); 
    });
}

const setTriggerReorderSectionsInFooter = () => {
    removeObservers('div[siteFunction="pageFeedbackAndSupport"] class=order getClass=true');
    setElementChangeClassObserver('div[siteFunction="pageFeedbackAndSupport"]', 'order', true, () => {
        const order = ['pageTags', 'pageNotes', 'pageRelatedPages'];
        orderSectionsBeforeElement(order, 'div[siteFunction="pageFeedbackAndSupport"]');
        $('div[siteFunction="pageFeedbackAndSupport"]').removeClass('order');
    });
}

window.setPageButtonsFunctions = () => {
    // click "Tags" badge
    $(document)
        .off('click', 'span[siteFunction="pageHasCustomTagsBadge"]')
        .on('click', 'span[siteFunction="pageHasCustomTagsBadge"]', function() {
            $('html, body').animate({
                scrollTop: $('#pageTags').offset().top
            }, 100);
        });

    $(document)
        .off('click', 'span[siteFunction="pageHasSiteTagsBadge"]')
        .on('click', 'span[siteFunction="pageHasSiteTagsBadge"]', function() {
            $('html, body').animate({
                scrollTop: $('#pageTags').offset().top
            }, 100);
        });
    
    // click "Notes" badge
    $(document)
        .off('click', 'span[siteFunction="pageHasCustomNotesBadge"]')
        .on('click', 'span[siteFunction="pageHasCustomNotesBadge"]', function() {
            $('html, body').animate({
                scrollTop: $('#pageNotes').offset().top
            }, 100);
        });

    // click "Related" badge
    $(document)
        .off('click', 'span[siteFunction="pageHasRelatedPagesBadge"]')
        .on('click', 'span[siteFunction="pageHasRelatedPagesBadge"]', function() {
            $('html, body').animate({
                scrollTop: $('#pageRelatedPages').offset().top
            }, 100);
        });

    // hover "Summary" badge
    $(document)
        .off('mouseenter', 'span[siteFunction="pageHasAutoSummaryBadge"]')
        .off('mouseleave', 'span[siteFunction="pageHasAutoSummaryBadge"]')
        .on('mouseenter', 'span[siteFunction="pageHasAutoSummaryBadge"]', function() {
            $('#pageAutoSummary').addClass('border-warning border-bottom border-opacity-25')
        })
        .on('mouseleave', 'span[siteFunction="pageHasAutoSummaryBadge"]', function() {
            $('#pageAutoSummary').removeClass('border-warning border-bottom border-opacity-25');
        });

    // click "Summary" badge
    $(document)
        .off('click', 'span[siteFunction="pageHasAutoSummaryBadge"]')
        .on('click', 'span[siteFunction="pageHasAutoSummaryBadge"]', function() {
            $('html, body').animate({
                // bookmark is on top of page, so better to be sure that will not go under header
                scrollTop: $('#pageAutoSummary').offset().top - 100 
            }, 100);
        });

    // click "Support" button
    $(document)
        .off('click', 'button[siteFunction="pageNavigateToFeedbackAndSupport"]')
        .on('click', 'button[siteFunction="pageNavigateToFeedbackAndSupport"]', function() {
            $('html, body').animate({
                scrollTop: $('#pageFeedbackAndSupport').offset().top 
            }, 100);
        });

    // click "Custom Cats" badge
    $(document)
        .off('click', 'span[siteFunction="pageHasCustomCategoriesBadge"]')
        .on('click', 'span[siteFunction="pageHasCustomCategoriesBadge"]', function() {
            $('html, body').animate({
                // bookmark is on top of page, so better to be sure that will not go under header
                scrollTop: $('#pageLastUpdateAndPageInfo').offset().top - 100
            }, 100);
        });

}

const refreshPageAfterOffCanvasClose = () => {
    removeObservers('.offcanvas class=hiding getClass=true');
    setElementChangeClassObserver('.offcanvas', 'hiding', true, () => {
        $('div[siteFunction="pageCustomTagButton"]').remove();
        refreshPageDynamicInfo();
    });
}

const createHSFeedbackForm = (
    formContainerSelector, 
    page, 
    formSettings, 
    onFormReady, 
    onBeforeFormSubmit,
    onFormSubmitted,
    onBeforeFormInit
) => {
    return new Promise((resolve) => {
        hsIntegrate.hsForm(
            formContainerSelector, 
            page,
            formSettings,
            {
                region: hsSettings.region,
                portalID: hsSettings.portalID, 
                formID: hsSettings.feedbackFormID
            },
            onFormReady, 
            onBeforeFormSubmit,
            onFormSubmitted,
            onBeforeFormInit
        );
        resolve(formContainerSelector);
    });
}

const fedbackFormContainer__ASYNC = (formContainerSelector) => {
    return new Promise((resolve) => {
        const formContainer = () => {
            return (
                `
                    <div id = "pageFeedbackFormColumn" class="mt-4">
                        <div 
                            id="${formContainerSelector}" 
                            class="d-none">
                        </div>
                        <div class="hsFormLink mt-2 text-primary">
                            <a href="${settings.links.privacyLink}" target=_blank>
                                <i class="bi bi-shield-lock"></i> 
                                <span 
                                    class="ghBtnLink text-primary" 
                                    data-i18n="page_footer_help_us_improve_privacy_policy">
                                    Privacy Policy
                                </span>
                            </a>
                        </div>
                    </div>
                `
            );
        }

        $(`#pageFeedbackFormColumn`).remove();
        $('div[siteFunction="pageFeedbackAndSupport_Feedback"]').append(formContainer('pageFeedbackForm'));
        resolve(formContainerSelector);
    });
}