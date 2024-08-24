// HubSpot integration
hsIntegrate = {

    hsForm: (
        formContainerSelector, 
        page, 
        formSettings, 
        formIdentification, 
        callbackOnFormReady = null, 
        callbackOnBeforeFormSubmit = null,
        callbackOnFormSubmitted = null,
        callbackOnBeforeFormInit = null
    ) => {

        const loading = 
            `
                <div id="hsFormLoading" class="d-flex justify-content-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            `;

        // hide the form to avoid white flicker on dark theme and load a spinner
        $(formContainerSelector).parent().prepend(loading);
        $(formContainerSelector).hide();

        const createForm_ASYNC = (
            formContainerSelector, 
            page, 
            formSettings, 
            formIdentification, 
            callbackOnFormReady = null, 
            callbackOnBeforeFormSubmit = null,
            callbackOnFormSubmitted = null,
            callbackOnBeforeFormInit = null
        ) => {
            return new Promise ( (resolve, reject) => {
                try {
                    hbspt.forms.create({
                        region: `${formIdentification.region}`,
                        portalId: `${formIdentification.portalID}`,
                        formId: `${formIdentification.formID}`,
                        formInstanceId: uuid(),
                        target: `${formContainerSelector}`,
                        submitText: `${formSettings.submitText}`,
                        submitButtonClass: `${formSettings.submitButtonClass}`,
                        onFormReady: function($form) {
                            try {
    
                                pushHSFormToHSFormsList($form);
        
                                hsIntegrate.loadScriptsAndStyles($form, formSettings.css, formSettings.js);
                                hsIntegrate.applyCSSCorrection($form, page);
        
                                // set some observers inside the form iFrame
                                // used to style elements that are dynamically shown (i.e error messages)
                                // but can be used for other purposes too
                                hsIntegrate.setFormObservers($form);

                                // show the form with after a small delay to avoid white flicker on dark theme
                                setTimeout(()=>$(formContainerSelector).show(), 100);
        
                                if(callbackOnFormReady) callbackOnFormReady($form);
                            } catch (e) {
                                console.error(`An error occurred in onFormReady for ${formIdentification.formID}:`, e);
                            }
                        },
                        onBeforeFormSubmit: function($form, data) {
                            try {
                                const emailObject = _.find(data, { name: "email" });
                                if (emailObject && _.isEmpty(emailObject.value)) $form.find('input[name=email]').val('visitor@noreply.com');
                                $form.find(`input[name="${settings.hsIntegration.forms.submisionSource.propName}"]`).val(settings.hsIntegration.forms.submisionSource.propValue);
                                hsIntegrate.sanitizeAll($form);
        
                                if(callbackOnBeforeFormSubmit) callbackOnBeforeFormSubmit($form, data);
                            }
                            catch (e) {
                                console.error(`An error occurred in onBeforeFormSubmit for ${formIdentification.formID}:`, e);
                            }
                        },
                        onFormSubmitted: function($form, data) {
                            try {
                                // ... do something ...
                                if(callbackOnFormSubmitted) callbackOnFormSubmitted($form, data);
                            }
                            catch (e) {
                                console.error(`An error occurred in onFormSubmitted for ${formIdentification.formID}:`, e);
                            }
                        },
                        onBeforeFormInit: (ctx) => {
                            callbackOnBeforeFormInit(ctx);
                        }
                    });
                } catch (e) {
                    console.error(`An error occurred while creating the form ${formIdentification.formID}:`, e);
                }
                resolve();
            });
        }

        createForm_ASYNC(
            formContainerSelector, 
            page, 
            formSettings, 
            formIdentification, 
            callbackOnFormReady, 
            callbackOnBeforeFormSubmit, 
            callbackOnFormSubmitted, 
            callbackOnBeforeFormInit
        )
        .then(() => {
            // remove the spinner
            setTimeout(()=>$('#hsFormLoading').remove(),100); 
        });
        
    },

    sanitizeAll: ($form) => {
        $form.find('textarea').each( function() {
            const fieldContent = $(this).val();
            //console.log(fieldContent)
            $(this).val(DOMPurify.sanitize(fieldContent));
        });

        $form.find('input[type="text"]').each( function() {
            const fieldContent = $(this).val();
            $(this).val(DOMPurify.sanitize(fieldContent));
        })
    },

    loadScriptsAndStyles: ($form, cssScripts, jsScripts) => {
        iframe__addBootstrapToIFrames($form);
        iframe__addCustomScriptsToIFrames($form, cssScripts, jsScripts);
    },

    applyCSSCorrection: ($form, page = null) => {
        // general css settings
        // form particular css settings can be made directly in callbackOnFormReady
        const $iframeDocument = $form[0].ownerDocument;
        const $iframeBody = $($iframeDocument).find('body');
        const $iframeHtml = $($iframeDocument).find('html');

        if (page) $iframeBody.attr('pagePermalinkRef', page.permalink).attr('pageTitleRef', page.title);

        $iframeBody.css('background', $('body').css('background'));
        $iframeBody.css('font-family', $('body').css('font-family'));
        $iframeHtml.css('background', $('body').css('background'));
        $form.css('background', $('body').css('background'));

        $iframeBody.find('iframe').on('load', function() {
            $(this).css('height', '0px')
            $(this).parent().css('height', '0px')
        })

        $form.find('label').find('span')
            .css('color', $('body').css('color'))
            .addClass('text-secondary hsFieldLabel')
            .css('font-family', $('body').css('font-family'));

        $form.find('p')
            .css('color', $('body').css('color'))
            .css('font-family', $('body').css('font-family'))
            .css('font-size', $('body').css('font-size'));
        
        $iframeBody.find('p')
            .css('color', $('body').css('color'))
            .css('font-family', $('body').css('font-family'))
            .css('font-size', $('body').css('font-size'))
            .addClass('fw-medium');

        $iframeBody.find('.actions').addClass('p-0 m-0');

        $form.find('textarea')
            .css('background', $('body').css('background'))
            .css('color', $('body').css('color'))
            .addClass('border border-secondary border-opacity-25 textAreaText');
        
        $form.find('input[type!="submit"]')
            .css('background', $('body').css('background'))
            .css('color', $('body').css('color'))
            .addClass('border border-secondary border-opacity-25 inputField');
    },

    setFormObservers: ($form) => {
        // field validation error messages
        iframe__setElementCreateBySelectorObserver($form,settings.hsIntegration.forms.elements.fieldValidationErrorMessagesGroup, ()=>{
            const $iframeDocument = $form[0].ownerDocument;
            const $iframeBody = $($iframeDocument).find('body');
            $iframeBody.find('.hs-error-msg')
                .css('font-family', $('body').css('font-family'))
                .addClass('fieldValidationErrorMessage')
                .text('REQUIRED');
        });

        // form error message
        iframe__setElementCreateBySelectorObserver($form,settings.hsIntegration.forms.elements.formErrorMesage, ()=>{
            const $iframeDocument = $form[0].ownerDocument;
            const $iframeBody = $($iframeDocument).find('body');
            $iframeBody.find('.hs_error_rollup').addClass('d-none');
            showToast(`Please fill in the required information`, 'bg-danger', 'text-light');
        });

        // text after form is submitted
        iframe__setElementCreateBySelectorObserver($form,settings.hsIntegration.forms.elements.submittedMessage, ()=>{
            const $iframeDocument = $form[0].ownerDocument;
            const $iframeBody = $($iframeDocument).find('body');
            $iframeBody.find('.submitted-message')
                .css('font-family', $('body').css('font-family'))
                .css('color', $('body').css('color'));
        })
    }

}