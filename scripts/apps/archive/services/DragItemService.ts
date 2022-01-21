/**
 * NOTICE:
 * if you want to test drag image in chrome, make sure to close dev tools first,
 * otherwise this thumbnail image might not be displayed, depends on some performance settings there.
 */

const DRAG_IMAGE_HOLDER = 'drag-image-holder';

/**
 * Using div with max width/height to resize thumbnail image.
 *
 * link: https://stackoverflow.com/a/26347784
 */
const getThumbnailPlaceholder = () => {
    let div = document.getElementById(DRAG_IMAGE_HOLDER);

    if (div == null) {
        div = document.createElement('div');
        div.id = DRAG_IMAGE_HOLDER;
        document.body.appendChild(div);
    } else {
        div.innerHTML = ''; // removes all children
    }

    return div;
};

/**
 * Service to handle item dragging
 */
export function DragItemService() {
    /**
     * Start dragging an item - add item data to event
     *
     * @param {Event} event
     * @param {Object} item
     */
    this.start = function(event, item) {
        const dt = event.dataTransfer || event.originalEvent.dataTransfer;
        const mimetypes = ['application/superdesk.item.' + item.type];

        // search providers can specify custom mimetype
        // which we use for filtering on drop event
        if (item.mimetype && item.mimetype.includes('application')) {
            mimetypes.push(item.mimetype);
        }

        mimetypes.forEach((mimetype) => {
            dt.setData(mimetype, angular.toJson(item));
        });

        dt.effectAllowed = 'link';

        if (item.renditions && item.renditions.thumbnail) {
            const img = document.createElement('img');
            const div = getThumbnailPlaceholder();
            const rendition = item.renditions.thumbnail;

            img.src = rendition.href;
            div.appendChild(img);
            dt.setDragImage(div, 5, 5);
        }
    };
}
