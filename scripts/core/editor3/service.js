import * as action from './actions/find-replace';

/**
 * @type {Object} Redux store
 * @description Holds the store of the currently active body editor of the open article.
 * @private
 */
let store = null;

/**
 * @ngdoc service
 * @module superdesk.core.editor3
 * @name editor3
 * @description editor3 is the service that allows interacting with the editor from
 * the outside. It uses the same interface as the editor service of core/editor2/editor.js
 * to allow plugging one or the other based on the editor of the item being edited.
 */
export class EditorService {
    /**
     * @ngdoc method
     * @name editor3#setStore
     * @param {Object} redux store
     * @description Registers the passed redux store with the service.
     */
    setStore(s) {
        store = s;
    }

    /**
     * @ngdoc method
     * @name editor3#selectNext
     * @description Triggers the action to select the next occurence of the search
     * criteria in the editor.
     */
    selectNext() {
        store.dispatch(action.findNext());
    }

    /**
     * @ngdoc method
     * @name editor3#selectPrev
     * @description Triggers the action to select the previous occurence of the search
     * criteria in the editor.
     */
    selectPrev() {
        store.dispatch(action.findPrev());
    }

    /**
     * @ngdoc method
     * @name editor3#replace
     * @param {string} txt
     * @description Replaces the currently highlighted search criteria with the given text.
     */
    replace(txt) {
        store.dispatch(action.replace(txt));
    }

    /**
     * @ngdoc method
     * @name editor3#replace
     * @param {string} txt
     * @description Replaces all the search criteria with the given text.
     */
    replaceAll(txt) {
        store.dispatch(action.replaceAll(txt));
    }

    /**
     * @ngdoc method
     * @name editor3#setSettings
     * @param {Object} findReplace The new search criteria. An object containing the keys
     * caseSensitive (boolean) and diff (object having one key that is the pattern).
     * @description Updates the search criteria.
     */
    setSettings({findreplace}) {
        if (findreplace === null) {
            store.dispatch(action.setHighlightCriteria({pattern: ''}));

            return;
        }

        const {diff, caseSensitive} = findreplace;
        const pattern = Object.keys(diff || {})[0] || '';

        store.dispatch(action.setHighlightCriteria({pattern, caseSensitive}));
    }

    /**
     * @ngdoc method
     * @name editor3#render
     * @description Highlights the current search criteria in the editor.
     */
    render() {
        store.dispatch(action.renderHighlights());
    }
}
