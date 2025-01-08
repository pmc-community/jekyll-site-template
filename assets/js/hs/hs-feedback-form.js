/*
const iframeWindow = window;
const iframeDocument = iframeWindow.document;
const mainJQuery = window.parent.mainJQuery;
iframeWindow.$ = mainJQuery;
iframeWindow.jQuery = mainJQuery;

const mainLodash = window.parent._;
iframeWindow._ = mainLodash;
*/
const {settings, pageSettings, hsSettings} = window.parent.utilities;
const { showToast } = window.parent.utilities.func;

hsFeedbackForm = {
    doTheWork: () => {
        if (mainJQuery) {
            $(hsFeedbackForm.iframeDocument).ready(function() {
                hsFeedbackForm.prettyRadioButtons();
                hsFeedbackForm.fixMessageTextareaHeight(); // should be fixed to a certain height, otherwise has the tendency to grow
                hsFeedbackForm.setWasThisUsefullFunction();
                hsFeedbackForm.setChangeRatingFunction();
                hsFeedbackForm.hideFormExtraControls();
            });
        } else {
            showToast(`Something went wrong, cannot execute functions!`, 'bg-danger', 'text-light');
            console.error('jQuery is not available in this context, although it should be!')
        }
    },

    hideFormExtraControls: () => {
        $(iframeDocument).find('.hs_submit').addClass('d-none');
        $(iframeDocument).find('.hs-message').addClass('d-none')
        $(iframeDocument).find('.hs-email').parent().addClass('d-none');
        hsFeedbackForm.notifyParentOfContentChange();
    },

    setWasThisUsefullFunction: () => {
        const yourRating = (rating) => {
            const ratingTextClass = rating === 'Yes' ? 'text-success' : 'text-danger';

            return (
                `
                    <div siteFunction="hsFormChangeRatingContainer" class="d-flex justify-content-between align-items-center mb-2">
                        <div class="hsFormRegularText text-secondary">
                            <span>Was this useful: </span>
                            <span class="${ratingTextClass}">${rating}</span>
                        </div>
                        <button siteFunction="hsFormChangeRating" class="btn btn-danger text-light btn-sm hsFormRegularText me-2">
                            <i class="bi bi-arrow-clockwise"></i>
                        </button>
                    </div>
                `
            );
        }
        $(iframeDocument).find('.hs-form-radio').click(function() {

            btnValue = $(this).find('label > span').first().text();
            if (btnValue === 'Yes') {
                $(this).prop('checked', true);
            }
            else {
                $(this).prop('checked', false);
            }

            if ($(iframeDocument).find('div[siteFunction="hsFormChangeRatingContainer"]').length === 0)
                $(iframeDocument).find('.hbspt-form').prepend(yourRating(btnValue));

            $(iframeDocument).find('.hs_was_this_useful_').addClass('d-none');
            $(iframeDocument).find('.hs-message').removeClass('d-none');
            $(iframeDocument).find('.hs-email').parent().removeClass('d-none');
            $(iframeDocument).find('.hs_submit').removeClass('d-none');

            hsFeedbackForm.notifyParentOfContentChange();
        })
    },

    setChangeRatingFunction: () => {
        $(iframeDocument).on('click', 'button[siteFunction="hsFormChangeRating"]', () => {
            hsFeedbackForm.hideFormExtraControls();
            $(iframeDocument).find('.hs_was_this_useful_').removeClass('d-none');
            $(iframeDocument).find('div[siteFunction="hsFormChangeRatingContainer"]').remove();
            
        });
    },

    fixMessageTextareaHeight: () => {
        $(iframeDocument).find('.hs-message').css('height', '100px');
    },

    prettyRadioButtons: () => {
        const $newYesBtnLabel = $(
            `
                <span 
                    class="d-flex align-items-center hsFieldLabel px-3 me-2 btn btn-sm btn-secondary border border-secondary border-opacity-25 shadow-none text-light">
                    <i 
                        class="fs-5 bi bi-hand-thumbs-up me-2" 
                        style="width: 20px; cursor: pointer;">
                    </i>
                    Yes
                </span>
            `
        );

        const $newNoBtnLabel = $(
            `
                <span 
                    class="d-flex align-items-center hsFieldLabel px-3 me-2 btn btn-sm btn-secondary border border-secondary border-opacity-25 shadow-none text-light">
                    <i 
                        class="fs-5 bi bi-hand-thumbs-down me-2" 
                        style="width: 20px; cursor: pointer;">
                    </i>
                    No
                </span>
            `
        );

        let $yesBtn = $(iframeDocument).find('ul[role="checkbox"]').children().first();
        $yesBtn.find('input').addClass('d-none');
        // we don't remove the old label because is used to read the button label in hsFeedbackForm.setWasThisUsefullFunction
        $yesBtn.find('.hsFieldLabel').addClass('d-none'); 
        $yesBtn.addClass('p-0')
        $yesBtn.find('label').append($newYesBtnLabel);

        let $noBtn = $(iframeDocument).find('ul[role="checkbox"]').children().last();
        $noBtn.find('input').addClass('d-none');
        $noBtn.find('.hsFieldLabel').addClass('d-none');
        $noBtn.addClass('p-0')
        $noBtn.find('label').append($newNoBtnLabel);

        $(iframeDocument).find('ul[role="checkbox"]').addClass('d-flex align-items-center');

    },

    notifyParentOfContentChange: () => {
        parent.postMessage({ type: 'contentChanged' }, '*');
    }
    
};

hsFeedbackForm.doTheWork();


