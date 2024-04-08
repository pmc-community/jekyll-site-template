/* SOME UTILITIES ADDED TO JQUERY*/
// check if an element is on screen
$.fn.is_on_screen = function () {
    var win = $(window);
    var viewport = {
        top: win.scrollTop(),
        left: win.scrollLeft()
    };
    viewport.right = viewport.left + win.width();
    viewport.bottom = viewport.top + win.height();

    var bounds;
    bounds = this.offset();
    bounds.right = bounds.left + this.outerWidth();
    bounds.bottom = bounds.top + this.outerHeight();

    return (!(viewport.right < bounds.left || viewport.left > bounds.right || viewport.bottom < bounds.top || viewport.top > bounds.bottom));
};

// usage: $().sizeChanged(function(){})
$.fn.sizeChanged = function (handleFunction) {
    var element = this;
    var lastWidth = element.width();
    var lastHeight = element.height();

    setInterval(function () {
        if (lastWidth === element.width()&&lastHeight === element.height())
            return;
        if (typeof (handleFunction) == 'function') {
            handleFunction({ width: lastWidth, height: lastHeight },
                            { width: element.width(), height: element.height() });
            lastWidth = element.width();
            lastHeight = element.height();
        }
    }, 100);
    return element;
};

 
// init page toc
$(function () {
    var navSelector = "#toc";
    var $myNav = $(navSelector);
    Toc.init($myNav);
    $("body").scrollspy({
      target: navSelector,
    });
  });

const removeChildrenExceptFirst = (nodeSelector) => {
    var $node = $(nodeSelector);
    var $children = $node.children();
    var $childrenToRemove = $children.not(':first-child');
    $childrenToRemove.remove();
}

// gnerate uuid
uuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        // eslint-disable-next-line
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// read external contens between markers
const getExternalMDContent = async (file, position, startMarker , endMarker, header, whereID, whoCalled) => {
    $(window).on('load', () => {
        // prevent returning unwanted quantity of content
        if (typeof startMarker === 'undefined' ||  typeof endMarker === 'undefined' ) return;
        if (startMarker.trim() === '' && endMarker.trim() === '') return;
        
        // getting the content from external md
        // comments in the form of '<!- comment ... ->' are ignored when converting from md to hmml
        $.ajax({
            url: file,
            method: "GET",
            dataType: "text",
            success: async (data) => {
                const converter = new showdown.Converter();
                const content = await data;
                goodHeader = typeof header === 'undefined' ? '' : header;
                let contentSliced = goodHeader + '\n';
                const startIndex = startMarker === 'fullFile' ? 0 : content.indexOf(startMarker) + startMarker.length;
                const contentA = content.slice(startIndex);
                const endIndex = endMarker === 'fullFile' ? contentA.length+1 : contentA.indexOf(endMarker) ;
                const contentB = contentA.slice(0,endIndex);
                contentSliced += contentB;

                contentSliced = converter.makeHtml(contentSliced);

                let contentPlaceholder = '';

                const contentPlaceholderID = whereID ? whereID : uuid();
                if(!whereID) contentPlaceholder = `<div id=${contentPlaceholderID}><div>`;

                constContentPosition = typeof position === 'undefined' || position === '' ? 'after' : position;
                if (constContentPosition === 'before') $('.main-content main').prepend(contentPlaceholder);
                if (constContentPosition === 'after') $('.main-content main').append(contentPlaceholder);
                
                $(`#${contentPlaceholderID}`).html(contentSliced);

                // refresh the ToC
                initPageToc();
                
                // move the top of page where it should be
                if (position === 'before') {
                    $('#ihs_top_of_page').remove();
                    addTopOfPage();
                }
            },
            error: async (xhr, status, error) => {
                toast = new bootstrap.Toast($('.toast'));
                $('.toast-body').html('Error loading external content. Details in console ...');
                toast.show();
                const placeholder = position === 'before' || position === 'after' ? 'N/A for this position' : whereID;
                console.error(`Error fetching file: ${file}\nStatus: ${status} / ${xhr.responseText}\nPosition: ${position}\nPlaceholder: ${placeholder}\nOrigin: ${whoCalled}`,error
                );
            }
        });
    })   
}
/* NOT USED
const  updateAlgoliaIndex = (newData) => {
    // Initialize Algolia client
    const client = algoliasearch('xxxx', 'xxxxx');
    
    // Initialize index
    const index = client.initIndex('xxxx');

    // Add or update records in the index
    index.saveObjects([{"1":1},{"2":2}],{ autoGenerateObjectIDIfNotExist: true }).then(({ objectIDs }) => {
        // Optionally, refresh Instant Search UI
        InstantSearch.refresh();
    }).catch(error => {
        console.error('Error updating index:', error);
    });
}
*/