const {settings, pageSettings, hsSettings} = window.parent.utilities;
const { showToast, doTranslation } = window.parent.utilities.func;

hsFeedbackForm = {
    doTheWork: () => {
        
        if (mainJQuery) {
            $(hsFeedbackForm.iframeDocument).ready(function() {
                hsFeedbackForm.addMarkersForTranslation();

                hsFeedbackForm.prettyRadioButtons();
                hsFeedbackForm.fixMessageTextareaHeight(); // should be fixed to a certain height, otherwise has the tendency to grow
                hsFeedbackForm.setWasThisUsefullFunction();
                hsFeedbackForm.setChangeRatingFunction();
                hsFeedbackForm.hideFormExtraControls();

                hsFeedbackForm.translateForm();
            });
        } else {
            iframeDocument.body.innerHTML = '';
            setTimeout(() => {
                hsFeedbackForm.notifyParentOnIFrameZeroHeight($(window.frameElement).attr('iframe-data-id'));
                showToast(`Something went wrong, cannot execute functions! Details in console ...`, 'bg-danger', 'text-light');
                console.error(`jQuery is not available in this context (or iframe), although it should be! Check <iframe iframe-data-id="${$(window.frameElement).attr('iframe-data-id')}" ... >`)
            }, 200);
        }
    },

    addMarkersForTranslation: () => {
        //submit button text
        $(iframeDocument).find('input[type="submit"]').attr('data-i18n', '[value]hs_feedback_form_submit_btn_text'); 

        // email field placeholder
        $(iframeDocument).find('input[name="email"]').attr('data-i18n', '[placeholder]hs_feedback_form_email_placeholder_text'); 

        // message field placeholder
        $(iframeDocument).find('textarea[name="message"]').attr('data-i18n', '[placeholder]hs_feedback_form_message_placeholder_text');

        // was_this_useful radio button field label
        $(iframeDocument)
            .find('div.hs-fieldtype-radio')
            .find('span.hsFieldLabel').first()
            .attr('data-i18n', 'hs_feedback_form_message_was_this_useful_radio_btn_label');

    },

    hideFormExtraControls: () => {
        $(iframeDocument).find('.hs_submit').addClass('d-none');
        $(iframeDocument).find('.hs-message').addClass('d-none')
        $(iframeDocument).find('.hs-email').parent().addClass('d-none');
        hsFeedbackForm.notifyParentOfContentChange();
    },

    setWasThisUsefullFunction: () => {
        const yourRating =  (rating) => {
            const ratingTextClass = 
                rating === $(iframeDocument).find('span[data-i18n="hs_feedback_form_yes_label"]').parent().parent().find('input').attr('value') 
                    ? 'text-success' 
                    : 'text-danger';

            const i18ratingConfirmationText = 
                rating === $(iframeDocument).find('span[data-i18n="hs_feedback_form_yes_label"]').parent().parent().find('input').attr('value') 
                    ? 'hs_feedback_form_was_this_useful_confirmation_text_yes' 
                    : 'hs_feedback_form_was_this_useful_confirmation_text_no';
            
            return (
                `
                    <div 
                        siteFunction="hsFormChangeRatingContainer" 
                        class="d-flex justify-content-between align-items-center mb-2"
                        style="visibility:hidden">
                        <div class="hsFormRegularText text-secondary">
                            <span data-i18n="hs_feedback_form_was_this_useful_text">
                                Was this useful: 
                            </span>
                            <span 
                                siteFunction="hs_feedback_form_was_this_useful_confirmation_text" 
                                class="${ratingTextClass}"
                                data-i18n="${i18ratingConfirmationText}">
                                ${rating}
                            </span>
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
            if (btnValue === $(iframeDocument).find('span[data-i18n="hs_feedback_form_yes_label"]').parent().parent().find('input').attr('value')) {
                $(this).prop('checked', true);
            }
            else {
                $(this).prop('checked', false);
            }

            if ($(iframeDocument).find('div[siteFunction="hsFormChangeRatingContainer"]').length === 0){
                $(iframeDocument).find('.hbspt-form').prepend(yourRating(btnValue));
                setTimeout(()=> {
                    $(iframeDocument).find('div[siteFunction="hsFormChangeRatingContainer"]').css('visibility', 'visible')
                }, 100);
            }

            hsFeedbackForm.translateForm();

            $(iframeDocument).find('.hs_was_this_useful_').addClass('d-none');
            $(iframeDocument).find('.hs-message').removeClass('d-none');
            $(iframeDocument).find('.hs-email').parent().removeClass('d-none');
            $(iframeDocument).find('.hs_submit').removeClass('d-none');
            
        })
    },

    translateForm: () => {
        doTranslation(true, iframeDocument.body).then(()=>{
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
                    <span
                        class="text-light" 
                        data-i18n="hs_feedback_form_yes_label">
                        Yes
                    </span>
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
                    <span
                        class="text-light" 
                        data-i18n="hs_feedback_form_no_label">
                        No
                    </span>
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
    },

    notifyParentOnIFrameZeroHeight: (iframeID) => {
        parent.postMessage({ type: 'iFrameZeroHeight', iframeID: iframeID }, '*');
    }
};

hsFeedbackForm.doTheWork();


