/**
 * @ngdoc service
 * @module apps.authoring.suggest
 * @name SuggestService
 * @requires api
 * @requires autosave
 * @description SuggestService handles the retrieval and synchronisation of live
 * suggest data. Users may use this service to trigger refreshes within the live
 * suggestions panel, as well as set it as active or inactive.
 */
export default class SuggestService {
    constructor(api, autosave) {
        this.autosave = autosave;
        this.api = api;

        /**
         * @ngdoc property
         * @name SuggestService#active
         * @type {Boolean}
         * @private
         * @description Active reflects whether the service and panel are active
         * (visible) if true. Should not be set directly, instead, use
         * SuggestService#setActive method.
         * @see SuggestService#setActive
         */
        this.active = false;

        /**
         * @ngdoc property
         * @name SuggestService#_listener
         * @type {Function}
         * @private
         * @description Holds the function that will be called when new suggestions
         * have been received.
         */
        this._listener = data => {};
    }

     /**
      * @ngdoc method
      * @name SuggestService#_get
      * @param {(Array|Object)} item Array of items or item.
      * @returns {Promise} If resolved, suggestions were obtained successfully,
      * and all listeners were triggered.
      * @private
      * @description Requests a list of suggestions from the server and triggers
      * all listeners on success.
      */
    _get(item) {
        let isArray = Array.isArray(item) && item.length > 0;
        let isObject = angular.isObject(item) && item.hasOwnProperty('_id');

        if (!isArray && !isObject) {
            return;
        }

        let id = isArray ? item[0]._id : item._id;

        return this.api
            .get(`suggestions/${id}`)
            .then(this._triggerListeners.bind(this));
    }

    /**
     * @ngdoc method
     * @name SuggestService#_triggerListeners
     * @param {Array} list List of items received from server.
     * @private
     * @description Triggers registered listeners.
     */
    _triggerListeners(list) {
        this._listener(list);
    }

    /**
     * @ngdoc method
     * @name SuggestService#onUpdate
     * @param {Function} func The function to trigger on update.
     * @description Registers the function to be called when new suggestions are
     * received. The current implementation will only use one function. On subsequent
     * calls, it will be overwritten.
     */
    onUpdate(func) {
        this._listener = func;
    }

    /**
     * @ngdoc method
     * @name SuggestService#setActive
     * @param {Boolean} active When set to true, the service is set to active.
     * @description setActive sets the active state of the service.
     */
    setActive(active = true) {
        this.active = !!active; // force bool
    }

    /**
     * @ngdoc method
     * @name SuggestService#trigger
     * @param {Object} item The item to trigger live suggestions for.
     * @param {Object} orig The original, unmodified item.
     */
    trigger(item, orig) {
        if (!angular.isObject(item) || !this.active) {
            return;
        }
        this.autosave.save(item, orig, 0).then(this._get.bind(this));
    }
}

SuggestService.$inject = ['api', 'autosave'];
