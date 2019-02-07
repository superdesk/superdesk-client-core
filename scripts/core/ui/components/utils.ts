import $ from 'jquery';
import {get} from 'lodash';

/**
 * @ngdoc method
 * @name onEventCapture
 * @param {Object} event
 * @description Provides boiler plate event handling
 */
export const onEventCapture = (event) => {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
};

/**
 * @ngdoc method
 * @name scrollListItemIfNeeded
 * @param {number} selectedIndex
 * @param {Object} listRefElement
 * @description Scroll an item in a unordered scrollable list based on index to be visible in the list
 */
export const scrollListItemIfNeeded = (selectedIndex, listRefElement) => {
    if (listRefElement.children.length > 0) {
        const activeElement = listRefElement.children[selectedIndex];

        if (activeElement) {
            const distanceOfSelItemFromVisibleTop = $(activeElement).offset().top -
                $(document).scrollTop() -
            $(listRefElement).offset().top - $(document).scrollTop();

            // If the selected item goes beyond container view, scroll it to middle.
            if (distanceOfSelItemFromVisibleTop >=
                    (listRefElement.clientHeight - activeElement.clientHeight) ||
                    distanceOfSelItemFromVisibleTop < 0) {
                $(listRefElement).scrollTop($(listRefElement).scrollTop() +
                    distanceOfSelItemFromVisibleTop -
                listRefElement.offsetHeight * 0.5);
            }
        }
    }
};

/**
 * @ngdoc method
 * @name isNotForPublication
 * @param {Object} item
 * @returns {Boolean}
 * @description Checks if an item is marked 'not for publication'
 */
export const isNotForPublication = (item) => get(item, 'flags.marked_for_not_publication', false);

/**
 * @ngdoc method
 * @name firstCharUpperCase
 * @param {String} item
 * @returns {String}
 * @description Converts first case of a string to upper case
 */
export const firstCharUpperCase = (string) => string && string.replace(/\b\w/g, (l) => l.toUpperCase());
