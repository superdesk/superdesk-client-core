import _ from 'lodash';

/**
 * @ngdoc service
 * @name serverConfig
 * @module superdesk.core.services
 * @requires api
 * @description Server config service.
 */
export class ServerConfigService {
    api: any;

    constructor(api) {
        this.api = api;
    }
    /**
         * @ngdoc method
         * @name api#save
         * @public
         * @description
         * Save an item
         */

    /**
     * @ngdoc method
     * @name serverConfig#get
     * @public
     * @description
     * Get config value
     *
     * @param {String} key
     * @param {String} path
     * @return {Promise}
     */
    get(key, path) {
        return this.api.find('config', key).then((config) => _.get(config.val, path));
    }

    /**
     * @ngdoc method
     * @name serverConfig#set
     * @public
     * @description
     * Set config
     *
     * @param {String} key
     * @param {Object} val
     * @return {Promise}
     */
    set(key, val) {
        return this.api.save('config', {_id: key, val: val});
    }
}

ServerConfigService.$inject = ['api'];
