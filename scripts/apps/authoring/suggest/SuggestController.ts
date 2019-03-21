/**
 * @ngdoc controller
 * @module superdesk.apps.authoring
 * @name SuggestController
 * @requires desks
 * @requires https://docs.angularjs.org/api/ng/type/$rootScope.Scope $scope
 * @description SuggestController holds a set of convenience functions used by
 * sdSuggest.
 * @see sdSuggest
 */
export default class SuggestController {
    desks: any;
    scope: any;

    constructor(desks, scope) {
        this.desks = desks;
        this.scope = scope;
    }

    /**
     * @ngdoc method
     * @name SuggestController#displayName
     * @param {String} userId The ID of the user to look up.
     * @returns {String} The resolved user.
     * @description Gets the display name for the given user ID, otherwise returns
     * the string "-".
     */
    displayName(userId) {
        let usr = this.desks.userLookup[userId];

        return usr ? usr.display_name || '-' : '-';
    }

    /**
     * @ngdoc method
     * @name SuggestController#close
     * @description Closes the panel and resets it.
     */
    close() {
        this.scope.showItem = null;
        this.scope.ngShow = false;
    }

    /**
     * @ngdoc method
     * @name SuggestController#showItem
     * @param {Object} item The item to show.
     * @description Shows the passed item in the live suggestions panel.
     */
    showItem(item) {
        this.scope.showItem = item;
    }

    /**
     * @ngdoc method
     * @name SuggestController#hideItem
     * @description Resets the panel to the list view. This is used when a user
     * wants to go back from the item view to the list view.
     */
    hideItem() {
        this.scope.showItem = null;
    }
}

SuggestController.$inject = ['desks', '$scope'];
