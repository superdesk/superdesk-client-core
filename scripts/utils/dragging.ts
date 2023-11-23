import {IArticle} from 'superdesk-api';

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

export function dragStart(event, item) {
    const dataTransfer = event.dataTransfer || event.originalEvent.dataTransfer;
    const mimeTypes = ['application/superdesk.item.' + item.type];

    // search providers can specify custom mimetype
    // which we use for filtering on drop event
    if (item.mimetype && item.mimetype.includes('application')) {
        mimeTypes.push(item.mimetype);
    }

    mimeTypes.forEach((mimetype) => {
        dataTransfer.setData(mimetype, angular.toJson(item));
    });

    dataTransfer.effectAllowed = 'link';

    // // DOESN'T WORK ON CHROME 106
    // if (item.renditions && item.renditions.thumbnail) {
    //     const img = document.createElement('img');
    //     const div = getThumbnailPlaceholder();
    //     const rendition = item.renditions.thumbnail;

    //     img.src = rendition.href;
    //     div.appendChild(img);
    //     dt.setDragImage(div, 5, 5);
    // }
}

/**
 * Get superdesk supported type for data transfer if any
 *
 * @param {Event} event
 * @param {Boolean} supportExternalFiles
 * @return {string}
 */
export const getSuperdeskType = (event, supportExternalFiles = true) => {
    const evt = event.originalEvent ?? event;

    return evt.dataTransfer.types.find((name) =>
        name.includes('application/superdesk') || supportExternalFiles && name === 'Files',
    );
};

export function getDroppedItem(event): IArticle | null {
    const superdeskType = getSuperdeskType(event);

    if (superdeskType == null || superdeskType === 'Files') {
        return null;
    }

    const __item: IArticle = JSON.parse(event.dataTransfer.getData(superdeskType));

    return __item;
}