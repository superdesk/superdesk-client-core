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
        var dt = event.dataTransfer || event.originalEvent.dataTransfer;

        dt.setData('application/superdesk.item.' + item.type, angular.toJson(item));
        dt.effectAllowed = 'link';

        if (item.renditions && item.renditions.thumbnail) {
            var img = new Image();
            var rendition = item.renditions.thumbnail;

            img.src = rendition.href;
            img.width = rendition.width;
            dt.setDragImage(img, rendition.width / 2, rendition.height / 2);
        }
    };
}
